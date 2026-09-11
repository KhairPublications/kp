/**
 * Post-build validation for the generated site.
 *
 * Checks every page in dist/ for:
 *   - internal links that point at a file which was not built
 *   - <img>/<source>/<iframe> assets that are missing from the output
 *   - pages missing a title, description, or <h1>
 *   - duplicate element ids
 *
 * Exits non-zero when anything fails, so CI can gate on it.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist");

const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;

const errors = [];
const warnings = [];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function attrValues(html, tag, attr) {
  const re = new RegExp(`<${tag}\\b[^>]*?\\b${attr}\\s*=\\s*["']([^"']+)["']`, "gi");
  return [...html.matchAll(re)].map((m) => m[1]);
}

/** Resolve a site-relative or document-relative reference to a dist path. */
function resolveRef(ref, pageFile) {
  const clean = ref.split("#")[0].split("?")[0];
  if (!clean) return null;
  if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(clean)) return null;

  return clean.startsWith("/")
    ? path.join(DIST, clean)
    : path.resolve(path.dirname(pageFile), clean);
}

function checkPage(file) {
  const rel = path.relative(DIST, file).replace(/\\/g, "/");
  const html = readFileSync(file, "utf8");

  // --- Required metadata -------------------------------------------------
  if (!/<title>[^<]+<\/title>/i.test(html)) {
    errors.push(`${rel}: missing a non-empty <title>`);
  }
  if (!/<meta\s+name=["']description["']\s+content=["'][^"']+["']/i.test(html)) {
    errors.push(`${rel}: missing a meta description`);
  }
  if (!/<h1[\s>]/i.test(html)) {
    warnings.push(`${rel}: no <h1> element`);
  }

  // --- Duplicate ids -----------------------------------------------------
  const ids = attrValues(html, "[a-z0-9-]+", "id");
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) errors.push(`${rel}: duplicate id "${id}"`);
    seen.add(id);
  }

  // --- References --------------------------------------------------------
  const refs = [
    ...attrValues(html, "a", "href"),
    ...attrValues(html, "link", "href"),
    ...attrValues(html, "img", "src"),
    ...attrValues(html, "source", "srcset"),
    ...attrValues(html, "script", "src"),
    ...attrValues(html, "iframe", "src"),
  ];

  // srcset values on <img> carry width descriptors and multiple candidates.
  for (const srcset of attrValues(html, "img", "srcset")) {
    for (const candidate of srcset.split(",")) {
      refs.push(candidate.trim().split(/\s+/)[0]);
    }
  }

  for (const ref of refs) {
    const target = resolveRef(ref, file);
    if (!target) continue;
    if (!existsSync(target)) {
      errors.push(`${rel}: broken reference -> ${ref}`);
    }
  }

  // --- Alt text ----------------------------------------------------------
  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  for (const tag of imgTags) {
    if (!/\balt\s*=/.test(tag)) {
      warnings.push(`${rel}: <img> without alt attribute`);
    }
  }
}

function main() {
  if (!existsSync(DIST)) {
    console.error(red("dist/ not found. Run `npm run build` first."));
    process.exit(1);
  }

  const files = walk(DIST);
  const pages = files.filter((f) => f.endsWith(".html"));

  if (pages.length === 0) {
    console.error(red("No HTML pages found in dist/."));
    process.exit(1);
  }

  pages.forEach(checkPage);

  console.log(`\nChecked ${pages.length} pages and ${files.length} output files.\n`);

  for (const w of warnings) console.log(`${yellow("warn")}  ${w}`);
  for (const e of errors) console.log(`${red("error")} ${e}`);

  if (errors.length) {
    console.log(red(`\n${errors.length} error(s), ${warnings.length} warning(s).\n`));
    process.exit(1);
  }

  console.log(green(`\nAll checks passed (${warnings.length} warning(s)).\n`));
}

main();

/**
 * Build-time image optimisation.
 *
 * Converts every JPEG and PNG under src/assets/images into AVIF and WebP,
 * plus responsive JPEG fallbacks, so pages can serve a modern format at the
 * size the layout actually needs.
 *
 * Adapted from the equivalent script in the sibling `sms` project. The main
 * difference is that this repository groups images into subdirectories
 * (books/, team/, board/, seminar/, brand/), so each group gets its own
 * `optimized/` folder rather than everything landing in one flat directory.
 *
 * Output naming, which templates and the `optimizedImage` macro rely on:
 *
 *   <name>.avif          full size, AVIF
 *   <name>.webp          full size, WebP
 *   <name>.jpg           full size, JPEG fallback
 *   <name>-300.jpg       responsive JPEG fallbacks
 *   <name>-600.jpg
 *   <name>-1200.jpg
 *
 * Usage:
 *   npm run optimize-images                  process everything that is stale
 *   npm run optimize-images -- --force       rebuild every derivative
 *   npm run optimize-images -- books/x.png   process specific files
 */

import { readdir, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMAGE_ROOT = path.join(ROOT, "src/assets/images");

const OPTIMIZED_DIR = "optimized";
const SOURCE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

// Output folders, and source artwork that is never served directly.
const SKIP_DIRS = new Set([OPTIMIZED_DIR, "_originals"]);

const WEBP_QUALITY = 80;
const AVIF_QUALITY = 60;
const JPEG_QUALITY = 80;
const MAX_WIDTH = 1920;
const RESPONSIVE_WIDTHS = [300, 600, 1200];

const force = process.argv.includes("--force");
const explicitFiles = process.argv.slice(2).filter((a) => !a.startsWith("--"));

/** Every file under `dir`, skipping any `optimized/` output folders. */
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return SKIP_DIRS.has(entry.name) ? [] : walk(full);
      }
      return [full];
    })
  );
  return nested.flat();
}

async function mtime(file) {
  try {
    return (await stat(file)).mtimeMs;
  } catch {
    return 0;
  }
}

/**
 * Derivatives are regenerated only when the source is newer than the oldest
 * existing output, so repeat runs are cheap.
 */
async function isStale(source, outputBase) {
  if (force) return true;

  const expected = [
    `${outputBase}.avif`,
    `${outputBase}.webp`,
    `${outputBase}.jpg`,
    ...RESPONSIVE_WIDTHS.map((w) => `${outputBase}-${w}.jpg`),
  ];

  const sourceTime = await mtime(source);
  const times = await Promise.all(expected.map(mtime));

  return times.some((t) => t === 0 || t < sourceTime);
}

async function processImage(source) {
  // Keep the extension in its original case for basename(), otherwise an
  // uppercase ".JPG" is not stripped and the derivatives are named
  // "photo.JPG.avif" instead of "photo.avif".
  const ext = path.extname(source);
  if (!SOURCE_EXTENSIONS.has(ext.toLowerCase())) return "skipped";

  const dir = path.dirname(source);
  const name = path.basename(source, ext);
  const outDir = path.join(dir, OPTIMIZED_DIR);
  const outputBase = path.join(outDir, name);

  if (!(await isStale(source, outputBase))) return "current";

  await mkdir(outDir, { recursive: true });

  // Resize once and reuse the result for every format.
  const resized = await sharp(source)
    .rotate() // honour EXIF orientation
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .toBuffer();

  await Promise.all([
    sharp(resized).avif({ quality: AVIF_QUALITY }).toFile(`${outputBase}.avif`),
    sharp(resized).webp({ quality: WEBP_QUALITY }).toFile(`${outputBase}.webp`),
    // PNG sources are usually transparent; flatten onto white so the JPEG
    // fallback does not render the alpha channel as black.
    sharp(resized)
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toFile(`${outputBase}.jpg`),
    ...RESPONSIVE_WIDTHS.map((width) =>
      sharp(resized)
        .resize({ width, withoutEnlargement: true })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toFile(`${outputBase}-${width}.jpg`)
    ),
  ]);

  return "written";
}

async function main() {
  let files;

  if (explicitFiles.length > 0) {
    files = explicitFiles.map((arg) =>
      path.isAbsolute(arg) ? arg : path.resolve(IMAGE_ROOT, arg)
    );
  } else {
    files = (await walk(IMAGE_ROOT)).filter((f) =>
      SOURCE_EXTENSIONS.has(path.extname(f).toLowerCase())
    );
  }

  console.log(`Scanning ${files.length} source image(s)\n`);

  const counts = { written: 0, current: 0, skipped: 0, failed: 0 };

  for (const file of files) {
    const rel = path.relative(IMAGE_ROOT, file).replace(/\\/g, "/");
    try {
      const result = await processImage(file);
      counts[result] += 1;
      if (result === "written") console.log(`  built    ${rel}`);
    } catch (error) {
      counts.failed += 1;
      console.error(`  FAILED   ${rel}: ${error.message}`);
    }
  }

  console.log(
    `\n${counts.written} built, ${counts.current} already current, ` +
      `${counts.skipped} skipped, ${counts.failed} failed`
  );

  if (counts.failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

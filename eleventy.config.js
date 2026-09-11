import path from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { bundle, browserslistToTargets } from "lightningcss";
import browserslist from "browserslist";

const IS_PRODUCTION = process.env.ELEVENTY_RUN_MODE === "build";

/** Folder name that tools/optimize-images.js writes derivatives into. */
const OPTIMIZED_DIR = "optimized";

/**
 * Browser targets for CSS transpilation. Kept in sync with the
 * `browserslist` key in package.json when one is present.
 */
const CSS_TARGETS = browserslistToTargets(
  browserslist("> 0.5%, last 2 versions, not dead")
);

export default function (eleventyConfig) {
  // ---------------------------------------------------------------------
  // Static assets copied verbatim into the build output
  // ---------------------------------------------------------------------
  // Image folders are listed individually rather than copying
  // src/assets/images wholesale, so that _originals/ (unoptimised source
  // artwork) never reaches the build output.
  for (const group of ["board", "books", "brand", "seminar", "team"]) {
    eleventyConfig.addPassthroughCopy({
      [`src/assets/images/${group}`]: `assets/images/${group}`,
    });
  }

  eleventyConfig.addPassthroughCopy({
    "src/assets/documents": "assets/documents",
    "src/assets/js": "assets/js",
    "src/assets/favicon": "assets/favicon",
  });

  // Re-run the build when assets change during `npm run dev`.
  eleventyConfig.addWatchTarget("src/assets/");

  // CSS partials are pulled in through main.css by the bundler, so they must
  // not also be discovered as standalone templates and written to dist/.
  for (const dir of ["base", "components", "utilities", "pages"]) {
    eleventyConfig.ignores.add(`src/assets/css/${dir}/**`);
  }


  // ---------------------------------------------------------------------
  // CSS pipeline: bundle @import graph, transpile, minify in production
  // ---------------------------------------------------------------------
  eleventyConfig.addTemplateFormats("css");
  eleventyConfig.addExtension("css", {
    outputFileExtension: "css",
    compile: async function (_inputContent, inputPath) {
      return async () => {
        const { code } = bundle({
          filename: inputPath,
          minify: IS_PRODUCTION,
          targets: CSS_TARGETS,
        });
        return code.toString();
      };
    },
  });

  // ---------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------

  /** Cache-busting suffix derived from the asset's own mtime. */
  eleventyConfig.addFilter("bust", (url) => {
    const local = path.join("src", url.replace(/^\/+/, ""));
    try {
      const stat = readFileSync(local);
      let hash = 0;
      for (let i = 0; i < stat.length; i += 1) {
        hash = (hash * 31 + stat[i]) >>> 0;
      }
      return `${url}?v=${hash.toString(36)}`;
    } catch {
      return url;
    }
  });

  /** Absolute URL against the configured site origin, for meta tags. */
  eleventyConfig.addFilter("absoluteUrl", (url, base) =>
    new URL(url, base).toString()
  );

  eleventyConfig.addFilter("year", () => new Date().getFullYear());

  // ---------------------------------------------------------------------
  // Shortcodes
  // ---------------------------------------------------------------------

  /**
   * Responsive <picture> for any image that tools/optimize-images.js has
   * processed. Give it the original source path and it works out the
   * derivative paths:
   *
   *   /assets/images/books/book1.jpg
   *     -> /assets/images/books/optimized/book1.{avif,webp,-600.jpg,...}
   *
   * Falls back to a plain <img> on the original when no derivatives exist,
   * so a newly added image still renders before the optimiser has run.
   */
  const RESPONSIVE_WIDTHS = [300, 600, 1200];

  eleventyConfig.addShortcode("image", function (src, alt, options = {}) {
    const {
      sizes = "100vw",
      className = "",
      style = "",
      loading = "lazy",
      widths = RESPONSIVE_WIDTHS,
      width,
      height,
    } = options;

    const dir = path.posix.dirname(src);
    const ext = path.posix.extname(src);
    const name = path.posix.basename(src, ext);
    const base = `${dir}/${OPTIMIZED_DIR}/${name}`;

    const onDisk = (url) => existsSync(path.join("src", url.replace(/^\/+/, "")));
    const available = widths.filter((w) => onDisk(`${base}-${w}.jpg`));

    const dimensions = [
      width && `width="${width}"`,
      height && `height="${height}"`,
    ].filter(Boolean);

    const imgAttrs = (source) =>
      [
        `src="${source}"`,
        `alt="${alt}"`,
        className && `class="${className}"`,
        style && `style="${style}"`,
        ...dimensions,
        `loading="${loading}"`,
        `decoding="async"`,
      ]
        .filter(Boolean)
        .join(" ");

    if (available.length === 0) {
      return `<img ${imgAttrs(src)}>`;
    }

    const fallback = available.includes(600)
      ? `${base}-600.jpg`
      : `${base}-${available[available.length - 1]}.jpg`;

    const srcset = available.map((w) => `${base}-${w}.jpg ${w}w`).join(", ");
    const sources = [
      onDisk(`${base}.avif`) && `<source srcset="${base}.avif" type="image/avif">`,
      onDisk(`${base}.webp`) && `<source srcset="${base}.webp" type="image/webp">`,
    ].filter(Boolean);

    return `<picture>
  ${sources.join("\n  ")}
  <img ${imgAttrs(fallback)} srcset="${srcset}" sizes="${sizes}">
</picture>`;
  });

  // ---------------------------------------------------------------------
  // Output
  // ---------------------------------------------------------------------
  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html", "css"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}

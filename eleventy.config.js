import path from "node:path";
import { readFileSync } from "node:fs";
import { bundle, browserslistToTargets } from "lightningcss";
import browserslist from "browserslist";

const IS_PRODUCTION = process.env.ELEVENTY_RUN_MODE === "build";

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
  eleventyConfig.addPassthroughCopy({
    "src/assets/images": "assets/images",
    "src/assets/documents": "assets/documents",
    "src/assets/js": "assets/js",
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
   * Responsive <picture> for images that have been pre-generated into
   * assets/images/seminar/optimized by tools/optimize-images.
   */
  eleventyConfig.addShortcode(
    "responsiveImage",
    function (name, alt, { sizes = "100vw", className = "", style = "", widths = [300, 600] } = {}) {
      const base = `/assets/images/seminar/optimized/${name}`;
      const srcset = widths.map((w) => `${base}-${w}.jpg ${w}w`).join(", ");
      const attrs = [
        `src="${base}-600.jpg"`,
        `srcset="${srcset}"`,
        `sizes="${sizes}"`,
        `alt="${alt}"`,
        className && `class="${className}"`,
        style && `style="${style}"`,
        `loading="lazy"`,
        `decoding="async"`,
      ]
        .filter(Boolean)
        .join(" ");

      return `<picture>
  <source srcset="${base}.avif" type="image/avif">
  <source srcset="${base}.webp" type="image/webp">
  <img ${attrs}>
</picture>`;
    }
  );

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

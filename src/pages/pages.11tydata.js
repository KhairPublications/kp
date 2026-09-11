/**
 * Shared configuration for every page template.
 *
 * `permalink` keeps the published URLs byte-identical to the pre-build site
 * (/index.html, /events.html, /Board.html, ...) so existing inbound links
 * and search-engine results continue to resolve.
 */
export default {
  layout: "layouts/base.njk",
  eleventyComputed: {
    permalink: (data) => {
      if (data.permalink) return data.permalink;
      // filePathStem is "/pages/index", "/pages/Board", ... Taking the last
      // segment keeps index.njk at /index.html rather than inheriting the
      // directory name the way page.fileSlug does.
      const name = data.page.filePathStem.split("/").pop();
      return `/${name}.html`;
    },
  },
};

# Khair Publications Website

Static marketing and catalogue site for Khair Publications, built with
[Eleventy](https://www.11ty.dev/) and deployed to GitHub Pages.

There is no client-side framework and no runtime templating: the build emits
plain HTML, one bundled stylesheet, and a handful of ES modules.

## Quick start

```bash
npm install      # once
npm run dev      # local server with live reload at http://localhost:8080
npm run build    # production build into dist/
npm run check    # build, then validate the output
npm run preview  # serve an existing dist/ at http://localhost:8099
npm run clean    # delete dist/
```

Node 20 or newer is required. The version is pinned in `.nvmrc`.

Two asset scripts are run by hand, not on every build, because their output
is committed:

```bash
npm run optimize-images    # regenerate AVIF/WebP/JPEG derivatives
npm run generate-assets    # regenerate the favicon set (needs Python + Pillow)
```

## Repository layout

```
src/
  _data/                Content as JSON. Edit these to change site copy.
    site.json             Name, URL, contact details, social links
    navigation.json       Main menu
    announcement.json     Top announcement bar
    board.json            Editorial board members
    team.json             Patron, founder, and staff
    books.json            Catalogue, shared by the store and home carousel
    seminar.json          Featured event
    gallery.json          Event photo grid
    videos.json           Event video embeds
    press.json            Press coverage
  _includes/
    layouts/              base.njk wraps every page; page.njk adds a heading
    partials/             head, announcement bar, navbar, footer, scripts
    components/           Reusable macros: book card, person card, seminar
  assets/
    css/                  main.css is the only entry point; the rest are
                          partials pulled in through @import
    js/                   main.js plus one module per behaviour
    images/               board/ team/ books/ brand/ seminar/
    documents/            PDFs
  pages/                  One template per page
  404.njk, robots.njk, sitemap.njk

tools/                    Build and verification scripts
archive/                  Files no longer used by the site, kept for reference
dist/                     Build output (generated, not committed)
```

## How the pieces fit together

**Every page shares one layout.** `src/_includes/layouts/base.njk` owns the
document shell: metadata, the announcement bar, the navbar, the footer, and
the script tags. A page template contributes only its own content. Before
this structure existed, each of the seven pages carried its own copy of all
of that, and they had drifted apart.

**Content lives in `_data`, not in markup.** Adding a book means adding an
object to `books.json`; it then appears in both the store grid and the home
page carousel. The same holds for board members, team members, gallery
photos, and navigation links.

**Styles are layered.** `main.css` imports tokens, then base styles, then
utilities, then components, then page-level rules. Lightning CSS bundles the
import graph into a single minified file at build time, so the browser makes
one stylesheet request. Design values are CSS custom properties defined once
in `base/tokens.css`.

**Scripts are native ES modules.** `main.js` imports one module per
behaviour and each module no-ops when its markup is absent, so every page can
load the same entry point. No bundler is involved.

## Common tasks

| Task | Where |
| --- | --- |
| Change contact details or social links | `src/_data/site.json` |
| Add or edit a book | `src/_data/books.json` |
| Add a board or team member | `src/_data/board.json`, `src/_data/team.json` |
| Change the announcement bar | `src/_data/announcement.json` |
| Add a menu item | `src/_data/navigation.json` |
| Change brand colours or type scale | `src/assets/css/base/tokens.css` |
| Add a page | New `.njk` file in `src/pages/` |

### Adding a page

Create `src/pages/example.njk`:

```njk
---
title: Example
navKey: example
description: What this page is about.
---
<section class="container my-5">
  <h1 class="section-title">Example</h1>
</section>
```

It builds to `/example.html`. Add a matching entry to `navigation.json` if it
belongs in the menu. Pages default to the flat green theme; set
`bodyClass: theme-hero` for the photographic background used on the home and
events pages.

## URLs

Output filenames match the pre-build site exactly, including the capital "B"
in `Board.html`, so existing inbound links and search results keep working.
If you ever rename a page, add a redirect rather than breaking the old URL.

## Images

`npm run optimize-images` converts every JPEG and PNG under
`src/assets/images` into AVIF, WebP, and responsive JPEG fallbacks, writing
them to an `optimized/` folder beside the source. Derivatives are committed,
so the deploy does not need to run the optimiser. Re-run it after adding or
replacing a picture; it skips anything already up to date, and `-- --force`
rebuilds everything.

Templates never reference the derivative paths directly. The `image`
shortcode takes the original path and emits the `<picture>` element:

```njk
{% image "/assets/images/books/book1.jpg", "Sufism cover", {
  sizes: "(max-width: 767px) 60vw, 200px",
  className: "img-fluid rounded"
} %}
```

If a derivative is missing it falls back to a plain `<img>` on the original,
so a new image still renders before the optimiser has run.

`src/assets/images/_originals/` holds source artwork that should never be
served, such as the untrimmed book render. It is excluded from both the
optimiser and the build output.

Favicons are generated from `src/assets/images/brand/khair-logo.png` by
`tools/generate-assets.py`, which also trims the transparent margin from
the book render. Run it after changing the logo.

## Validation

`npm run validate` checks the built output for broken internal links, missing
image and script references, duplicate element ids, missing page titles and
descriptions, and images without alt text. It exits non-zero on failure, and
CI runs it on every pull request.

## Deployment

Pushing to `main` triggers `.github/workflows/static.yml`, which installs
dependencies, builds, validates, and publishes `dist/` to GitHub Pages. Pull
requests run the same build and validation through `.github/workflows/ci.yml`
without deploying.

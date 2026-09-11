/**
 * Minimal static server for previewing a production build.
 *
 *   node tools/serve.js [root] [port]      defaults: dist, 8099
 *
 * Responses are sent with `Cache-Control: no-store`. Without it the browser
 * heuristically caches HTML that carries no caching directives, so a reload
 * after a rebuild can quietly serve the previous version of a page.
 */
import http from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.argv[2] || "dist");
const PORT = Number(process.argv[3] || 8099);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
};

const NO_CACHE = {
  "Cache-Control": "no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

http
  .createServer((req, res) => {
    const requested = decodeURIComponent(req.url.split("?")[0]);
    let file = path.join(ROOT, requested);

    // Keep requests inside the served directory.
    if (!file.startsWith(ROOT)) {
      res.writeHead(403, NO_CACHE);
      return res.end("403");
    }

    if (existsSync(file) && statSync(file).isDirectory()) {
      file = path.join(file, "index.html");
    }

    if (!existsSync(file)) {
      const notFound = path.join(ROOT, "404.html");
      if (existsSync(notFound)) {
        res.writeHead(404, { "Content-Type": TYPES[".html"], ...NO_CACHE });
        return res.end(readFileSync(notFound));
      }
      res.writeHead(404, NO_CACHE);
      return res.end("404");
    }

    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
      ...NO_CACHE,
    });
    res.end(readFileSync(file));
  })
  .listen(PORT, () => {
    console.log(`serving ${ROOT} on http://localhost:${PORT}`);
  });

import http from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.argv[2] || "dist");
const PORT = Number(process.argv[3] || 8099);
const TYPES = { ".html":"text/html", ".css":"text/css", ".js":"text/javascript", ".json":"application/json",
  ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".webp":"image/webp", ".avif":"image/avif",
  ".svg":"image/svg+xml", ".ico":"image/x-icon", ".webmanifest":"application/manifest+json", ".pdf":"application/pdf", ".xml":"application/xml", ".txt":"text/plain" };

http.createServer((req, res) => {
  let p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (existsSync(p) && statSync(p).isDirectory()) p = path.join(p, "index.html");
  if (!existsSync(p)) { res.writeHead(404); return res.end("404"); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream" });
  res.end(readFileSync(p));
}).listen(PORT, () => console.log(`serving ${ROOT} on http://localhost:${PORT}`));

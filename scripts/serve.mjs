// Minimal static server for previewing the production build the way typical
// static hosts serve it: /path -> /path/index.html (or /path.html), unknown
// paths -> 404.html with status 404. `vite preview` instead falls back to the
// landing page for every extensionless path, which is not how the site is hosted.
//
//   npm run build && npm run preview   ->   http://localhost:4173

import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../build/client");
const port = Number(process.env.PORT ?? 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".data": "text/x-script",
};

const isFile = (p) => existsSync(p) && statSync(p).isFile();

function resolve(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, "");
  const base = path.join(root, clean);
  if (!base.startsWith(root)) return null;
  for (const candidate of [base, path.join(base, "index.html"), `${base}.html`]) {
    if (isFile(candidate)) return candidate;
  }
  return null;
}

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  let file = resolve(pathname);
  let status = 200;
  if (!file) {
    file = path.join(root, "404.html");
    status = 404;
  }
  if (!isFile(file)) {
    res.writeHead(404).end("Not found (run `npm run build` first)");
    return;
  }
  const immutable = pathname.startsWith("/assets/");
  res.writeHead(status, {
    "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
    "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
  });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Serving build/client at http://localhost:${port}`));

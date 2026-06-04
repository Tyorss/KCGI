import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 8100);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

function resolveRequest(url) {
  const parsed = new URL(url, `http://localhost:${port}`);
  const rawPath = decodeURIComponent(parsed.pathname);
  const target = path.normalize(path.join(root, rawPath === "/" ? "index.html" : rawPath));
  if (!target.startsWith(root)) return null;
  return target;
}

const server = http.createServer((request, response) => {
  const target = resolveRequest(request.url || "/");
  if (!target || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": types[path.extname(target)] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  fs.createReadStream(target).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`AI-Bottleneck dashboard: http://127.0.0.1:${port}`);
});

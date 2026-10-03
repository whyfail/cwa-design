import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../dist");
const base = process.env.CWA_BASE ?? "/";
const port = Number(process.env.PORT ?? 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".xml": "application/xml",
  ".tsx": "text/plain; charset=utf-8",
};
createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${port}`);
  let relative;
  try {
    relative = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400).end("Invalid URL");
    return;
  }
  if (relative === base.slice(0, -1)) {
    response.writeHead(301, { Location: `${base}${url.search}` }).end();
    return;
  }
  if (base !== "/" && !relative.startsWith(base)) {
    response.writeHead(404).end("Not found");
    return;
  }
  const file = path.resolve(
    root,
    `.${base === "/" ? relative : `/${relative.slice(base.length)}`}`,
  );
  try {
    if (!file.startsWith(`${root}${path.sep}`) && file !== root)
      throw new Error("Outside static root");
    const info = await stat(file);
    if (info.isDirectory() && !url.pathname.endsWith("/")) {
      response.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end();
      return;
    }
    const target = info.isDirectory() ? path.join(file, "index.html") : file;
    const content = await readFile(target);
    response
      .writeHead(200, { "Content-Type": mime[path.extname(target)] ?? "application/octet-stream" })
      .end(content);
  } catch {
    response
      .writeHead(404, { "Content-Type": "text/html; charset=utf-8" })
      .end(await readFile(path.join(root, "404.html")));
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`Static preview: http://127.0.0.1:${port}${base} (no SPA fallback)`),
);

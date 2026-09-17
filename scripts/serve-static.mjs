import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

const ROOT = process.argv[2] || ".";
const PORT = Number(process.argv[3] || 4173);
const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml", ".json": "application/json", ".map": "application/json",
  ".wav": "audio/wav", ".mp3": "audio/mpeg", ".ttf": "font/ttf",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ico": "image/x-icon",
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let filePath = join(ROOT, decodeURIComponent(url.pathname));
    try {
      if ((await stat(filePath)).isDirectory()) filePath = join(filePath, "index.html");
    } catch {
      filePath = join(ROOT, "index.html"); // SPA fallback
    }
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": MIME[extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(500);
    res.end("error");
  }
}).listen(PORT, "127.0.0.1", () => console.log(`static server on http://127.0.0.1:${PORT}`));

import { createServer } from "node:http";
import { createReadStream, existsSync, watch } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = resolve(__dirname, "..");
const PORT = 3456;

const MIME = {
  ".html": "text/html",
  ".js":   "application/javascript",
  ".css":  "text/css",
  ".png":  "image/png",
  ".ico":  "image/x-icon",
  ".svg":  "image/svg+xml",
};

// Injected into the HTML to enable live reload
const LIVE_RELOAD_SCRIPT = `
<script>
  const es = new EventSource("/__livereload");
  es.onmessage = () => location.reload();
</script>`;

let reloadClients = [];

const server = createServer((req, res) => {
  // Live reload SSE endpoint
  if (req.url === "/__livereload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });
    res.write("data: connected\n\n");
    reloadClients.push(res);
    req.on("close", () => {
      reloadClients = reloadClients.filter((c) => c !== res);
    });
    return;
  }

  // Serve files
  const urlPath = req.url === "/" ? "/newtab.html" : req.url.split("?")[0];
  const filePath = join(rootDir, urlPath);

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const ext = extname(filePath).toLowerCase();
  const mime = MIME[ext] ?? "application/octet-stream";
  res.setHeader("Content-Type", mime);

  if (ext === ".html") {
    // Inject live-reload script before </body>
    let html = "";
    const stream = createReadStream(filePath, "utf8");
    stream.on("data", (chunk) => (html += chunk));
    stream.on("end", () => {
      res.end(html.replace("</body>", `${LIVE_RELOAD_SCRIPT}</body>`));
    });
    stream.on("error", () => { res.writeHead(500); res.end(); });
  } else {
    createReadStream(filePath).pipe(res);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Dev server: ${url}`);

  // Open in default browser
  const open =
    process.platform === "win32" ? `start "" "${url}"` :
    process.platform === "darwin" ? `open "${url}"` :
    `xdg-open "${url}"`;
  exec(open);
});

// Watch source files and notify live-reload clients
const sourceFiles = ["newtab.html", "newtab.js", "styles.css"];
for (const file of sourceFiles) {
  const filePath = join(rootDir, file);
  watch(filePath, () => {
    console.log(`Changed: ${file}`);
    for (const client of reloadClients) {
      client.write("data: reload\n\n");
    }
  });
}

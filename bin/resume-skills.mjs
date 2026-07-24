#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, watch, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { basename, dirname, extname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { prepareEditorDocument } from "../lib/editor-document.mjs";
import { resolveSourceAsset } from "../lib/source-asset.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = join(packageRoot, "public");

function printHelp() {
  console.log("Usage: resume-skills editor <resume.html> [options]");
  console.log("\nOpen a generated ResumeSkills template in the local canvas editor.");
  console.log("\nOptions:");
  console.log("  -p, --port <number>   Specify server port (default: 0 for random available port)");
  console.log("  --host <host>         Specify host to bind (default: 127.0.0.1)");
  console.log("  --json                Output status in JSON format");
  console.log("  --no-open             Do not automatically open the browser");
  console.log("  -h, --help            Show this help message");
}

function send(response, status, contentType, body) {
  response.writeHead(status, { "content-type": contentType, "cache-control": "no-store" });
  response.end(body);
}

function assetContentType(filePath) {
  const extension = extname(filePath).toLowerCase();
  return ({ ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml" })[extension] || "application/octet-stream";
}

function openBrowser(url) {
  if (process.env.RESUME_SKILLS_NO_OPEN === "1") return;
  const command = process.platform === "win32" ? "cmd" : process.platform === "darwin" ? "open" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  const child = spawn(command, args, { detached: true, stdio: "ignore" });
  child.unref();
}

export function startEditor(sourcePath, { log = true, open = true, port = 0, host = "127.0.0.1", json = false, logFn = console.log } = {}) {
  if (extname(sourcePath).toLowerCase() !== ".html") {
    throw new Error("编辑器只接受 .html 文件。");
  }
  if (!existsSync(sourcePath)) throw new Error(`找不到 HTML 文件：${sourcePath}`);

  let original = prepareEditorDocument(readFileSync(sourcePath, "utf8"));
  let documentId = createHash("sha256").update(sourcePath).update(original).digest("hex");
  const sseClients = new Set();

  let debounceTimer = null;
  const fileWatcher = watch(sourcePath, () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      try {
        if (!existsSync(sourcePath)) return;
        const updated = prepareEditorDocument(readFileSync(sourcePath, "utf8"));
        original = updated;
        documentId = createHash("sha256").update(sourcePath).update(original).digest("hex");
        for (const clientResponse of sseClients) {
          try {
            clientResponse.write("data: reload\n\n");
          } catch {
            sseClients.delete(clientResponse);
          }
        }
      } catch {
        // Ignore transient reading errors during file saves
      }
    }, 100);
  });

  const server = createServer((request, response) => {
    if (request.method === "GET" && request.url === "/") {
      return send(response, 200, "text/html; charset=utf-8", readFileSync(join(publicRoot, "editor.html")));
    }
    if (request.method === "GET" && request.url === "/favicon.svg") {
      return send(response, 200, "image/svg+xml", readFileSync(join(publicRoot, "favicon.svg")));
    }
    if (request.method === "GET" && request.url === "/app.js") {
      return send(response, 200, "text/javascript; charset=utf-8", readFileSync(join(publicRoot, "app.js")));
    }
    if (request.method === "GET" && request.url === "/app.css") {
      return send(response, 200, "text/css; charset=utf-8", readFileSync(join(publicRoot, "app.css")));
    }
    if (request.method === "GET" && request.url === "/editor-document.js") {
      return send(response, 200, "text/javascript; charset=utf-8", readFileSync(join(packageRoot, "lib", "editor-document.mjs")));
    }
    if (request.method === "GET" && request.url === "/editor-controls.js") {
      return send(response, 200, "text/javascript; charset=utf-8", readFileSync(join(packageRoot, "lib", "editor-controls.mjs")));
    }
    if (request.method === "GET" && request.url === "/api/document") {
      return send(response, 200, "application/json; charset=utf-8", JSON.stringify({ html: original, documentId, sourceName: basename(sourcePath) }));
    }
    if (request.method === "GET" && request.url === "/api/events") {
      response.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        "connection": "keep-alive",
      });
      response.write("retry: 1000\n\n");
      sseClients.add(response);
      const cleanup = () => sseClients.delete(response);
      request.on("close", cleanup);
      request.on("error", cleanup);
      return;
    }
    if (request.method === "POST" && request.url === "/api/save") {
      let body = "";
      request.on("data", (chunk) => { body += chunk; });
      request.on("end", () => {
        try {
          const { html } = JSON.parse(body);
          const exportHtml = prepareEditorDocument(html);
          writeFileSync(sourcePath, exportHtml, "utf8");
          // NOTE: Saving to sourcePath triggers the file watcher, which triggers hot reload.
          // The browser will automatically clear the draft and reload.
          send(response, 200, "application/json; charset=utf-8", JSON.stringify({ outputName: basename(sourcePath) }));
        } catch (error) {
          send(response, 400, "application/json; charset=utf-8", JSON.stringify({ error: error.message }));
        }
      });
      return;
    }
    if (request.method === "GET") {
      try {
        const requestPath = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
        const assetPath = resolveSourceAsset(sourcePath, requestPath);
        if (existsSync(assetPath) && statSync(assetPath).isFile()) {
          return send(response, 200, assetContentType(assetPath), readFileSync(assetPath));
        }
      } catch {
        return send(response, 403, "text/plain; charset=utf-8", "Asset is outside the resume directory");
      }
    }
    send(response, 404, "text/plain; charset=utf-8", "Not found");
  });

  server.on("close", () => {
    fileWatcher.close();
  });

  server.listen(port, host, () => {
    const address = server.address();
    const actualPort = typeof address === "object" && address !== null ? address.port : port;
    const url = `http://${host}:${actualPort}`;
    const exportPath = sourcePath;

    if (json) {
      logFn(JSON.stringify({
        event: "server_started",
        url,
        port: actualPort,
        sourcePath,
        exportPath,
      }));
    } else if (log) {
      logFn(`Resume editor is running at ${url}`);
    }

    if (open) openBrowser(url);
  });

  return server;
}

if (resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values, positionals } = parseArgs({
      args: process.argv.slice(2),
      options: {
        help: { type: "boolean", short: "h" },
        port: { type: "string", short: "p" },
        host: { type: "string", default: "127.0.0.1" },
        json: { type: "boolean", default: false },
        open: { type: "boolean", default: true },
        "no-open": { type: "boolean", default: false },
      },
      allowPositionals: true,
    });

    const [command, argument] = positionals;

    if (values.help || !command || (command === "editor" && !argument)) {
      printHelp();
    } else if (command === "editor") {
      const portNumber = values.port ? parseInt(values.port, 10) : 0;
      const shouldOpen = values["no-open"] ? false : values.open;
      startEditor(resolve(argument), {
        open: shouldOpen,
        port: portNumber,
        host: values.host,
        json: values.json,
      });
    } else {
      printHelp();
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { basename, dirname, extname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { prepareEditorDocument } from "../lib/editor-document.mjs";
import { resolveSourceAsset } from "../lib/source-asset.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = join(packageRoot, "public");

function printHelp() {
  console.log("Usage: resume-skills editor <resume.html>");
  console.log("\nOpen a generated ResumeSkills template in the local canvas editor.");
}

export function nextExportPath(sourcePath) {
  const folder = dirname(sourcePath);
  const extension = extname(sourcePath) || ".html";
  const stem = basename(sourcePath, extension);
  return join(folder, `${stem}-edited${extension}`);
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

export function startEditor(sourcePath, { log = true, open = true } = {}) {
  if (extname(sourcePath).toLowerCase() !== ".html") {
    throw new Error("编辑器只接受 .html 文件。");
  }
  if (!existsSync(sourcePath)) throw new Error(`找不到 HTML 文件：${sourcePath}`);

  const original = prepareEditorDocument(readFileSync(sourcePath, "utf8"));
  const documentId = createHash("sha256").update(sourcePath).update(original).digest("hex");
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
    if (request.method === "POST" && request.url === "/api/export") {
      let body = "";
      request.on("data", (chunk) => { body += chunk; });
      request.on("end", () => {
        try {
          const { html } = JSON.parse(body);
          const exportHtml = prepareEditorDocument(html);
          const outputPath = nextExportPath(sourcePath);
          writeFileSync(outputPath, exportHtml, "utf8");
          send(response, 200, "application/json; charset=utf-8", JSON.stringify({ outputName: basename(outputPath) }));
        } catch (error) {
          send(response, 400, "application/json; charset=utf-8", JSON.stringify({ error: error.message }));
        }
      });
      return;
    }
    if (request.method === "GET") {
      try {
        const assetPath = resolveSourceAsset(sourcePath, new URL(request.url, "http://127.0.0.1").pathname);
        if (existsSync(assetPath) && statSync(assetPath).isFile()) {
          return send(response, 200, assetContentType(assetPath), readFileSync(assetPath));
        }
      } catch {
        return send(response, 403, "text/plain; charset=utf-8", "Asset is outside the resume directory");
      }
    }
    send(response, 404, "text/plain; charset=utf-8", "Not found");
  });

  server.listen(0, "127.0.0.1", () => {
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}`;
    if (log) console.log(`Resume editor is running at ${url}`);
    if (open) openBrowser(url);
  });
  return server;
}

if (resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, argument] = process.argv.slice(2);
  if (!command || command === "--help" || command === "-h" || (command === "editor" && (argument === "--help" || argument === "-h"))) {
    printHelp();
  } else if (command === "editor" && argument) {
    try {
      startEditor(resolve(argument));
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exitCode = 1;
    }
  } else {
    printHelp();
    process.exitCode = 1;
  }
}

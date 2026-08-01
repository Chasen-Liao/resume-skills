#!/usr/bin/env node
import { createHash } from "node:crypto";
import { closeSync, copyFileSync, existsSync, fsyncSync, openSync, readFileSync, renameSync, statSync, unlinkSync, watch, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { basename, dirname, extname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { prepareEditorDocument, validateEditorSave } from "../lib/editor-document.mjs";
import { invalidateArtifactManifest } from "../lib/artifact-manifest.mjs";
import { resolveSourceAsset } from "../lib/source-asset.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = join(packageRoot, "public");
const maxSaveBodyBytes = 1024 * 1024;
const loopbackHosts = new Set(["127.0.0.1", "::1"]);
const atomicFileOps = {
  open: openSync,
  write: writeFileSync,
  fsync: fsyncSync,
  close: closeSync,
  copy: copyFileSync,
  rename: renameSync,
  exists: existsSync,
  unlink: unlinkSync,
};

function printHelp() {
  console.log("Usage: resume-skills editor <resume.html> [options]");
  console.log("\nOpen a generated ResumeSkills template in the local canvas editor.");
  console.log("\nOptions:");
  console.log("  -p, --port <number>   Specify server port (default: 0 for random available port)");
  console.log("  --host <host>         Loopback host only: 127.0.0.1 or ::1 (default: 127.0.0.1)");
  console.log("  --json                Output status in JSON format");
  console.log("  --manifest <path>     Delivery manifest explicitly associated with this HTML");
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

function documentVersion(sourcePath, html) {
  return createHash("sha256").update(sourcePath).update(html).digest("hex");
}

export function atomicSave(sourcePath, contents, { fileOps = atomicFileOps } = {}) {
  const temporaryPath = join(dirname(sourcePath), `.${basename(sourcePath)}.resume-skills-${process.pid}-${Date.now()}.tmp`);
  let fileDescriptor;
  try {
    fileDescriptor = fileOps.open(temporaryPath, "wx");
    fileOps.write(fileDescriptor, contents, "utf8");
    fileOps.fsync(fileDescriptor);
    fileOps.close(fileDescriptor);
    fileDescriptor = undefined;
    fileOps.copy(sourcePath, `${sourcePath}.bak`);
    fileOps.rename(temporaryPath, sourcePath);
  } finally {
    if (fileDescriptor !== undefined) fileOps.close(fileDescriptor);
    if (fileOps.exists(temporaryPath)) fileOps.unlink(temporaryPath);
  }
}

export function startEditor(sourcePath, { log = true, open = true, port = 0, host = "127.0.0.1", json = false, manifestPath, logFn = console.log, writeAtomically = atomicSave, invalidateManifest = invalidateArtifactManifest } = {}) {
  if (!loopbackHosts.has(host)) {
    throw new Error("编辑器仅支持 loopback host（127.0.0.1 或 ::1）。");
  }
  if (extname(sourcePath).toLowerCase() !== ".html") {
    throw new Error("编辑器只接受 .html 文件。");
  }
  if (!existsSync(sourcePath)) throw new Error(`找不到 HTML 文件：${sourcePath}`);

  let original = prepareEditorDocument(readFileSync(sourcePath, "utf8"));
  let documentId = documentVersion(sourcePath, original);
  const sseClients = new Set();

  const sendEvent = (event, data) => {
    const payload = event === "reload" ? "data: reload\n\n" : `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const clientResponse of sseClients) {
      try {
        clientResponse.write(payload);
      } catch {
        sseClients.delete(clientResponse);
      }
    }
  };
  const reloadFromDisk = () => {
    try {
      if (!existsSync(sourcePath)) throw new Error("文件不存在或正在被替换。");
      const updated = prepareEditorDocument(readFileSync(sourcePath, "utf8"));
      original = updated;
      documentId = documentVersion(sourcePath, original);
      sendEvent("reload");
    } catch (error) {
      sendEvent("status", { level: "error", message: `无法读取简历文件：${error.message}` });
    }
  };
  let debounceTimer = null;
  const sourceName = basename(sourcePath).toLowerCase();
  const fileWatcher = watch(dirname(sourcePath), (_eventType, changedName) => {
    if (changedName && String(changedName).toLowerCase() !== sourceName) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(reloadFromDisk, 100);
  });
  fileWatcher.on("error", (error) => sendEvent("status", { level: "error", message: `无法监听简历文件：${error.message}` }));

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
    if (request.method === "GET" && (request.url === "/editor-document.js" || request.url === "/editor-toolbar.js")) {
      return send(response, 200, "text/javascript; charset=utf-8", readFileSync(join(packageRoot, "lib", "editor-toolbar.mjs")));
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
      response.on("close", cleanup);
      response.on("error", cleanup);
      return;
    }
    if (request.method === "POST" && request.url === "/api/save") {
      const rejectOversizedSave = ({ destroy = false } = {}) => {
        if (response.writableEnded) return;
        send(response, 413, "application/json; charset=utf-8", JSON.stringify({ error: "保存内容超过大小限制。" }));
        if (destroy) request.destroy();
      };
      const contentLength = Number(request.headers["content-length"]);
      if (Number.isFinite(contentLength) && contentLength > maxSaveBodyBytes) {
        request.resume();
        return rejectOversizedSave();
      }

      let body = "";
      let bodySize = 0;
      request.on("data", (chunk) => {
        bodySize += chunk.length;
        if (bodySize > maxSaveBodyBytes) return rejectOversizedSave({ destroy: true });
        body += chunk;
      });
      request.on("end", () => {
        if (response.writableEnded) return;
        let exportHtml;
        try {
          const { html, documentId: submittedDocumentId } = JSON.parse(body);
          const diskOriginal = prepareEditorDocument(readFileSync(sourcePath, "utf8"));
          const diskDocumentId = documentVersion(sourcePath, diskOriginal);
          original = diskOriginal;
          documentId = diskDocumentId;
          if (!submittedDocumentId || submittedDocumentId !== diskDocumentId) {
            return send(response, 409, "application/json; charset=utf-8", JSON.stringify({ error: "文档版本已过期，请先重新加载后再保存。", documentId }));
          }
          exportHtml = validateEditorSave(original, html);
        } catch (error) {
          return send(response, 400, "application/json; charset=utf-8", JSON.stringify({ error: error.message }));
        }
        try {
          invalidateManifest(sourcePath, manifestPath);
          writeAtomically(sourcePath, exportHtml);
          original = exportHtml;
          documentId = documentVersion(sourcePath, original);
          send(response, 200, "application/json; charset=utf-8", JSON.stringify({ outputName: basename(sourcePath), documentId }));
        } catch (error) {
          send(response, 500, "application/json; charset=utf-8", JSON.stringify({ error: `保存失败：${error.message}` }));
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
    const urlHost = host.includes(":") ? `[${host}]` : host;
    const url = `http://${urlHost}:${actualPort}`;
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
        manifest: { type: "string" },
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
        manifestPath: values.manifest ? resolve(values.manifest) : undefined,
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

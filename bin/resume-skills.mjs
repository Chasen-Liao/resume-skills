#!/usr/bin/env node
import { createHash } from "node:crypto";
import { closeSync, copyFileSync, existsSync, fsyncSync, openSync, readFileSync, renameSync, statSync, unlinkSync, watch, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { basename, dirname, extname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { prepareEditorDocument, validateEditorFields, validateEditorSave } from "../lib/editor-document.mjs";
import { invalidateArtifactManifest } from "../lib/artifact-manifest.mjs";
import { resolveSourceAsset } from "../lib/source-asset.mjs";
import { fetchLatestVersion, formatUpdateNotice, isUpdateAvailable, resolveCliVersion } from "../lib/version-check.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = join(packageRoot, "public");
const cliVersion = resolveCliVersion(packageRoot); // 缺失 package.json（如 DSH 预设裁剪副本）时为 null：版本未知 → 跳过更新检查，避免误报
const maxSaveBodyBytes = 1024 * 1024;
const loopbackHosts = new Set(["127.0.0.1", "::1"]);
export const DEFAULT_PORT = 8848; // CLI 默认固定端口：被占用时顺延，扫描窗口用尽后回退随机
const PORT_SCAN_RANGE = 5;

// 未显式 --manifest 时按目录同前缀发现 <stem>.resume-manifest.json；不存在则返回 null（保存不失效任何 manifest）。
function defaultResumeManifestPath(htmlPath) {
  const candidate = htmlPath.replace(/\.html$/i, "") + ".resume-manifest.json";
  return existsSync(candidate) ? candidate : null;
}
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
  console.log("Usage:");
  console.log("  resume-skills editor <resume.html> [options]");
  console.log("  resume-skills validate <resume.html> [options]");
  console.log("\neditor:  Open a generated ResumeSkills template in the local canvas editor.");
  console.log("         The resume is validated before the server starts: at least one");
  console.log("         data-resume-editor-id on leaf text fields, unique ids, no container ids.");
  console.log("validate: Check a resume HTML against the editor protocol without starting a server.");
  console.log("         Exit code 0 = valid, 1 = invalid (with fix guidance on stderr).");
  console.log("\nOptions:");
  console.log("  -p, --port <number>   Specify server port. Default: 8848; if taken, walks up to");
  console.log("                       8853 then a random free port. Explicit --port is strict:");
  console.log("                       if that port is taken, the editor exits with an error.");
  console.log("  --host <host>         Loopback host only: 127.0.0.1 or ::1 (default: 127.0.0.1)");
  console.log("  --json                Output NDJSON status events (server_started / error / ...)");
  console.log("  --manifest <path>     Delivery manifest explicitly associated with this HTML");
  console.log("  --write-port-file <path>  After start, write {url, port, pid, sourcePath} JSON");
  console.log("                       (for background launches and scripts that poll readiness)");
  console.log("  --no-open             Do not automatically open the browser");
  console.log("  -h, --help            Show this help message");
  console.log("\nTip: 推荐显式调用 npx -p @chasen-liao/resume-skills resume-skills ...（裸 npx <包名> 在 Git Bash 下可能被 shim 拦截）。");
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

export function startEditor(sourcePath, { log = true, open = true, port = 0, portFallback = false, host = "127.0.0.1", json = false, manifestPath, writePortFile, logFn = console.log, writeAtomically = atomicSave, invalidateManifest = invalidateArtifactManifest, checkLatest = null } = {}) {
  if (!loopbackHosts.has(host)) {
    throw new Error("编辑器仅支持 loopback host（127.0.0.1 或 ::1）。");
  }
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("端口必须是 0–65535 的整数（0 表示随机可用端口）。");
  }
  if (extname(sourcePath).toLowerCase() !== ".html") {
    throw new Error("编辑器只接受 .html 文件。");
  }
  if (!existsSync(sourcePath)) throw new Error(`找不到 HTML 文件：${sourcePath}`);

  // 显式 --manifest 保持严格校验；未传时按同前缀发现同目录 manifest（存在且关联当前 HTML 才失效）。
  const effectiveManifestPath = manifestPath || defaultResumeManifestPath(sourcePath);

  let original = prepareEditorDocument(readFileSync(sourcePath, "utf8"));
  let documentId = documentVersion(sourcePath, original);
  let latestVersion = null;
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
      const raw = readFileSync(sourcePath, "utf8");
      const updated = prepareEditorDocument(raw);
      validateEditorFields(raw); // 外部改动也必须通过叶子字段校验；失败不发 reload 并提示
      if (updated === original) return; // 磁盘内容与当前服务一致（如编辑器自己的保存回显），无需 reload；外部修改仍会触发
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
    if (request.method === "GET" && request.url === "/editor-rules.js") {
      return send(response, 200, "text/javascript; charset=utf-8", readFileSync(join(packageRoot, "lib", "editor-rules.mjs")));
    }
    if (request.method === "GET" && request.url === "/api/document") {
      return send(response, 200, "application/json; charset=utf-8", JSON.stringify({ html: original, documentId, sourceName: basename(sourcePath) }));
    }
    if (request.method === "GET" && request.url === "/api/version") {
      return send(response, 200, "application/json; charset=utf-8", JSON.stringify({ name: "resume-skills", version: cliVersion, latest: latestVersion, updateAvailable: cliVersion ? isUpdateAvailable(cliVersion, latestVersion) : false }));
    }
    if (request.method === "GET" && request.url === "/api/events") {
      response.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        "connection": "keep-alive",
      });
      response.write("retry: 1000\n\n");
      response.write("event: version\ndata: " + JSON.stringify({ version: cliVersion, latest: latestVersion, updateAvailable: cliVersion ? isUpdateAvailable(cliVersion, latestVersion) : false }) + "\n\n");
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
          try {
          invalidateManifest(sourcePath, effectiveManifestPath);
        } catch (error) {
          if (manifestPath) throw error; // 显式 --manifest 严格失败；同前缀自动发现的非关联/损坏 manifest 静默跳过，不阻断保存
        }
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

  const reportFatalError = (error) => {
    // 启动失败（如端口被占用）时 --json 也输出 JSON 事件；同时置非零退出码并关闭 watcher，
    // 避免进程以 0 码永久挂起（后台脚本等待 server_started/端口文件会无限等待）。
    const message = `服务器启动失败：${error.message}`;
    if (json) {
      try { logFn(JSON.stringify({ event: "error", error: message })); } catch { /* 日志失败不影响退出 */ }
    } else if (log) {
      logFn(message);
    }
    try { fileWatcher.close(); } catch { /* watcher 可能尚未就绪 */ }
    process.exitCode = 1;
  };

  const onListenReady = () => {
    const address = server.address();
    const actualPort = typeof address === "object" && address !== null ? address.port : port;
    const urlHost = host.includes(":") ? `[${host}]` : host;
    const url = `http://${urlHost}:${actualPort}`;
    const exportPath = sourcePath;

    if (writePortFile) {
      try {
        writeFileSync(writePortFile, JSON.stringify({ port: actualPort, url, pid: process.pid, sourcePath }, null, 2), "utf8");
      } catch (error) {
        const message = `无法写入端口文件 ${writePortFile}：${error.message}`;
        if (json) {
          logFn(JSON.stringify({ event: "error", error: message }));
        } else if (log) {
          logFn(`启动提示：${message}`);
        }
      }
    }

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

    if (checkLatest && cliVersion) {
      checkLatest().then((info) => {
        latestVersion = info?.version ?? null;
        if (isUpdateAvailable(cliVersion, latestVersion)) {
          try {
            if (json) {
              logFn(JSON.stringify({ event: "update_available", current: cliVersion, latest: latestVersion }));
            } else if (log) {
              logFn(formatUpdateNotice({ current: cliVersion, latest: latestVersion }));
            }
          } catch {
            // 日志输出失败不影响编辑器服务
          }
        }
        sendEvent("version", { version: cliVersion, latest: latestVersion, updateAvailable: isUpdateAvailable(cliVersion, latestVersion) });
      }).catch(() => {
        latestVersion = null;
      });
    }
  };

  let portAttempt = 0;
  let randomFallbackTried = false;
  // ready 逻辑挂 listening 事件而非 listen() 回调：EADDRINUSE 后重试 listen 时，
  // 首次 listen() 注册的回调也会被调用（Node 行为），导致 server_started 重复输出。
  server.on("listening", onListenReady);
  server.on("error", (error) => {
    // Vite 式自动回退：固定默认端口被占用时顺延 +1；扫描窗口用尽后回退到随机可用端口。
    // 仅在非 JSON 模式打印顺延提示，JSON 消费方只关心最终 server_started 里的实际端口。
    if (portFallback && port !== 0 && error?.code === "EADDRINUSE" && !randomFallbackTried) {
      if (portAttempt < PORT_SCAN_RANGE && port + portAttempt + 1 <= 65535) {
        portAttempt += 1;
        const nextPort = port + portAttempt;
        if (log && !json) logFn(`端口 ${nextPort - 1} 已被占用，编辑器改用 ${nextPort}。`);
        server.listen(nextPort, host);
        return;
      }
      randomFallbackTried = true;
      const scanEnd = Math.min(port + PORT_SCAN_RANGE, 65535);
      if (log && !json) logFn(`端口 ${port}–${scanEnd} 均不可用，编辑器改用随机可用端口。`);
      server.listen(0, host);
      return;
    }
    reportFatalError(error);
  });

  server.listen(port, host);

  return server;
}

if (resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const runCli = () => {
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
        "write-port-file": { type: "string" },
      },
      allowPositionals: true,
    });

    const [command, argument] = positionals;

    if (values.help || !command || ((command === "editor" || command === "validate") && !argument)) {
      printHelp();
    } else if (command === "editor" || command === "validate") {
      const targetPath = resolve(argument);
      let sourceHtml;
      try {
        sourceHtml = readFileSync(targetPath, "utf8");
      } catch (error) {
        const message = `无法读取 HTML 文件：${error.message}`;
        if (values.json) console.log(JSON.stringify({ event: "error", error: message }));
        else console.error(`Error: ${message}`);
        process.exitCode = 1;
        return;
      }

      let protocolError = null;
      try {
        prepareEditorDocument(sourceHtml);
        validateEditorFields(sourceHtml);
      } catch (error) {
        protocolError = error;
      }
      if (protocolError) {
        const hint = [
          "修复指引：编辑器要求至少 1 个 data-resume-editor-id，且只能位于叶子文本字段；",
          "容器黑名单与嵌套判定以 resume-skills validate 的校验结果为准。",
          `定位命令：rg -n \"data-resume-editor-id\" \"${targetPath}\"`,
        ].join("\n");
        if (values.json) {
          console.log(JSON.stringify({ event: "error", error: protocolError.message, hint }));
        } else {
          console.error(`Error: ${protocolError.message}`);
          console.error(hint);
        }
        process.exitCode = 1;
        return;
      }

      if (command === "validate") {
        if (extname(targetPath).toLowerCase() !== ".html") {
          const message = "校验器只接受 .html 文件。";
          if (values.json) console.log(JSON.stringify({ event: "error", error: message }));
          else console.error(`Error: ${message}`);
          process.exitCode = 1;
          return;
        }
        if (values.json) {
          console.log(JSON.stringify({ event: "validation_passed", sourcePath: targetPath }));
        } else {
          console.log(`校验通过：${basename(targetPath)} 的编辑字段符合协议（template/version/ID 均有效）。`);
        }
        return;
      }

      // 未指定 --port 时使用固定默认端口 8848（被占用自动顺延）；显式 --port 保持严格：占用即报错。
      const explicitPort = values.port !== undefined;
      const portNumber = explicitPort ? Number(values.port) : DEFAULT_PORT;
      const shouldOpen = values["no-open"] ? false : values.open;
      try {
        startEditor(targetPath, {
          open: shouldOpen,
          port: portNumber,
          portFallback: !explicitPort,
          host: values.host,
          json: values.json,
          manifestPath: values.manifest ? resolve(values.manifest) : undefined,
          writePortFile: values["write-port-file"] ? resolve(values["write-port-file"]) : undefined,
          checkLatest: process.env.RESUME_SKILLS_NO_UPDATE_CHECK === "1" ? null : fetchLatestVersion,
        });
      } catch (error) {
        // startEditor 的同步守卫（非 .html / 非 loopback host）在 --json 下也输出 JSON 错误事件。
        if (values.json) {
          console.log(JSON.stringify({ event: "error", error: error.message }));
          process.exitCode = 1;
        } else {
          throw error;
        }
      }
    } else {
      printHelp();
      process.exitCode = 1;
    }
  };
  try {
    runCli();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

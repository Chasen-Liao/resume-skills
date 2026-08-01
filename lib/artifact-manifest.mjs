import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function canonicalPath(filePath) {
  const normalized = realpathSync.native(resolve(filePath));
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

export function invalidateArtifactManifest(htmlPath, manifestPath, reason = "Canvas 保存修改了 HTML") {
  if (!manifestPath) return false;
  if (!existsSync(manifestPath)) throw new Error(`找不到关联的交付 manifest：${manifestPath}`);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!manifest.html?.path || canonicalPath(manifest.html.path) !== canonicalPath(htmlPath)) {
    throw new Error("交付 manifest 未关联当前 HTML 文件。");
  }
  manifest.status = "invalid";
  const checks = [
    ...(Array.isArray(manifest.validation?.checks) ? manifest.validation.checks : []),
    { name: "manifest freshness", status: "fail", message: reason },
  ];
  manifest.validation = {
    ...(manifest.validation || {}),
    ok: false,
    deliverable: false,
    checks,
    summary: {
      pass: checks.filter(({ status }) => status === "pass").length,
      warn: checks.filter(({ status }) => status === "warn").length,
      fail: checks.filter(({ status }) => status === "fail").length,
      degraded: checks.filter(({ status }) => status === "degraded").length,
    },
  };
  manifest.invalidated = { at: new Date().toISOString(), reason };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return true;
}

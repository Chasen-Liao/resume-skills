// 版本检查：对比本地 CLI 版本与 npm registry 的 latest。
// 所有网络行为都可通过 fetchImpl 注入，便于单元测试；任何失败都返回 null，绝不打扰编辑流程。
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const defaultRegistryUrl = "https://registry.npmjs.org/@chasen-liao/resume-skills/latest";

export function resolveCliVersion(packageRoot) {
  try {
    const parsed = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
    return typeof parsed?.version === "string" && parsed.version ? parsed.version : null;
  } catch {
    return null; // package.json 缺失或损坏（如 DSH 预设的裁剪副本）：版本未知，调用方应跳过更新检查
  }
}

export function compareVersions(a, b) {
  const partsA = String(a).split(".").map((part) => Number.parseInt(part, 10) || 0);
  const partsB = String(b).split(".").map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(partsA.length, partsB.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (partsA[index] ?? 0) - (partsB[index] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

export function isUpdateAvailable(current, latest) {
  return Boolean(latest) && compareVersions(latest, current) > 0;
}

export async function fetchLatestVersion({ registryUrl = defaultRegistryUrl, fetchImpl = fetch, timeoutMs = 2500 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  timer.unref?.();
  let guardTimer;
  const guard = new Promise((_, reject) => {
    guardTimer = setTimeout(() => reject(new Error("registry check timed out")), timeoutMs + 100);
  });
  try {
    const response = await Promise.race([fetchImpl(registryUrl, { signal: controller.signal, headers: { accept: "application/json" } }), guard]);
    if (!response.ok) return null;
    const payload = await response.json();
    return typeof payload?.version === "string" ? { version: payload.version } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    clearTimeout(guardTimer);
  }
}

export function formatUpdateNotice({ current, latest }) {
  return `检测到新版本 ${latest}（当前 ${current}）。更新：npm install -g @chasen-liao/resume-skills@latest，或使用 npx @chasen-liao/resume-skills@latest。`;
}

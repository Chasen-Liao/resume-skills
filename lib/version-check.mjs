// 版本检查：对比本地 CLI 版本与 npm registry 的 latest。
// 所有网络行为都可通过 fetchImpl 注入，便于单元测试；任何失败都返回 null，绝不打扰编辑流程。

export const defaultRegistryUrl = "https://registry.npmjs.org/@chasen-liao/resume-skills/latest";

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
  try {
    const response = await fetchImpl(registryUrl, { signal: controller.signal, headers: { accept: "application/json" } });
    if (!response.ok) return null;
    const payload = await response.json();
    return typeof payload?.version === "string" ? { version: payload.version } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function formatUpdateNotice({ current, latest }) {
  return `检测到新版本 ${latest}（当前 ${current}）。更新：npm install -g @chasen-liao/resume-skills@latest，或使用 npx @chasen-liao/resume-skills@latest。`;
}

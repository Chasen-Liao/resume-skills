import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join, basename } from "node:path";

export function artifactManifestPath(htmlPath) {
  const extension = extname(htmlPath);
  return join(dirname(htmlPath), `${basename(htmlPath, extension)}.resume-manifest.json`);
}

export function invalidateArtifactManifest(htmlPath, reason = "Canvas 保存修改了 HTML") {
  const manifestPath = artifactManifestPath(htmlPath);
  if (!existsSync(manifestPath)) return false;
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    return false;
  }
  manifest.status = "invalid";
  manifest.validation = { ...(manifest.validation || {}), ok: false };
  manifest.invalidated = { at: new Date().toISOString(), reason };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return true;
}

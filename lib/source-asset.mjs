import { existsSync, realpathSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";

function isInsideDirectory(path, directory) {
  return path !== directory && path.startsWith(`${directory}${sep}`);
}

export function resolveSourceAsset(sourceHtmlPath, requestPath) {
  const sourceDirectory = resolve(dirname(sourceHtmlPath));
  const relativePath = requestPath.replace(/^\/+/, "");
  const assetPath = resolve(sourceDirectory, relativePath);
  if (!isInsideDirectory(assetPath, sourceDirectory)) {
    throw new Error("Requested asset is outside the resume directory.");
  }
  if (!existsSync(assetPath)) return assetPath;

  const realSourceDirectory = realpathSync(sourceDirectory);
  const realAssetPath = realpathSync(assetPath);
  if (!isInsideDirectory(realAssetPath, realSourceDirectory)) {
    throw new Error("Requested asset is outside the resume directory.");
  }
  return realAssetPath;
}

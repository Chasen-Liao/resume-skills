import { dirname, resolve, sep } from "node:path";

export function resolveSourceAsset(sourceHtmlPath, requestPath) {
  const sourceDirectory = resolve(dirname(sourceHtmlPath));
  const relativePath = requestPath.replace(/^\/+/, "");
  const assetPath = resolve(sourceDirectory, relativePath);
  if (assetPath !== sourceDirectory && !assetPath.startsWith(`${sourceDirectory}${sep}`)) {
    throw new Error("Requested asset is outside the resume directory.");
  }
  return assetPath;
}

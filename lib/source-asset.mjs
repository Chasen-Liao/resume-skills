import { existsSync, realpathSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { parse } from "parse5";

function isInsideDirectory(path, directory) {
  return path !== directory && path.startsWith(`${directory}${sep}`);
}

function visit(node, callback) {
  callback(node);
  for (const child of node.childNodes || []) visit(child, callback);
  if (node.content) visit(node.content, callback);
}

function attribute(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value;
}

export function isLocalAssetReference(reference) {
  if (typeof reference !== "string" || !reference.trim()) return false;
  const value = reference.trim();
  if (value.startsWith("#") || value.startsWith("//")) return false;
  return !/^[a-z][a-z0-9+.-]*:/i.test(value);
}

export function collectLocalImageSources(html) {
  const sources = new Set();
  const document = parse(html || "");
  visit(document, (node) => {
    if (node.tagName !== "img") return;
    const src = attribute(node, "src");
    if (isLocalAssetReference(src)) sources.add(src);
  });
  return sources;
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

export function resolveReferencedSourceAsset(sourceHtmlPath, assetReference, allowedReferences) {
  if (!isLocalAssetReference(assetReference)) {
    throw new Error("Requested asset reference is not a local image path.");
  }
  if (!allowedReferences?.has(assetReference)) {
    throw new Error("Requested asset is not referenced by the resume HTML.");
  }

  const sourceDirectory = resolve(dirname(sourceHtmlPath));
  const relativePath = assetReference.replace(/^\/+/, "");
  const assetPath = resolve(sourceDirectory, relativePath);
  if (!existsSync(assetPath)) return assetPath;
  return realpathSync(assetPath);
}

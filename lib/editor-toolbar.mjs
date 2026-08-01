const legacyToolbar = /\s*<div\s+class=["']no-print-toolbar["'][\s\S]*?<\/div>\s*<\/div>/i;

export function stripLegacyToolbar(html) {
  return html.replace(legacyToolbar, "");
}

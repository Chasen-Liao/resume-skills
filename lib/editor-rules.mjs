// 编辑字段叶子性规则的单一事实源（Node 与浏览器共用，无外部依赖）。
// 与 SKILL.md 的容器黑名单对齐：结构化容器禁止携带 data-resume-editor-id。
// 所有标签名统一小写规范；消费方（lib/editor-document.mjs 与 public/app.js）
// 不得在别处重新定义整套规则，只能 import 本模块。
export const editorContainerTagNames = ["html", "body", "main", "section", "header", "footer", "ul", "ol", "figure"];
export const editorContainerClassNames = ["page", "resume"];
export const editorBlockChildTagNames = [
  "address", "article", "aside", "blockquote", "body", "canvas", "dd", "details", "dialog", "div", "dl", "dt",
  "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header",
  "hgroup", "hr", "html", "iframe", "img", "li", "main", "nav", "ol", "p", "picture", "pre", "section",
  "summary", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "ul", "video",
];

// 浏览器/画布运行时注入、非用户意图的属性：前端 cleanForExport 剥离、服务端保存比对忽略，
// 两侧共用同一份清单（包括 spellcheck、contenteditable 和 Canvas 选择状态属性）。
export const editorRuntimeInjectedAttributeNames = [
  "spellcheck",
  "data-resume-editor-img-hint",
  "data-resume-editor-selected",
  "data-resume-editor-original-html",
  "data-resume-editor-original-text",
  "contenteditable",
  "tabindex",
  "role",
  "aria-pressed",
  "translate",
];

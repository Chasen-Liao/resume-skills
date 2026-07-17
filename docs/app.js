const root = document.documentElement;
const content = document.querySelector("#markdown-content");
const themeToggle = document.querySelector("#theme-toggle");
const menuToggle = document.querySelector("#menu-toggle");
const sidebar = document.querySelector("#sidebar");
const navContainer = document.querySelector("#tutorial-nav");
const toast = document.querySelector("#copy-toast");
const progress = document.querySelector("#reading-progress");
const mobileNav = window.matchMedia("(max-width: 1020px)");

const preferredTheme = localStorage.getItem("resume-tutorial-theme") || "light";
root.dataset.theme = preferredTheme;

themeToggle?.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = nextTheme;
  localStorage.setItem("resume-tutorial-theme", nextTheme);
});

menuToggle?.addEventListener("click", () => {
  const open = sidebar.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "关闭文章目录" : "打开文章目录");
  syncMenuAccessibility(open);
});

function syncMenuAccessibility(open = sidebar.classList.contains("open")) {
  const hidden = mobileNav.matches && !open;
  sidebar.inert = hidden;
  if (hidden) sidebar.setAttribute("aria-hidden", "true");
  else sidebar.removeAttribute("aria-hidden");
}

function closeMenu(returnFocus = false) {
  sidebar.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "打开文章目录");
  syncMenuAccessibility(false);
  if (returnFocus) menuToggle?.focus();
}

mobileNav.addEventListener("change", () => {
  if (!mobileNav.matches) sidebar.classList.remove("open");
  syncMenuAccessibility();
});
syncMenuAccessibility();

document.addEventListener("click", (event) => {
  if (!mobileNav.matches || !sidebar.classList.contains("open")) return;
  if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
});

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character]));
}

function safeUrl(value, fallback = "#") {
  try {
    const url = new URL(value, window.location.href);
    if (["http:", "https:", "mailto:", "#"].includes(url.protocol) || value.startsWith("#")) return url.href;
  } catch {
    // Invalid links are rendered as plain text below.
  }
  return fallback;
}

function renderInline(value) {
  const htmlTokens = [];
  const stash = (html) => `\u0000${htmlTokens.push(html) - 1}\u0000`;
  let source = value.replace(/\\([\\`*_{}[\]()#+.!\-])/g, "$1");

  source = source.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/g, (_, alt, url, title) => {
    const href = safeUrl(url, "");
    if (!href) return escapeHtml(alt);
    const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
    return stash(`<img src="${escapeHtml(href)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async"${titleAttribute}>`);
  });
  source = source.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/g, (_, label, url, title) => {
    const href = safeUrl(url);
    const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
    return stash(`<a href="${escapeHtml(href)}"${titleAttribute}>${escapeHtml(label)}</a>`);
  });

  let text = escapeHtml(source)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (_, strong, alternate) => `<strong>${strong || alternate}</strong>`)
    .replace(/\u0000(\d+)\u0000/g, (_, index) => htmlTokens[index]);
  return text;
}

function parseFrontMatter(markdown) {
  const normalized = markdown.replace(/\r\n?/g, "\n");
  if (!normalized.startsWith("---\n")) return { metadata: {}, body: normalized };
  const end = normalized.indexOf("\n---\n", 4);
  if (end < 0) return { metadata: {}, body: normalized };
  const metadata = {};
  for (const line of normalized.slice(4, end).split("\n")) {
    const match = line.match(/^([\w-]+):\s*(.*)$/);
    if (!match) continue;
    metadata[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return { metadata, body: normalized.slice(end + 5) };
}

function slugify(text, usedSlugs) {
  const base = text.toLocaleLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "section";
  const count = usedSlugs.get(base) || 0;
  usedSlugs.set(base, count + 1);
  return count ? `${base}-${count + 1}` : base;
}

function isBlockStart(line) {
  return /^(#{1,6})\s+|^```|^>\s?|^[-*+]\s+|^\d+\.\s+|^!\[[^\]]*\]\(|^---\s*$/.test(line);
}

function renderMarkdown(markdown) {
  const { metadata, body } = parseFrontMatter(markdown);
  const lines = body.trim().split("\n");
  const usedSlugs = new Map();
  const headings = [];
  const output = [];
  let codeNumber = 0;
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trimEnd();
    if (!line.trim()) { index += 1; continue; }

    const fence = line.match(/^```\s*([^\s]*)\s*$/);
    if (fence) {
      const language = fence[1] || "代码";
      const codeLines = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) codeLines.push(lines[index++]);
      if (index < lines.length) index += 1;
      const codeId = `code-${++codeNumber}`;
      output.push(`<div class="code-block"><div class="code-header"><span>${escapeHtml(language)}</span><button type="button" data-copy-target="${codeId}">复制</button></div><pre id="${codeId}"><code>${escapeHtml(codeLines.join("\n"))}</code></pre></div>`);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      const id = slugify(text, usedSlugs);
      headings.push({ id, level, text });
      output.push(`<h${level} id="${id}"${level <= 2 ? " data-section" : ""}>${renderInline(text)}</h${level}>`);
      index += 1;
      continue;
    }

    const image = line.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)$/);
    if (image) {
      const imageHtml = renderInline(line);
      output.push(`<figure>${imageHtml}${image[3] ? `<figcaption>${escapeHtml(image[3])}</figcaption>` : ""}</figure>`);
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^>\s?/, ""));
      output.push(`<blockquote><p>${renderInline(quote.join(" "))}</p></blockquote>`);
      continue;
    }

    const unordered = line.match(/^[-*+]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      const items = [];
      const pattern = ordered ? /^\d+\.\s+(.+)$/ : /^[-*+]\s+(.+)$/;
      while (index < lines.length) {
        const item = lines[index].match(pattern);
        if (!item) break;
        items.push(`<li>${renderInline(item[1])}</li>`);
        index += 1;
      }
      output.push(`<${ordered ? "ol" : "ul"}>${items.join("")}</${ordered ? "ol" : "ul"}>`);
      continue;
    }

    if (/^---\s*$/.test(line)) {
      output.push("<hr>");
      index += 1;
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) paragraph.push(lines[index++].trim());
    output.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
  }

  return { metadata, headings, html: output.join("\n") };
}

function buildNavigation(headings) {
  const visibleHeadings = headings.filter(({ level }) => level <= 2);
  navContainer.innerHTML = visibleHeadings.map(({ id, level, text }, index) =>
    `<a href="#${id}" class="nav-level-${level}${index === 0 ? " active" : ""}"><span>${String(index + 1).padStart(2, "0")}</span>${renderInline(text)}</a>`
  ).join("") || '<span class="nav-loading">暂无章节</span>';
  navContainer.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeMenu()));
}

function observeSections() {
  const navLinks = [...navContainer.querySelectorAll("a")];
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible?.target.id) return;
    navLinks.forEach((link) => {
      const active = link.getAttribute("href") === `#${visible.target.id}`;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-18% 0px -68%", threshold: [0, 0.2, 0.6] });
  content.querySelectorAll("[data-section]").forEach((section) => sectionObserver.observe(section));
}

function renderArticleHeader(metadata) {
  if (!metadata.title) return "";
  const details = [];
  if (metadata.published) details.push(escapeHtml(metadata.published));
  if (metadata.source) {
    const source = safeUrl(metadata.source, "");
    if (source) details.push(`<a href="${escapeHtml(source)}" rel="noreferrer">查看原文</a>`);
  }
  return `<header class="article-header"><p class="article-kicker">Markdown 教程</p><h1 id="article-title">${renderInline(metadata.title)}</h1>${details.length ? `<p class="article-byline">${details.join(" · ")}</p>` : ""}</header>`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.append(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

content.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy-target]");
  if (!button) return;
  const target = document.getElementById(button.dataset.copyTarget);
  if (!target) return;
  try {
    await copyText(target.textContent);
    showToast("已复制到剪贴板");
  } catch {
    showToast("复制失败，请手动选择文本");
  }
});

function updateReadingProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const percent = scrollable > 0 ? Math.min(100, Math.max(0, window.scrollY / scrollable * 100)) : 0;
  progress.style.width = `${percent}%`;
}

window.addEventListener("scroll", updateReadingProgress, { passive: true });
window.addEventListener("resize", updateReadingProgress);

async function loadTutorial() {
  try {
    const response = await fetch(content.dataset.contentSource, { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const tutorial = renderMarkdown(await response.text());
    content.innerHTML = `${renderArticleHeader(tutorial.metadata)}${tutorial.html}`;
    content.setAttribute("aria-busy", "false");
    document.body.classList.add("is-loaded");
    if (tutorial.metadata.title) {
      document.title = tutorial.metadata.title;
      document.querySelector('meta[name="description"]').setAttribute("content", tutorial.metadata.description || tutorial.metadata.title);
    }
    buildNavigation(tutorial.headings);
    observeSections();
    updateReadingProgress();
  } catch (error) {
    content.setAttribute("aria-busy", "false");
    content.innerHTML = `<div class="error-state" role="alert"><h1>教程暂时无法加载</h1><p>请确认 <code>${escapeHtml(content.dataset.contentSource)}</code> 与本页面一起部署，或直接打开 Markdown 原文。</p><a href="${escapeHtml(content.dataset.contentSource)}">打开 Markdown 原文</a></div>`;
    navContainer.innerHTML = '<span class="nav-loading">目录加载失败</span>';
    console.error("Unable to load tutorial markdown", error);
  }
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sidebar.classList.contains("open")) closeMenu(true);
});

updateReadingProgress();
loadTutorial();

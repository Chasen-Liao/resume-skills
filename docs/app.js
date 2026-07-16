const root = document.documentElement;
const themeToggle = document.querySelector("#theme-toggle");
const menuToggle = document.querySelector("#menu-toggle");
const sidebar = document.querySelector("#sidebar");
const toast = document.querySelector("#copy-toast");
const progress = document.querySelector("#reading-progress");
const navLinks = [...document.querySelectorAll(".sidebar nav a")];
const mobileNav = window.matchMedia("(max-width: 1020px)");

const preferredTheme = localStorage.getItem("resume-tutorial-theme")
  || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
root.dataset.theme = preferredTheme;

themeToggle?.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = nextTheme;
  localStorage.setItem("resume-tutorial-theme", nextTheme);
});

menuToggle?.addEventListener("click", () => {
  const open = sidebar.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "关闭教程目录" : "打开教程目录");
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
  menuToggle?.setAttribute("aria-label", "打开教程目录");
  syncMenuAccessibility(false);
  if (returnFocus) menuToggle?.focus();
}

mobileNav.addEventListener("change", () => {
  if (!mobileNav.matches) sidebar.classList.remove("open");
  syncMenuAccessibility();
});
syncMenuAccessibility();

navLinks.forEach((link) => {
  link.addEventListener("click", () => closeMenu());
});

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

document.querySelectorAll("[data-copy-target]").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.getElementById(button.dataset.copyTarget);
    if (!target) return;
    try {
      await copyText(target.textContent.trim());
      showToast("已复制到剪贴板");
    } catch {
      showToast("复制失败，请手动选择文本");
    }
  });
});

const sectionObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible?.target.id) return;
  navLinks.forEach((link) => {
    const active = link.getAttribute("href") === `#${visible.target.id}`;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}, { rootMargin: "-20% 0px -65%", threshold: [0, 0.2, 0.6] });

document.querySelectorAll("[data-section]").forEach((section) => sectionObserver.observe(section));

function updateReadingProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const percent = scrollable > 0 ? Math.min(100, Math.max(0, window.scrollY / scrollable * 100)) : 0;
  progress.style.width = `${percent}%`;
}

window.addEventListener("scroll", updateReadingProgress, { passive: true });
window.addEventListener("resize", updateReadingProgress);
updateReadingProgress();

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sidebar.classList.contains("open")) {
    closeMenu(true);
  }
});

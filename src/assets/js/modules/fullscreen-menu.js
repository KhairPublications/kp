/**
 * Fullscreen overlay menu. The close transition is 800ms in CSS; the
 * element is only hidden once that has finished.
 */
const CLOSE_DURATION_MS = 800;

export function initFullscreenMenu() {
  const menu = document.getElementById("fullscreenMenu");
  const openBtn = document.querySelector(".menu-toggle-btn");
  const closeBtn = document.getElementById("closeMenuBtn");

  if (!menu) return;

  const open = () => {
    menu.style.display = "block";
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => menu.classList.add("active"));
  };

  const close = () => {
    menu.classList.remove("active");
    window.setTimeout(() => {
      menu.style.display = "none";
      document.body.style.overflow = "";
    }, CLOSE_DURATION_MS);
  };

  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  menu.querySelectorAll(".menu-link").forEach((link) =>
    link.addEventListener("click", close)
  );

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("active")) close();
  });
}

/**
 * Collapsible navbar behaviour: swaps the toggler glyph and closes the menu
 * after a link is tapped on small screens.
 */
export function initNavbar() {
  const nav = document.getElementById("navbarNav");
  const icon = document.getElementById("menu-icon");
  const toggler = document.querySelector(".navbar-toggler");

  if (!nav || !icon || !toggler) return;

  nav.addEventListener("show.bs.collapse", () => {
    icon.classList.replace("fa-ellipsis-v", "fa-times");
  });

  nav.addEventListener("hide.bs.collapse", () => {
    icon.classList.replace("fa-times", "fa-ellipsis-v");
  });

  nav.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      const togglerVisible =
        window.getComputedStyle(toggler).display !== "none";
      if (togglerVisible && window.bootstrap) {
        window.bootstrap.Collapse.getOrCreateInstance(nav).hide();
      }
    });
  });
}

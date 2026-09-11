/**
 * Entry point. Loaded as a native ES module, so it is deferred by default
 * and needs no bundler.
 */
import { initNavbar } from "./modules/navbar.js";
import { initAnimations } from "./modules/animations.js";
import { initCarousels } from "./modules/carousels.js";
import { initFullscreenMenu } from "./modules/fullscreen-menu.js";
import { initPdfViewer } from "./modules/pdf-viewer.js";

function boot() {
  initAnimations();
  initNavbar();
  initCarousels();
  initFullscreenMenu();
  initPdfViewer();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

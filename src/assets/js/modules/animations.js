/**
 * Initialises AOS, respecting the visitor's reduced-motion preference.
 */
export function initAnimations() {
  if (typeof window.AOS === "undefined") return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  window.AOS.init({
    // Keep reveals brief. Anything longer reads as the page being slow
    // rather than as a considered transition.
    duration: prefersReducedMotion ? 0 : 650,
    // How far into the viewport an element travels before its reveal
    // starts. AOS defaults to 120.
    offset: 100,
    once: true,
    easing: "ease-out-cubic",
    disable: prefersReducedMotion,
  });
}

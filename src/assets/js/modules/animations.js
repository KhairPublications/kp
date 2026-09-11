/**
 * Initialises AOS, respecting the visitor's reduced-motion preference.
 */
export function initAnimations() {
  if (typeof window.AOS === "undefined") return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  window.AOS.init({
    duration: prefersReducedMotion ? 0 : 1000,
    once: true,
    easing: "ease-in-out",
    disable: prefersReducedMotion,
  });
}

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
    duration: prefersReducedMotion ? 0 : 280,
    // Fire as soon as any part of the element enters the viewport, rather
    // than waiting until it is 120px in, which is AOS's default.
    offset: 0,
    once: true,
    easing: "ease-out-cubic",
    disable: prefersReducedMotion,
  });
}

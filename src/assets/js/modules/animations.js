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
    duration: prefersReducedMotion ? 0 : 450,
    // Start the reveal as the element enters the viewport instead of
    // waiting until it is 120px in, which is AOS's default.
    offset: 40,
    once: true,
    easing: "ease-out-cubic",
    disable: prefersReducedMotion,
  });
}

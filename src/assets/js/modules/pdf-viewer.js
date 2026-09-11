/**
 * Requests fullscreen for any embedded document that opts in with
 * `data-fullscreen-target`, replacing the former inline onclick handler.
 */
export function initPdfViewer() {
  document.querySelectorAll("[data-fullscreen-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(
        button.dataset.fullscreenTarget
      );
      if (!target) return;

      const request =
        target.requestFullscreen ||
        target.webkitRequestFullscreen ||
        target.msRequestFullscreen;

      request?.call(target);
    });
  });
}

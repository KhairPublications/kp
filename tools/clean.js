/**
 * Removes build output. Cross-platform replacement for `rm -rf dist`.
 *
 * Windows keeps a lock on a directory while any process has a handle open
 * inside it (a dev server, an editor, a browser previewing a built PDF), so
 * the removal is retried rather than failing the whole script.
 */
import { rmSync } from "node:fs";

for (const dir of ["dist", ".cache"]) {
  try {
    rmSync(dir, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    });
    console.log(`removed ${dir}`);
  } catch (error) {
    console.warn(
      `could not remove ${dir}: ${error.code ?? error.message}. ` +
        `Close any process using it (dev server, browser, editor) and retry.`
    );
  }
}

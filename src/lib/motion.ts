/** Duration of the `.collapsible` fold in index.css (--fold-ms). Keep in sync. */
export const FOLD_MS = 460;

/** The element that scrolls the app: the phone frame on desktop, the document on phones. */
export function appScroller(): HTMLElement {
  const frame = document.querySelector<HTMLElement>('.app-scroll');
  if (frame && getComputedStyle(frame).display !== 'contents') return frame;
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

/**
 * Scroll by `dy` pixels in lockstep with a `.collapsible` that is folding.
 *
 * Rather than running a second timeline and hoping it matches the CSS one,
 * each frame reads how far the element has actually folded and scrolls by the
 * same fraction — so the two are one movement by construction.
 *
 * Gives way if something else moves the scroll position (the user's finger,
 * or the browser clamping at the end of a page that just got shorter).
 */
export function scrollWithFold(folding: HTMLElement, dy: number) {
  if (Math.abs(dy) < 1) return;
  const el = appScroller();
  const from = el.scrollTop;
  const fullHeight = folding.offsetHeight;
  if (fullHeight <= 0 || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.scrollTop = from + dy;
    return;
  }
  const deadline = performance.now() + FOLD_MS + 250;
  let expected = from;
  const frame = (now: number) => {
    if (Math.abs(el.scrollTop - expected) > 2) return;
    const height = folding.offsetHeight;
    const done = height <= 0 || now > deadline;
    el.scrollTop = from + dy * (done ? 1 : 1 - height / fullHeight);
    expected = el.scrollTop;
    if (!done) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** One pointer owns a gesture. Flush the release position and clean up on interruption. */
export function trackPointerGesture(
  start: Pick<PointerEvent, "pointerId" | "clientX" | "clientY">,
  apply: (event: PointerEvent) => void,
  finish: () => void,
  target: Window = window,
): () => void {
  let pending: PointerEvent | null = null;
  let frame = 0;
  let moved = false;
  let ended = false;
  const flush = () => {
    if (frame) target.cancelAnimationFrame(frame);
    frame = 0;
    const event = pending;
    pending = null;
    if (event) apply(event);
  };
  const move = (event: PointerEvent) => {
    if (event.pointerId !== start.pointerId) return;
    moved ||= Math.hypot(event.clientX - start.clientX, event.clientY - start.clientY) >= 3;
    if (!moved) return;
    pending = event;
    if (!frame) frame = target.requestAnimationFrame(flush);
  };
  const end = () => {
    if (ended) return;
    ended = true;
    target.removeEventListener("pointermove", move);
    target.removeEventListener("pointerup", up);
    target.removeEventListener("pointercancel", cancel);
    target.removeEventListener("blur", end);
    flush();
    finish();
  };
  const up = (event: PointerEvent) => {
    if (event.pointerId !== start.pointerId) return;
    move(event);
    end();
  };
  const cancel = (event: PointerEvent) => { if (event.pointerId === start.pointerId) end(); };
  target.addEventListener("pointermove", move);
  target.addEventListener("pointerup", up);
  target.addEventListener("pointercancel", cancel);
  target.addEventListener("blur", end);
  return end;
}

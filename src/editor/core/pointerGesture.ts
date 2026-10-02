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
  const startId = start.pointerId ?? 1;

  const isPointerMatch = (e: { pointerId?: number }) => {
    return e.pointerId === undefined || e.pointerId === startId;
  };

  const flush = () => {
    if (frame) target.cancelAnimationFrame(frame);
    frame = 0;
    const event = pending;
    pending = null;
    if (event) apply(event);
  };

  const move = (event: Event) => {
    const pe = event as PointerEvent;
    if (!isPointerMatch(pe)) return;
    moved ||= Math.hypot(pe.clientX - start.clientX, pe.clientY - start.clientY) >= 3;
    if (!moved) return;
    pending = pe;
    if (!frame) frame = target.requestAnimationFrame(flush);
  };

  const end = () => {
    if (ended) return;
    ended = true;
    target.removeEventListener("pointermove", move as EventListener);
    target.removeEventListener("mousemove", move as EventListener);
    target.removeEventListener("pointerup", up as EventListener);
    target.removeEventListener("mouseup", up as EventListener);
    target.removeEventListener("pointercancel", cancel as EventListener);
    target.removeEventListener("blur", end);
    flush();
    finish();
  };

  const up = (event: Event) => {
    const pe = event as PointerEvent;
    if (!isPointerMatch(pe)) return;
    move(event);
    end();
  };

  const cancel = (event: Event) => {
    const pe = event as PointerEvent;
    if (isPointerMatch(pe)) end();
  };

  target.addEventListener("pointermove", move as EventListener);
  target.addEventListener("mousemove", move as EventListener);
  target.addEventListener("pointerup", up as EventListener);
  target.addEventListener("mouseup", up as EventListener);
  target.addEventListener("pointercancel", cancel as EventListener);
  target.addEventListener("blur", end);
  return end;
}

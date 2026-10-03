import type { FlowFragment, FlowRun } from '../layoutPartner/textWrapLayout';

/** Map measured lines back to source offsets. Wrapping must never add spaces inside long words. */
export function lineSourceEnds(runs: FlowRun[], lines: FlowFragment[]): number[] {
  const source = runs.map(run => run.text).join('');
  let cursor = 0;
  return lines.map((line, index) => {
    for (const char of line.runs.map(run => run.text).join('')) {
      if (/\s/u.test(char)) { while (cursor < source.length && /\s/u.test(source[cursor])) cursor++; }
      else {
        while (cursor < source.length && /\s/u.test(source[cursor])) cursor++;
        if (!source.startsWith(char, cursor)) throw new Error('The text layout could not preserve a source character. Import a smaller section or use PDF artwork.');
        cursor += char.length;
      }
    }
    while (cursor < source.length && /\s/u.test(source[cursor])) cursor++;
    return index === lines.length - 1 ? source.length : cursor;
  });
}
export function sliceRuns(runs: FlowRun[], start: number, end: number): FlowRun[] {
  let offset = 0;
  return runs.flatMap(run => {
    const from = Math.max(0, start - offset), to = Math.min(run.text.length, end - offset); offset += run.text.length;
    return to > from ? [{ text: run.text.slice(from, to), style: run.style }] : [];
  });
}

/** Frame-boundary whitespace has no printable content and must not create phantom overset lines. */
export function trimFrameRuns(runs: FlowRun[]): FlowRun[] {
  const text = runs.map(run => run.text).join('');
  const leading = text.length - text.trimStart().length;
  return sliceRuns(runs, leading, text.trimEnd().length);
}

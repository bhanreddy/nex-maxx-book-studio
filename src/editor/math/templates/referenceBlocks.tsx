import React from "react";
import type { MathConfigField, MathRendererProps, MathTemplate, MathTopic } from "../types";
import { ARITHMETIC_BLOCK_COLORS as C } from "../tokens";
import { worksheetLines, worksheetNumber } from "../worksheetDesign";
import { arithmeticTrace, arithmeticCase, evaluateArithmetic, latticeTrace, type ArithmeticOperation } from "../referenceArithmetic";

type Data = Record<string, unknown>;
type Question = { a: number; b: number; operation: ArithmeticOperation; note?: string; expression?: string };
const str = (v: unknown) => String(v ?? "");
const sizeOf = (d: Data) => worksheetNumber(d.fontSize, 18, 14, 26);
const gapOf = (d: Data) => worksheetNumber(d.questionGap, 14, 4, 60);
const color = (v: unknown, fallback: string) => /^#[a-f\d]{6}$/i.test(str(v)) ? str(v) : fallback;
const palettes = ["teal", "violet", "rose", "blue", "green", "orange"] as const;
function theme(d: Data, clean: boolean) {
  const p = C[palettes.find(k => k === d.palette) || "violet"];
  return { main: clean ? C.ink : color(d.accentColor, p.main), tint: clean ? "#f5f7fa" : color(d.panelColor, p.tint), ink: color(d.inkColor, C.ink), rule: color(d.ruleColor, C.rule), clean };
}
const paragraphHeight = (value: unknown, width: number, size: number) => worksheetLines(value, width, size).length * size * 1.4;
function header(d: Data, w: number) { const s = sizeOf(d); return 26 + paragraphHeight(d.title, w - 58, s + 6) + (str(d.instructions) ? 14 + paragraphHeight(d.instructions, w - 48, s - 2) : 0) + 20; }
function Text({ value, x, y, width, size, fill, bold = false, field, path }: { value: unknown; x: number; y: number; width: number; size: number; fill: string; bold?: boolean; field: string; path?: (string | number)[] }) {
  return <g>{worksheetLines(value, width, size).map((v, i) => <text key={`${field}-${i}`} data-math-field={path ? JSON.stringify(path) : undefined} x={x} y={y + size + i * size * 1.4} fontSize={size} fill={fill} fontWeight={bold ? 700 : 400}>{v}</text>)}</g>;
}
function equation(q: Question) { return q.expression || `${q.a} ${q.operation} ${q.b}`; }
function answer(q: Question) { return q.expression ? str(evaluateArithmetic(q.expression)) : arithmeticTrace(q.a, q.b, q.operation).answer; }
function questions(d: Data) { return Array.isArray(d.questions) ? d.questions.slice(0, 50) as Question[] : []; }
function problemStory(d: Data) { return str(d.story).replace(/\{\{a\}\}/g, str(d.a)).replace(/\{\{b\}\}/g, str(d.b)); }
function dimensions(d: Data, w: number) {
  const s = sizeOf(d), gap = gapOf(d), start = header(d, w), kind = str(d.kind);
  const rows: { q: Question; x: number; y: number; width: number; height: number }[] = [];
  let y = start;
  if (kind === "practice" || kind === "mixed" || kind === "warmup") {
    const requested = Math.round(worksheetNumber(d.columns, 2, 1, 3));
    const cols = Math.min(requested, Math.max(1, Math.floor((w - 36 + gap) / 220))), cw = (w - 36 - gap * (cols - 1)) / cols;
    const qs = questions(d);
    for (let i = 0; i < qs.length; i += cols) {
      const batch = qs.slice(i, i + cols), heights = batch.map(q => {
        let response = d.showGrid && q.operation !== "÷" && !q.expression ? gridHeight(d) + 16 : 62 + worksheetNumber(d.answerSpace, 0, 0, 180);
        try { answer(q); } catch (err) { response = Math.max(response, 24 + paragraphHeight(err instanceof Error ? err.message : "Check this question.", cw - 44, s - 3)); }
        return 22 + paragraphHeight(q.note || "", cw - 44, s - 3) + paragraphHeight(equation(q), cw - 44, s) + response;
      });
      const rh = Math.max(...heights);
      batch.forEach((q, c) => rows.push({ q, x: 18 + c * (cw + gap), y, width: cw, height: rh })); y += rh + gap;
    }
  } else if (kind === "worked") {
    const trace = arithmeticTrace(d.a, d.b, d.operation);
    y += trace.op === "÷" ? divisionHeight(trace.division.length, s) : gridHeight(d) + (trace.op === "×" && trace.b >= 10 ? String(trace.b).split("").reverse().reduce((sum, digit, i) => sum + paragraphHeight(`${trace.a} × ${digit} × ${10 ** i} = ${trace.a * Number(digit) * 10 ** i}`, w - 48, s) + 12, 0) : 0);
    y += 44;
    if (d.showSteps !== false) trace.steps.forEach(step => { y += 16 + paragraphHeight(step.title, w - 84, s) + Math.max(paragraphHeight(step.detail, w - 84, s - 2), paragraphHeight("Show your working here: ____________________", w - 84, s - 2)) + gap; });
  } else if (kind === "lattice") {
    const trace = latticeTrace(d.a, d.b); y += (trace.side.length + 1) * 64 + 76;
    if (d.showSteps !== false) y += trace.diagonals.reduce((sum, v, i) => sum + paragraphHeight(`Diagonal ${i + 1} from right: ${v.sum}${v.incoming ? ` + ${v.incoming} carried` : ""} → write ${v.digit}, carry ${v.carry}.`, w - 48, s - 2) + 12, 0);
  } else if (kind === "word") {
    const trace = arithmeticTrace(d.a, d.b, d.operation);
    y += paragraphHeight(problemStory(d), w - 48, s) + 22 + paragraphHeight(d.workingLabel, w - 48, s - 2) + 12 + (trace.op === "÷" ? divisionHeight(trace.division.length, s) : gridHeight(d)) + paragraphHeight(d.answerLabel, w - 48, s - 2) + 16 + Math.max(36 + worksheetNumber(d.answerSpace, 48, 0, 180), 16 + paragraphHeight(`${trace.answer} ${str(d.unit)}`, w - 60, s));
  } else if (kind === "missing") {
    const trace = arithmeticTrace(d.a, d.b, d.operation);
    if (d.challenge !== "digit" && (trace.op === "×" && trace.a === 0 || trace.op === "÷" && trace.result === 0)) throw new Error("Use a non-zero product or quotient so the missing number has one answer.");
    y += 132 + worksheetNumber(d.answerSpace, 24, 0, 180);
  } else if (kind === "division-parts" || kind === "division-check") {
    arithmeticTrace(d.a, d.b, "÷"); if (kind === "division-parts") y += divisionPartsLayout(d, w).height;
    else { const m = divisionCheckLayout(d, w); y += m.formulaHeight + m.equationHeight + m.reminderHeight + 40; }
  } else if (kind === "repeated") {
    const trace = arithmeticTrace(d.a, d.b, "÷");
    if (trace.a > 60 || trace.result > 20) throw new Error("Use at most 60 counters and 20 subtraction steps in this visual model.");
    y += Math.ceil(trace.a / Math.max(1, Math.floor((w - 64) / 26))) * 28 + 36 + trace.result * (s * 1.4 + 8) + 68;
  } else {
    const items = Array.isArray(d.items) ? d.items.slice(0, 50) : [];
    items.forEach(item => { y += 18 + paragraphHeight(item, w - 82, s) + gap; });
  }
  return { start, rows, height: Math.max(start + 48, y + 18) };
}
const gridHeight = (d: Data) => (sizeOf(d) + 15) * (d.showRegrouping === false ? 4 : 5);
const divisionHeight = (steps: number, size: number) => (steps * 3 + 2) * (size + 12) + 12;
const divisionDescriptions = ["The number being divided", "The number we divide by", "The number of equal groups", "The amount left over"];
function divisionPartsLayout(d: Data, w: number) {
  const s = sizeOf(d), cw = (w - 48) / 2;
  const labels = Array.isArray(d.labels) ? d.labels.slice(0, 4) : ["Dividend", "Divisor", "Quotient", "Remainder"];
  const descriptions = Array.isArray(d.descriptions) ? d.descriptions : divisionDescriptions;
  const cards = labels.map((label, i) => {
    const description = descriptions[i] ?? "", labelHeight = paragraphHeight(label, cw - 28, s - 1), descriptionHeight = paragraphHeight(description, cw - 28, s - 4);
    return { label, description, labelHeight, descriptionHeight, height: 20 + labelHeight + 10 + descriptionHeight + 16 + (s + 3) * 1.4 };
  });
  const rowHeights = [Math.max(...cards.slice(0, 2).map(c => c.height), 0), Math.max(...cards.slice(2, 4).map(c => c.height), 0)];
  return { cw, cards, rowHeights, height: rowHeights.reduce((sum, h) => sum + h, 0) + 12 };
}
function divisionCheckLayout(d: Data, w: number) { const s = sizeOf(d); return { formulaHeight: paragraphHeight(d.formulaLabel, w - 48, s), equationHeight: paragraphHeight(`${d.b} × 999999 + 999999 = ${d.a}`, w - 48, s + 3), reminderHeight: paragraphHeight(d.reminder, w - 48, s - 2) }; }

export function referenceBlockHeight(d: Data, width: number) { try { return dimensions(d, width).height; } catch (err) { return header(d, width) + 30 + paragraphHeight(err instanceof Error ? err.message : "Check the numbers.", width - 48, sizeOf(d)); } }

function Grid({ d, a, b, op, x, y, width, show, t, missing }: { d: Data; a: unknown; b: unknown; op: unknown; x: number; y: number; width: number; show: boolean; t: ReturnType<typeof theme>; missing?: number }) {
  const trace = arithmeticTrace(a, b, op), s = sizeOf(d), row = s + 15, n = trace.columns, cw = (width - 24) / n;
  const names = ["O", "T", "H", "Th", "TTh", "L", "TL", "C", "TC", "10¹⁰", "10¹¹", "10¹²"];
  const showRegroup = d.showRegrouping !== false;
  const pad = (value: number) => String(value).padStart(n, " ").split("");
  const operands = [pad(trace.a), pad(trace.b), show ? pad(trace.result) : Array<string>(n).fill("")];
  const topY = y + row * (showRegroup ? 2 : 1);
  return <g>
    {Array.from({ length: n }, (_, i) => <g key={`column-${i}`}>
      <rect x={x + 24 + i * cw} y={y} width={cw} height={row} fill={t.clean ? t.ink : C.places[(n - 1 - i) % C.places.length]} />
      <text x={x + 24 + (i + .5) * cw} y={y + row * .7} textAnchor="middle" fontSize={Math.min(s - 2, cw * .5)} fill="white" fontWeight={700}>{names[n - 1 - i]}</text>
      {showRegroup && <g><rect x={x + 24 + i * cw} y={y + row} width={cw} height={row} fill="white" stroke={t.rule} />
        <text x={x + 24 + (i + .5) * cw} y={y + row * 1.7} textAnchor="middle" fontSize={s - 3} fill={t.main} fontWeight={700}>{show ? trace.op === "−" && trace.modified[i] !== trace.top[i] ? trace.modified[i] : trace.carries[i] || "" : ""}</text></g>}
      {operands.map((digits, r) => <g key={`row-${r}`}>
        <rect x={x + 24 + i * cw} y={topY + r * row} width={cw} height={row} fill={r === 2 ? t.tint : "white"} stroke={t.rule} />
        <text x={x + 24 + (i + .5) * cw} y={topY + (r + .7) * row} textAnchor="middle" fontSize={Math.min(s + 2, cw * .7)} fontWeight={r === 2 ? 700 : 500} fill={r === 2 ? t.main : t.ink}>{missing === i && r === 0 ? "?" : digits[i]}</text>
        {show && r === 0 && trace.op === "−" && trace.modified[i] !== trace.top[i] && <line x1={x + 24 + (i + .3) * cw} x2={x + 24 + (i + .7) * cw} y1={topY + row * .8} y2={topY + row * .3} stroke={C.rose.main} strokeWidth={1.4} />}
      </g>)}
    </g>)}
    <text x={x + 10} y={topY + row * 1.7} textAnchor="middle" fontSize={s + 2} fill={t.ink}>{trace.op}</text>
    <line x1={x + 24} x2={x + width} y1={topY + row * 2} y2={topY + row * 2} stroke={t.ink} strokeWidth={2} />
  </g>;
}

function LongDivision({ trace, x, y, width, s, show, t }: { trace: ReturnType<typeof arithmeticTrace>; x: number; y: number; width: number; s: number; show: boolean; t: ReturnType<typeof theme> }) {
  const digits = String(trace.a).split(""), divisorWidth = Math.max(62, String(trace.b).length * (s + 3) * .65 + 28), cw = Math.min(38, (width - divisorWidth - 8) / digits.length), row = s + 12, left = x + divisorWidth;
  const digitRow = (value: number | string, index: number, baseline: number, key: string) => String(value).split("").map((digit, i, list) => <text key={`${key}-${i}`} x={left + (index - list.length + i + .5) * cw} y={baseline} fontSize={s + 3} textAnchor="middle" fill={t.ink}>{digit}</text>);
  return <g>
    <path d={`M ${left - 14} ${y + row} Q ${left + 2} ${y + row * 1.7} ${left - 14} ${y + row * 2.2} M ${left - 14} ${y + row} H ${left + cw * digits.length}`} fill="none" stroke={t.ink} strokeWidth={2} />
    <text x={left - 23} y={y + row * 1.85} fontSize={s + 3} textAnchor="end" fill={t.ink}>{trace.b}</text>
    {digits.map((v, i) => <text key={`dividend-${i}`} x={left + (i + .5) * cw} y={y + row * 1.85} fontSize={s + 3} textAnchor="middle" fill={t.ink}>{v}</text>)}
    {trace.division.map((step, i) => { const yy = y + row * (2.9 + i * 3), right = left + (step.index + 1) * cw; return <g key={`division-step-${i}`}>
      <rect x={left + step.index * cw} y={y} width={cw} height={row - 4} rx={4} fill={t.tint} stroke={t.rule} />
      <text x={left + (step.index + .5) * cw} y={y + row * .7} fontSize={s + 2} textAnchor="middle" fill={t.main} fontWeight={700}>{show ? step.digit : ""}</text>
      {i > 0 && show && digitRow(step.current, step.index + 1, yy - row, `current-${i}`)}
      <text x={left - 16} y={yy} fontSize={s} fill={t.ink}>−</text>
      {digitRow(show ? step.product : "□".repeat(String(step.product).length), step.index + 1, yy, `product-${i}`)}
      <line x1={left - 4} x2={right} y1={yy + 7} y2={yy + 7} stroke={t.ink} strokeWidth={1.5} />
      {digitRow(show ? step.remainder : "□", step.index + 1, yy + row, `remainder-${i}`)}
    </g>; })}
  </g>;
}

export const ReferenceBlockRenderer: React.FC<MathRendererProps> = ({ data: d, width: w, height, mode, styleVariant }) => {
  const s = sizeOf(d), t = theme(d, styleVariant === "clean" || d.monochrome === true), gap = gapOf(d), kind = str(d.kind), show = mode === "teacher" || d.showExample === true;
  const nodes: React.ReactNode[] = [];
  let metrics: ReturnType<typeof dimensions>;
  try { metrics = dimensions(d, w); } catch (err) {
    metrics = { start: header(d, w), rows: [], height: referenceBlockHeight(d, w) };
    nodes.push(<Text key="validation" value={err instanceof Error ? err.message : "Check the numbers."} x={24} y={metrics.start + 12} width={w - 48} size={s} fill={C.rose.main} field="validation" />);
  }
  const panel = (key: string, x: number, y: number, width: number, height: number, tint = t.tint) => <rect key={key} x={x} y={y} width={width} height={height} rx={worksheetNumber(d.cornerRadius, 14, 0, 28)} fill={tint} />;
  const text = (key: string, value: unknown, x: number, y: number, width: number, size = s, bold = false, fill: string = t.ink, path?: (string | number)[]) => <Text key={key} value={value} x={x} y={y} width={width} size={size} fill={fill} bold={bold} field={key} path={path} />;
  let y = metrics.start;
  if (!nodes.length) try {
    if (kind === "practice" || kind === "mixed" || kind === "warmup") {
      metrics.rows.forEach((r, i) => {
        const p = C[palettes[i % palettes.length]], tint = t.clean ? t.tint : p.tint;
        const noteHeight = paragraphHeight(r.q.note || "", r.width - 44, s - 3), promptHeight = paragraphHeight(equation(r.q), r.width - 44, s);
        const yy = r.y + 18 + noteHeight;
        let solution = "", error = ""; try { solution = answer(r.q); } catch (err) { error = err instanceof Error ? err.message : "Check this question."; }
        nodes.push(<g key={`question-${i}`}>
          {panel("panel", r.x, r.y, r.width, r.height, tint)}
          <circle cx={r.x + 17} cy={r.y + 21} r={11} fill={t.clean ? t.main : p.main} />
          <text x={r.x + 17} y={r.y + 26} fontSize={13} textAnchor="middle" fill="white" fontWeight={700}>{i + 1}</text>
          {text("note", r.q.note, r.x + 36, r.y + 8, r.width - 48, s - 3, true, t.main, ["questions", i, "note"])}
          {text("equation", `${equation(r.q)} =`, r.x + 22, yy, r.width - 44, s, true)}
          {error ? text("error", error, r.x + 22, yy + promptHeight + 10, r.width - 44, s - 3, false, C.rose.main) : d.showGrid && r.q.operation !== "÷" && !r.q.expression ? <Grid d={d} a={r.q.a} b={r.q.b} op={r.q.operation} x={r.x + 10} y={yy + promptHeight + 14} width={r.width - 24} show={mode === "teacher" || d.showExample === true && i === 0} t={t} /> : <g>
            <rect x={r.x + 22} y={yy + promptHeight + 12} width={r.width - 44} height={36 + worksheetNumber(d.answerSpace, 0, 0, 180)} rx={8} fill="white" stroke={t.rule} />
            {text("calculated", mode === "teacher" || d.showExample === true && i === 0 ? solution : "", r.x + 34, yy + promptHeight + 16, r.width - 68, s, true, t.main)}
          </g>}
        </g>);
      });
    } else if (kind === "worked") {
      const trace = arithmeticTrace(d.a, d.b, d.operation);
      nodes.push(text("equation", `${trace.a} ${trace.op} ${trace.b}`, 24, y, w - 48, s + 3, true, t.main)); y += 38;
      if (trace.op === "÷") {
        nodes.push(<LongDivision key="division" trace={trace} x={24} y={y} width={w - 48} s={s} show={show} t={t} />); y += divisionHeight(trace.division.length, s);
      } else {
        nodes.push(<Grid key="grid" d={d} a={trace.a} b={trace.b} op={trace.op} x={24} y={y} width={Math.min(w - 48, Math.max(220, trace.columns * 44))} show={show} t={t} />); y += gridHeight(d);
        if (trace.op === "×" && trace.b >= 10) String(trace.b).split("").reverse().forEach((digit, i) => { nodes.push(text(`partial-${i}`, show ? `${trace.a} × ${digit} × ${10 ** i} = ${trace.a * Number(digit) * 10 ** i}` : `Partial product ${i + 1}: __________`, 24, y, w - 48, s)); y += paragraphHeight(show ? `${trace.a} × ${digit} × ${10 ** i} = ${trace.a * Number(digit) * 10 ** i}` : `Partial product ${i + 1}: __________`, w - 48, s) + 12; });
      }
      if (d.showSteps !== false) trace.steps.forEach((step, i) => {
        const h = 16 + paragraphHeight(step.title, w - 84, s) + Math.max(paragraphHeight(step.detail, w - 84, s - 2), paragraphHeight("Show your working here: ____________________", w - 84, s - 2));
        nodes.push(<g key={`step-${i}`}>{panel("panel", 18, y, w - 36, h)}<circle cx={38} cy={y + 24} r={12} fill={t.main} /><text x={38} y={y + 29} textAnchor="middle" fontSize={14} fontWeight={700} fill="white">{i + 1}</text>
          {text("heading", step.title, 60, y + 8, w - 84, s, true, t.main)}
          {text("detail", show ? step.detail : "Show your working here: ____________________", 60, y + 8 + paragraphHeight(step.title, w - 84, s), w - 84, s - 2)}
        </g>); y += h + gap;
      });
    } else if (kind === "lattice") {
      const trace = latticeTrace(d.a, d.b), cell = Math.min(64, (w - 100) / trace.top.length), x = 42; y += 30;
      trace.top.forEach((v, i) => nodes.push(<text key={`factor-top-${i}`} x={x + (i + .5) * cell} y={y - 10} fontSize={s + 4} fill={C.blue.main} textAnchor="middle" fontWeight={700}>{v}</text>));
      trace.cells.forEach((row, r) => {
        nodes.push(<text key={`factor-side-${r}`} x={x + trace.top.length * cell + 20} y={y + (r + .65) * cell} fontSize={s + 4} fill={C.blue.main} fontWeight={700}>{trace.side[r]}</text>);
        row.forEach((v, c) => nodes.push(<g key={`cell-${r}-${c}`}><rect x={x + c * cell} y={y + r * cell} width={cell} height={cell} fill={r % 2 ? t.tint : "white"} stroke={t.rule} /><line x1={x + c * cell} y1={y + (r + 1) * cell} x2={x + (c + 1) * cell} y2={y + r * cell} stroke={t.rule} />
          <text x={x + (c + .22) * cell} y={y + (r + .38) * cell} fontSize={s} fill={C.rose.main}>{show ? v.tens : ""}</text><text x={x + (c + .64) * cell} y={y + (r + .83) * cell} fontSize={s} fill={t.ink}>{show ? v.ones : ""}</text></g>));
      }); y += trace.side.length * cell + 20;
      nodes.push(text("product", `${trace.a} × ${trace.b} = ${show ? trace.result : "________"}`, 24, y, w - 48, s + 2, true, t.main)); y += 46;
      if (d.showSteps !== false) trace.diagonals.forEach((v, i) => { nodes.push(text(`diagonal-${i}`, show ? `Diagonal ${i + 1} from right: ${v.sum}${v.incoming ? ` + ${v.incoming} carried` : ""} → write ${v.digit}, carry ${v.carry}.` : `Diagonal ${i + 1} from right: __________________`, 24, y, w - 48, s - 2)); y += paragraphHeight(`Diagonal ${i + 1} from right: ${v.sum}${v.incoming ? ` + ${v.incoming} carried` : ""} → write ${v.digit}, carry ${v.carry}.`, w - 48, s - 2) + 12; });
    } else if (kind === "word") {
      const trace = arithmeticTrace(d.a, d.b, d.operation), story = problemStory(d), sh = paragraphHeight(story, w - 48, s);
      nodes.push(panel("story-panel", 18, y, w - 36, sh + 16), text("story", story, 24, y + 4, w - 48)); y += sh + 22;
      nodes.push(text("working-label", d.workingLabel, 24, y, w - 48, s - 2, true, t.main)); y += paragraphHeight(d.workingLabel, w - 48, s - 2) + 12;
      if (trace.op === "÷") nodes.push(<LongDivision key="working" trace={trace} x={24} y={y} width={w - 48} s={s} show={show} t={t} />);
      else nodes.push(<Grid key="working" d={d} a={d.a} b={d.b} op={d.operation} x={24} y={y} width={w - 48} show={show} t={t} />);
      // Reserve the complete long-division working, including each brought-down digit.
      y += trace.op === "÷" ? divisionHeight(trace.division.length, s) : gridHeight(d);
      nodes.push(text("answer-label", d.answerLabel, 24, y + 8, w - 48, s - 2, true, t.main)); y += paragraphHeight(d.answerLabel, w - 48, s - 2) + 16;
      nodes.push(panel("answer-panel", 18, y, w - 36, Math.max(36 + worksheetNumber(d.answerSpace, 48, 0, 180), 16 + paragraphHeight(`${trace.answer} ${str(d.unit)}`, w - 60, s))), text("calculated-answer", show ? `${trace.answer} ${str(d.unit)}` : "", 30, y + 8, w - 60, s, true, t.main));
    } else if (kind === "missing") {
      const trace = arithmeticTrace(d.a, d.b, d.operation);
      const hole = Math.min(String(trace.a).length - 1, Math.max(0, Math.round(worksheetNumber(d.missingPlace, 1, 0, 5)))), digits = String(trace.a).split("");
      const value = d.challenge === "digit" ? digits[digits.length - 1 - hole] : trace.b;
      if (d.challenge === "digit") digits[digits.length - 1 - hole] = "□";
      nodes.push(panel("challenge", 18, y, w - 36, 78), text("challenge-equation", `${d.challenge === "digit" ? digits.join("") : trace.a} ${trace.op} ${d.challenge === "digit" ? trace.b : "□"} = ${trace.result}${trace.remainder ? ` R ${trace.remainder}` : ""}`, 30, y + 18, w - 60, s + 3, true));
      nodes.push(text("solution", show ? `Missing ${d.challenge === "digit" ? "digit" : "number"}: ${value}` : "My answer: __________________", 24, y + 98, w - 48, s, true, t.main));
    } else if (kind === "division-parts" || kind === "division-check") {
      const tr = arithmeticTrace(d.a, d.b, "÷");
      if (kind === "division-parts") {
        const layout = divisionPartsLayout(d, w), values = [tr.a, tr.b, tr.result, tr.remainder];
        layout.cards.forEach((card, i) => { const xx = 18 + i % 2 * (layout.cw + 12), yy = y + (i < 2 ? 0 : layout.rowHeights[0] + 12), p = C[(["rose", "blue", "green", "orange"] as const)[i]];
          nodes.push(<g key={`part-${i}`}>{panel("panel", xx, yy, layout.cw, layout.rowHeights[Math.floor(i / 2)], t.clean ? t.tint : p.tint)}
            {text("label", card.label, xx + 14, yy + 8, layout.cw - 28, s - 1, true, t.clean ? t.main : p.main, ["labels", i])}
            {text("description", card.description, xx + 14, yy + 18 + card.labelHeight, layout.cw - 28, s - 4, false, t.ink, ["descriptions", i])}
            {text("value", i < 2 || show ? values[i] : "□", xx + 14, yy + 30 + card.labelHeight + card.descriptionHeight, layout.cw - 28, s + 3, true, t.main)}</g>);
        });
      } else {
        const m = divisionCheckLayout(d, w);
        nodes.push(text("formula", d.formulaLabel, 24, y, w - 48, s, true, t.main), text("check", show ? `${tr.b} × ${tr.result} + ${tr.remainder} = ${tr.a}` : `${tr.b} × □ + □ = ${tr.a}`, 24, y + m.formulaHeight + 14, w - 48, s + 3, true), text("reminder", d.reminder, 24, y + m.formulaHeight + m.equationHeight + 28, w - 48, s - 2));
      }
    } else if (kind === "repeated") {
      const tr = arithmeticTrace(d.a, d.b, "÷"), cols = Math.max(1, Math.floor((w - 64) / 26));
      for (let i = 0; i < tr.a; i++) { const p = C[palettes[Math.floor(i / tr.b) % palettes.length]]; nodes.push(<circle key={`counter-${i}`} cx={36 + i % cols * 26} cy={y + 12 + Math.floor(i / cols) * 28} r={8} fill={t.clean ? t.main : p.main} />); }
      y += Math.ceil(tr.a / cols) * 28 + 26;
      for (let i = 0; i < tr.result; i++) { nodes.push(text(`subtract-${i}`, show ? `${tr.a - i * tr.b} − ${tr.b} = ${tr.a - (i + 1) * tr.b}     (${i + 1} ${i ? "groups" : "group"})` : `${tr.a - i * tr.b} − ${tr.b} = □`, 24, y, w - 48)); y += s * 1.4 + 8; }
      nodes.push(text("division-answer", `${tr.a} ÷ ${tr.b} = ${show ? tr.answer : "□"}`, 24, y + 8, w - 48, s + 2, true, t.main));
    } else {
      const items = Array.isArray(d.items) ? d.items : [];
      items.slice(0, 50).forEach((v, i) => { const h = 18 + paragraphHeight(v, w - 82, s); nodes.push(<g key={`item-${i}`}>{panel("panel", 18, y, w - 36, h)}{kind === "checklist" ? <rect x={32} y={y + 12} width={18} height={18} rx={4} fill="white" stroke={t.main} /> : <g><circle cx={40} cy={y + 24} r={12} fill={t.main} /><text x={40} y={y + 29} fontSize={14} fill="white" textAnchor="middle" fontWeight={700}>{i + 1}</text></g>}{text("item", v, 62, y + 8, w - 82, s, false, t.ink, ["items", i])}</g>); y += h + gap; });
    }
  } catch (err) { if (!nodes.length) nodes.push(text("validation", err instanceof Error ? err.message : "Check the numbers.", 24, y + 12, w - 48, s, false, C.rose.main)); }
  const actualHeight = Math.max(height, metrics.height);
  return <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox={`0 0 ${w} ${actualHeight}`} fontFamily="Inter, sans-serif" aria-label={str(d.title)}>
    <rect key="paper" x={.7} y={.7} width={w - 1.4} height={actualHeight - 1.4} rx={worksheetNumber(d.cornerRadius, 14, 0, 28)} fill="white" stroke={t.rule} strokeWidth={1.4} />
    <rect key="accent" x={20} y={22} width={4} height={paragraphHeight(d.title, w - 58, s + 6)} rx={2} fill={t.main} />
    {text("title", d.title, 34, 20, w - 58, s + 6, true, t.main)}
    {text("instructions", d.instructions, 24, 34 + paragraphHeight(d.title, w - 58, s + 6), w - 48, s - 2)}
    {nodes}
  </svg>;
};

const common: MathConfigField[] = [
  { key: "title", label: "Heading", type: "text", defaultValue: "Worked example" },
  { key: "instructions", label: "Instructions", type: "text", defaultValue: "" },
  { key: "palette", label: "Accent palette", type: "select", defaultValue: "violet", options: palettes.map(p => ({ label: p[0].toUpperCase() + p.slice(1), value: p })) },
  ...([["fontSize", "Text size", 14, 26, 18], ["questionGap", "Space between cards", 4, 60, 14], ["cornerRadius", "Corner radius", 0, 28, 14], ["answerSpace", "Extra answer height", 0, 180, 24]] as const).map(([key, label, min, max, defaultValue]): MathConfigField => ({ key, label, min, max, defaultValue, type: "number" })),
  { key: "showExample", label: "Show solved example to students", type: "boolean", defaultValue: false },
  { key: "inkColor", label: "Text color", type: "color", defaultValue: C.ink },
  { key: "ruleColor", label: "Grid & outline color", type: "color", defaultValue: C.rule },
];
const operations = { key: "operation", label: "Operation", type: "select", defaultValue: "+", options: ["+", "−", "×", "÷"].map(value => ({ label: value, value })) } satisfies MathConfigField;
function make(id: string, name: string, category: MathTopic, kind: string, data: Data, grades: MathTemplate["grades"] = [3, 4, 5], caseKind?: string): MathTemplate {
  const defaults = { title: name, instructions: "", kind, palette: category === "addition" ? "teal" : category === "subtraction" ? "rose" : category === "multiplication" ? "blue" : "violet", fontSize: grades.includes(1) ? 20 : 18, questionGap: 14, cornerRadius: 14, answerSpace: 24, monochrome: false, showExample: kind === "worked" || kind === "lattice" || kind === "division-parts" || kind === "division-check" || kind === "repeated", showRegrouping: true, ...data };
  const p = C[palettes.find(k => k === defaults.palette) || "violet"];
  const fields = [...common,
    { key: "accentColor", label: "Custom accent color", type: "color", defaultValue: p.main },
    { key: "panelColor", label: "Custom panel color", type: "color", defaultValue: p.tint },
    { key: "monochrome", label: "Monochrome printing", type: "boolean", defaultValue: false },
  ] satisfies MathConfigField[];
  if ("a" in data) fields.push({ key: "a", label: "First number / dividend", type: "number", defaultValue: data.a, min: 0, max: kind === "lattice" ? 999 : 999999 }, { key: "b", label: "Second number / divisor", type: "number", defaultValue: data.b, min: 0, max: kind === "lattice" ? 999 : 999999 });
  if ("operation" in data) fields.push({ ...operations, defaultValue: data.operation });
  if ("questions" in data) fields.push({ key: "questions", label: "Questions", type: "items", defaultValue: data.questions }, { key: "columns", label: "Question columns (adapts to width)", type: "number", min: 1, max: 3, defaultValue: 2 });
  fields.push({ key: "showRegrouping", label: "Show carry / regrouping row", type: "boolean", defaultValue: true });
  const t: MathTemplate = { id: `reference-${id}`, name, category, subcategory: "Colourful arithmetic blocks", chapterTag: "Reference Arithmetic Blocks", type: kind === "worked" || kind === "lattice" ? "worked-example" : kind === "missing" ? "challenge" : ["practice", "mixed", "warmup", "word"].includes(kind) ? "practice" : "visual-model", grades, tags: ["reference", "pure blocks", "colourful", "editable", "arithmetic", id, caseKind || ""], defaultData: defaults, defaultWidth: 480, defaultHeight: 300, measureHeight: referenceBlockHeight, styleVariants: ["color-coded", "visual", "clean"], renderer: ReferenceBlockRenderer, configFields: fields };
  if (caseKind) t.generator = () => {
    if (kind === "practice" || kind === "warmup") return { questions: (data.questions as Question[]).map(q => ({ ...q, ...arithmeticCase(q.note === "Borrow through zero" ? "sub-zero" : caseKind) })) };
    return arithmeticCase(caseKind);
  };
  if ((kind === "practice" || kind === "warmup") && !t.generator) t.generator = () => ({ questions: (data.questions as Question[]).map(row => {
    if (kind === "warmup") { const scale = 10 ** Math.max(1, String(row.a).length - 1); return { ...row, a: (1 + Math.floor(Math.random() * 8)) * scale, b: (1 + Math.floor(Math.random() * 8)) * scale }; }
    if (grades.length === 1 && grades[0] <= 2) { const b = 2 + Math.floor(Math.random() * 4), a = 2 + Math.floor(Math.random() * (grades[0] === 1 ? 4 : 8)); return { ...row, a: row.operation === "÷" ? a * b : row.operation === "−" ? a + b : a, b }; }
    return { ...row, ...arithmeticCase(row.operation === "+" ? "add-carry" : row.operation === "−" ? "sub-borrow" : row.operation === "×" ? "multiply-carry" : row.a % row.b ? "divide-remainder" : "divide-exact") };
  }) });
  if (kind === "mixed") t.generator = () => { const a = 2 + Math.floor(Math.random() * 8), b = 2 + Math.floor(Math.random() * 8); return { questions: [{ expression: `${a} × ${b} + 47` }, { expression: `${a * b} ÷ ${b} + 28` }, { expression: `1200 − ${a} × ${b}` }, { expression: `(472 + ${a}) − 93` }] }; };
  t.defaultHeight = referenceBlockHeight(defaults, t.defaultWidth); return t;
}
const q = (a: number, b: number, operation: ArithmeticOperation, note = ""): Question => ({ a, b, operation, note });
const worked = (id: string, name: string, category: MathTopic, a: number, b: number, operation: ArithmeticOperation, caseKind: string) => make(id, name, category, "worked", { a, b, operation, showSteps: true, instructions: "Follow each place-value step. Start from the ones." }, [3, 4, 5], caseKind);
export const REFERENCE_BLOCK_TEMPLATES: MathTemplate[] = [
  worked("addition-no-carry", "Addition • without regrouping", "addition", 123, 234, "+", "add-no-carry"),
  worked("addition-regrouping", "Addition • regrouping steps", "addition", 25478, 16936, "+", "add-carry"),
  worked("subtraction-no-borrow", "Subtraction • without borrowing", "subtraction", 325, 124, "−", "sub-no-borrow"),
  worked("subtraction-borrowing", "Subtraction • borrowing steps", "subtraction", 4326, 1758, "−", "sub-borrow"),
  worked("subtraction-through-zero", "Subtraction • borrow through zero", "subtraction", 6015, 3489, "−", "sub-zero"),
  worked("multiply-carry", "Multiplication • carry step by step", "multiplication", 324, 6, "×", "multiply-carry"),
  worked("multiply-zero", "Multiplication • zero in the number", "multiplication", 208, 7, "×", "multiply-zero"),
  worked("multiply-two-digit", "Multiplication • partial products", "multiplication", 34, 27, "×", "multiply-two"),
  make("lattice", "Multiplication • lattice method", "multiplication", "lattice", { a: 34, b: 27, showSteps: true, instructions: "Write tens above the diagonal and ones below. Add diagonals from right to left." }, [4, 5], "lattice"),
  ...([
    ["long-division-exact", "Long division • no remainder", 84, 4, "divide-exact"],
    ["long-division-remainder", "Long division • with remainder", 53, 6, "divide-remainder"],
    ["long-division-zero", "Long division • zero in the quotient", 808, 8, "divide-zero"],
  ] as const).map(([id, name, a, b, caseKind]) => make(id, name, "division", "worked", { a, b, operation: "÷", showSteps: true, instructions: "Divide → multiply → subtract → bring down → repeat." }, [3, 4, 5], caseKind)),
  make("division-parts", "The parts of a division sum", "division", "division-parts", { a: 17, b: 5, labels: ["Dividend", "Divisor", "Quotient", "Remainder"], descriptions: divisionDescriptions, instructions: "Read each part of the division. Then check your answer." }, [2, 3, 4, 5]),
  make("division-check", "Check your division", "division", "division-check", { a: 17, b: 5, formulaLabel: "Dividend = Divisor × Quotient + Remainder", reminder: "The remainder is always smaller than the divisor." }, [3, 4, 5]),
  make("repeated-subtraction", "Division as repeated subtraction", "division", "repeated", { a: 12, b: 3, instructions: "Equal colours show equal groups. Subtract one group at a time." }, [2, 3]),
  make("addition-warmup", "Addition • mental warm-up", "addition", "warmup", { columns: 2, questions: [q(30, 40, "+"), q(200, 300, "+"), q(600, 70, "+"), q(4000, 5000, "+")], instructions: "Add mentally. Write each total in its box." }, [1, 2, 3, 4, 5]),
  make("addition-practice", "Addition • place-value practice", "addition", "practice", { columns: 2, showGrid: true, questions: [q(4276, 3158, "+", "Regroup the ones"), q(5089, 2734, "+", "Regroup more than once"), q(1695, 7286, "+", "Thousands"), q(6371, 2948, "+", "Check your total")], instructions: "Align the digits. Show your carries and find the sum." }, [3, 4, 5], "add-carry"),
  make("subtraction-practice", "Subtraction • mixed borrowing practice", "subtraction", "practice", { columns: 2, showGrid: true, questions: [q(472, 235, "−", "Borrowing"), q(630, 486, "−", "Borrow through zero"), q(1208, 695, "−", "Different lengths"), q(4036, 2507, "−", "Borrow through zero")], instructions: "Show regrouping above the grid. Subtract from right to left." }, [3, 4, 5], "sub-borrow"),
  make("multiplication-practice", "Multiplication • written practice", "multiplication", "practice", { columns: 2, showGrid: true, questions: [q(437, 6, "×"), q(208, 7, "×", "A zero in the number"), q(563, 4, "×"), q(729, 5, "×")], instructions: "Multiply each place. Carry when needed." }, [3, 4, 5], "multiply-carry"),
  make("division-practice", "Division • exact and remainder practice", "division", "practice", { columns: 2, answerSpace: 48, questions: [q(72, 6, "÷", "No remainder"), q(96, 8, "÷", "No remainder"), q(37, 5, "÷", "With remainder"), q(68, 7, "÷", "With remainder")], instructions: "Find the quotient and remainder. Use R for a remainder." }, [3, 4, 5]),
  make("mixed-operations", "Mixed operations • choose the order", "operations", "mixed", { columns: 2, questions: [{ expression: "625 + 378" }, { expression: "904 − 268" }, { expression: "36 × 7" }, { expression: "864 ÷ 8" }, { expression: "472 + 156 − 93" }, { expression: "9 × 8 + 47" }, { expression: "600 ÷ 5 + 28" }, { expression: "1200 − 4 × 6" }], instructions: "Calculate × and ÷ before + and −. Parentheses come first." }, [4, 5]),
  make("missing-addend", "Challenge • find the missing addend", "addition", "missing", { a: 3785, b: 2215, operation: "+", challenge: "number", instructions: "Use the total to find the missing number." }, [2, 3, 4, 5], "add-carry"),
  make("missing-digit", "Challenge • find the missing digit", "subtraction", "missing", { a: 4916, b: 1938, operation: "−", challenge: "digit", missingPlace: 1, instructions: "Make the subtraction correct. The box stands for one digit." }, [3, 4, 5], "sub-borrow"),
  ...([
    ["addition", "+", 346, 287, "A school has {{a}} pencils. The teacher buys {{b}} more pencils. How many pencils are there altogether?", "pencils"],
    ["subtraction", "−", 6432, 2785, "A school had {{a}} pencils. Students used {{b}} pencils. How many pencils are left?", "pencils"],
    ["multiplication", "×", 24, 9, "There are {{b}} packs of stickers. Each pack has {{a}} stickers. How many stickers are there altogether?", "stickers"],
    ["division", "÷", 23, 6, "There are {{a}} pencils. Put {{b}} pencils in each group. How many full groups can you make, and how many pencils are left?", "groups (R = pencils left)"],
  ] as const).map(([category, operation, a, b, story, unit]) => make(`word-${category}`, `Word problem • ${category}`, "word-problems", "word", { a, b, operation, story, unit, workingLabel: "Working", answerLabel: "Answer", answerSpace: 48, instructions: "Read → choose an operation → show your working → check." }, [2, 3, 4, 5])),
  make("operation-steps", "Choose the correct operation", "operations", "steps", { items: ["Addition (+): find the total or how many altogether.", "Subtraction (−): find what is left or the difference.", "Multiplication (×): find the total in equal groups.", "Division (÷): share equally or find how many groups."] }, [1, 2, 3, 4, 5]),
  make("long-division-steps", "Long division • five steps", "division", "steps", { items: ["Divide: find how many times the divisor fits.", "Multiply: multiply the quotient digit by the divisor.", "Subtract: find what is left from this part.", "Bring down: bring down the next dividend digit.", "Repeat: continue until there are no digits left."] }, [3, 4, 5]),
  make("answer-checklist", "Think about it • check your answer", "operations", "checklist", { items: ["Did I choose the correct operation?", "Did I align the digits in the correct places?", "Did I check every carry or regrouping step?", "Does my answer make sense?", "Can I check using the inverse operation?"] }, [1, 2, 3, 4, 5]),
  ...([1, 2, 3, 4, 5] as const).map(grade => make(`class-${grade}-arithmetic`, `Class ${grade} • four-operation practice`, "operations", "practice", { columns: 2, questions: grade === 1 ? [q(5, 3, "+", "Add"), q(9, 4, "−", "Take away"), q(2, 3, "×", "3 groups of 2"), q(8, 2, "÷", "Share into groups of 2")] : grade === 2 ? [q(28, 17, "+"), q(52, 26, "−"), q(4, 5, "×"), q(20, 4, "÷")] : grade === 3 ? [q(346, 287, "+"), q(630, 486, "−"), q(24, 6, "×"), q(84, 4, "÷")] : grade === 4 ? [q(3648, 2759, "+"), q(5246, 1893, "−"), q(324, 6, "×"), q(936, 6, "÷")] : [q(36728, 15496, "+"), q(73895, 54632, "−"), q(34, 27, "×"), q(728, 8, "÷")], instructions: grade === 1 ? "Count on, take away, make equal groups and share." : "Solve each question. Check using another method." }, [grade])),
];

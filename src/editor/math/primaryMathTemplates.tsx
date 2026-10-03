import React from "react";
import type { MathTemplate, MathRendererProps, MathGrade, MathTopic } from "./types";
import { MATH_TOKENS } from "./tokens";

const { ink, muted, line, paper, wash } = MATH_TOKENS.print;
const clamp = (n: unknown, min: number, max: number, fallback: number) => Math.max(min, Math.min(max, Number.isFinite(Number(n)) ? Number(n) : fallback));
const label = (text: React.ReactNode, x: number, y: number, size = 12, fill = ink, anchor: "start" | "middle" | "end" = "start", bold = false) => <text x={x} y={y} fontSize={size} fill={fill} textAnchor={anchor} fontWeight={bold ? 700 : 500} fontFamily="Inter, sans-serif">{text}</text>;

export const PrimaryMathRenderer: React.FC<MathRendererProps> = ({ data: d, mode, styleVariant, width, height }) => {
  const clean = styleVariant === "clean";
  const accent = clean ? ink : styleVariant === "visual" ? MATH_TOKENS.topics.geometry.main : MATH_TOKENS.primary.indigoAccent;
  const tint = clean ? wash : styleVariant === "visual" ? MATH_TOKENS.topics.geometry.tint : MATH_TOKENS.primary.indigoLight;
  const student = mode === "student";
  const w = width, h = height;
  const body: React.ReactNode[] = [];
  const answer = (value: React.ReactNode) => student ? "_____" : value;
  const box = (x: number, y: number, bw: number, bh: number, fill = tint, radius = 8) => <rect x={x} y={y} width={bw} height={bh} rx={radius} fill={fill} stroke={line} strokeWidth={.8} />;
  const kind = d.kind;
  const footerY = h - 16;
  let footer: React.ReactNode = d.instruction || "Explain how you know.";

  if (kind === "ten-frame" || kind === "twenty-frame") {
    const frames = kind === "twenty-frame" ? 2 : 1;
    const count = Math.round(clamp(d.count, 0, frames * 10, 7));
    const cell = Math.min(42, (w - 48) / (frames === 2 ? 11 : 5));
    for (let f = 0; f < frames; f++) {
      const left = frames === 2 ? 22 + f * (cell * 5 + 18) : (w - cell * 5) / 2;
      for (let i = 0; i < 10; i++) {
        const x = left + i % 5 * cell, y = 66 + Math.floor(i / 5) * cell;
        body.push(box(x, y, cell, cell, paper, 0));
        if (i + f * 10 < count) body.push(<circle cx={x + cell / 2} cy={y + cell / 2} r={cell * .31} fill={accent} />);
      }
    }
    body.push(label(`${d.countLabel || "How many?"} ${answer(count)}`, w / 2, h - 42, 16, accent, "middle", true));
    footer = `${d.instruction} ${answer(`${frames * 10} − ${count} = ${frames * 10 - count}`)}`;
  } else if (kind === "count-match") {
    const counts: number[] = (Array.isArray(d.counts) ? d.counts : [3, 5, 8]).slice(0, 4).map((n: unknown) => Math.round(clamp(n, 1, 10, 3)));
    counts.forEach((n, row) => {
      const y = 62 + row * (h - 99) / counts.length;
      body.push(box(18, y, w - 36, Math.min(32, (h - 105) / counts.length), paper));
      for (let i = 0; i < n; i++) body.push(<circle cx={34 + i * 23} cy={y + 16} r={6} fill={accent} />);
      body.push(label(answer(n), w - 40, y + 21, 16, accent, "end", true));
    });
  } else if (kind === "hundred-chart") {
    const start = Math.round(clamp(d.start, 0, 900, 1));
    const cw = (w - 40) / 10, ch = (h - 99) / 10;
    const every = Math.round(clamp(d.highlightEvery, 1, 20, 5));
    for (let i = 0; i < 100; i++) {
      const n = start + i, x = 20 + i % 10 * cw, y = 63 + Math.floor(i / 10) * ch;
      body.push(box(x, y, cw, ch, n % every === 0 ? tint : paper, 0));
      body.push(label(student && Array.isArray(d.missing) && d.missing.includes(n) ? "?" : n, x + cw / 2, y + ch / 2 + 4, 10, n % every === 0 ? accent : ink, "middle", n % every === 0));
    }
  } else if (kind === "doubles") {
    const n = Math.round(clamp(d.number, 1, 12, 6)), near = Boolean(d.nearDouble), second = n + (near ? 1 : 0);
    [n, second].forEach((count, group) => {
      const x = 24 + group * (w / 2 - 12);
      body.push(box(x, 68, w / 2 - 36, 82, paper));
      for (let i = 0; i < count; i++) body.push(<circle cx={x + 20 + i % 4 * 27} cy={87 + Math.floor(i / 4) * 23} r={7} fill={accent} />);
    });
    body.push(label(`${n} + ${second} = ${answer(n + second)}`, w / 2, 184, 23, accent, "middle", true));
    footer = near ? `Double ${n}, then add 1.` : "Two equal groups make a double.";
  } else if (kind === "times-table") {
    const factor = Math.round(clamp(d.factor, 1, 20, 4));
    const count = Math.round(clamp(d.count, 4, 12, 10));
    const rowH = (h - 95) / Math.ceil(count / 2);
    for (let i = 0; i < count; i++) {
      const x = 20 + (i % 2) * (w - 40) / 2, y = 66 + Math.floor(i / 2) * rowH;
      body.push(box(x, y, (w - 48) / 2, rowH - 6, i % 2 ? paper : tint));
      body.push(label(`${factor} × ${i + 1} = ${answer(factor * (i + 1))}`, x + 14, y + rowH / 2 + 2, 14, accent, "start", true));
    }
  } else if (kind === "rounding") {
    const n = Math.round(clamp(d.number, 1, 999999, 347)), interval = Math.round(clamp(d.interval, 1, 10000, 10));
    const lo = Math.floor(n / interval) * interval, hi = lo + interval;
    const y = 127, left = 36, right = w - 36;
    body.push(<line x1={left} x2={right} y1={y} y2={y} stroke={accent} strokeWidth={2} />);
    [lo, lo + interval / 2, hi].forEach((value, i) => {
      const x = left + i * (right - left) / 2;
      body.push(<line x1={x} x2={x} y1={y - 8} y2={y + 8} stroke={accent} strokeWidth={2} />);
      body.push(label(value, x, y + 28, 13, ink, "middle"));
    });
    const nx = left + (n - lo) / interval * (right - left);
    body.push(<circle cx={nx} cy={y} r={5} fill={MATH_TOKENS.topics.measurement.main} />);
    body.push(label(n, nx, y - 17, 19, accent, "middle", true));
    body.push(label(`Nearest ${interval}: ${answer(Math.round(n / interval) * interval)}`, w / 2, 194, 17, accent, "middle", true));
  } else if (kind === "fraction-set") {
    const total = Math.round(clamp(d.total, 1, 30, 12)), denominator = Math.round(clamp(d.denominator, 1, 12, 3));
    const numerator = Math.round(clamp(d.numerator, 0, denominator, 1));
    const selected = total * numerator / denominator;
    const wholeItems = Number.isInteger(selected);
    for (let i = 0; i < total; i++) body.push(<circle cx={35 + i % 10 * (w - 70) / 9} cy={83 + Math.floor(i / 10) * 30} r={9} fill={wholeItems && i < selected ? accent : paper} stroke={accent} strokeWidth={1.2} />);
    if (!wholeItems) footer = "Choose a total divisible by the denominator for equal whole groups.";
    body.push(label(`${numerator}/${denominator} of ${total} = ${answer(Number(selected.toFixed(3)))}`, w / 2, h - 43, 20, accent, "middle", true));
  } else if (kind === "fraction-compare") {
    const fractions = [[Math.round(clamp(d.numeratorA, 0, 12, 2)), Math.round(clamp(d.denominatorA, 1, 12, 3))], [Math.round(clamp(d.numeratorB, 0, 12, 3)), Math.round(clamp(d.denominatorB, 1, 12, 4))]];
    fractions.forEach(([n, den], row) => {
      const bw = w - 124, y = 78 + row * 55, sw = bw / den;
      body.push(label(`${n}/${den}`, 22, y + 20, 19, accent, "start", true));
      for (let i = 0; i < den; i++) body.push(box(86 + i * sw, y, sw, 29, i < Math.min(n, den) ? accent : paper, 0));
    });
    const [a, b] = fractions, compare = a[0] * b[1] - b[0] * a[1];
    body.push(label(`${a[0]}/${a[1]} ${answer(compare === 0 ? "=" : compare > 0 ? ">" : "<")} ${b[0]}/${b[1]}`, w / 2, h - 44, 21, accent, "middle", true));
  } else if (kind === "perimeter" || kind === "area-grid") {
    const length = Math.round(clamp(d.length, 1, 12, 6)), breadth = Math.round(clamp(d.breadth, 1, 10, 4));
    const cell = Math.min((w - 118) / length, (h - 162) / breadth), rw = cell * length, rh = cell * breadth, x = (w - rw) / 2, y = 84;
    body.push(box(x, y, rw, rh, tint, 0));
    if (kind === "area-grid") {
      for (let i = 1; i < length; i++) body.push(<line x1={x + i * cell} x2={x + i * cell} y1={y} y2={y + rh} stroke={line} />);
      for (let i = 1; i < breadth; i++) body.push(<line x1={x} x2={x + rw} y1={y + i * cell} y2={y + i * cell} stroke={line} />);
    }
    body.push(label(`${length} ${d.unit}`, w / 2, y - 10, 13, accent, "middle", true));
    body.push(label(`${breadth} ${d.unit}`, x + rw + 10, y + rh / 2 + 4, 12, accent));
    body.push(label(kind === "perimeter" ? `P = 2 × (${length} + ${breadth}) = ${answer(2 * (length + breadth))} ${d.unit}` : `A = ${length} × ${breadth} = ${answer(length * breadth)} ${d.unit}²`, w / 2, h - 43, 16, accent, "middle", true));
  } else if (kind === "unit-conversion") {
    const value = Number(d.value) || 0, factor = clamp(d.factor, .001, 100000, 1000), result = d.direction === "divide" ? value / factor : value * factor;
    body.push(box(22, 78, w - 44, 70, paper));
    body.push(label(`${value} ${d.fromUnit}`, w * .25, 120, 23, accent, "middle", true));
    body.push(label("→", w / 2, 120, 24, muted, "middle"));
    body.push(label(`${answer(Number(result.toFixed(6)))} ${d.toUnit}`, w * .74, 120, 23, accent, "middle", true));
    footer = `${d.direction === "divide" ? "Divide" : "Multiply"} by ${factor}. ${d.instruction}`;
  } else if (kind === "elapsed-time") {
    const start = Math.round(clamp(d.startMinutes, 0, 1439, 555)), duration = Math.round(clamp(d.duration, 1, 720, 95));
    const time = (minutes: number) => `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    const left = 44, right = w - 44, y = 128;
    body.push(<line x1={left} x2={right} y1={y} y2={y} stroke={accent} strokeWidth={3} />);
    [left, right].forEach(x => body.push(<circle cx={x} cy={y} r={6} fill={accent} />));
    body.push(label(time(start), left, y + 30, 19, accent, "middle", true));
    body.push(label(answer(time(start + duration)), right, y + 30, 19, accent, "middle", true));
    body.push(label(`+ ${duration} minutes`, w / 2, y - 18, 17, accent, "middle", true));
    footer = `${d.instruction} ${start + duration >= 1440 ? "The journey crosses midnight." : ""}`;
  } else if (kind === "factors") {
    const n = Math.round(clamp(d.number, 1, 100, 24));
    const pairs: number[][] = []; for (let i = 1; i <= Math.sqrt(n); i++) if (n % i === 0) pairs.push([i, n / i]);
    pairs.forEach(([a, b], i) => {
      const y = 66 + i * Math.min(33, (h - 109) / pairs.length);
      body.push(box(22, y, w - 44, 27, i % 2 ? paper : tint));
      body.push(label(`${a} × ${answer(b)} = ${n}`, w / 2, y + 18, 15, accent, "middle", true));
    });
    footer = `${d.instruction} ${answer([...new Set(pairs.flat())].sort((a, b) => a - b).join(", "))}`;
  } else if (kind === "coordinates") {
    const size = Math.round(clamp(d.gridSize, 2, 10, 5)), px = Math.round(clamp(d.pointX, 0, size, 3)), py = Math.round(clamp(d.pointY, 0, size, 4));
    const cell = Math.min((w - 105) / size, (h - 155) / size), left = (w - size * cell) / 2, top = 69, bottom = top + size * cell;
    for (let i = 0; i <= size; i++) {
      body.push(<line x1={left + i * cell} x2={left + i * cell} y1={top} y2={bottom} stroke={line} />);
      body.push(<line x1={left} x2={left + size * cell} y1={top + i * cell} y2={top + i * cell} stroke={line} />);
      body.push(label(i, left + i * cell, bottom + 15, 10, muted, "middle"));
      if (i > 0) body.push(label(i, left - 12, bottom - i * cell + 4, 10, muted, "middle"));
    }
    body.push(<circle cx={left + px * cell} cy={bottom - py * cell} r={5} fill={accent} />);
    body.push(label(`${d.pointLabel}: ${answer(`(${px}, ${py})`)}`, w / 2, h - 36, 16, accent, "middle", true));
  } else if (kind === "daily-practice") {
    const questions = (Array.isArray(d.questions) ? d.questions : []).slice(0, 8);
    questions.forEach((q: { prompt: string; answer: string }, i: number) => {
      const y = 67 + i * (h - 103) / questions.length;
      body.push(box(18, y, w - 36, (h - 112) / questions.length, i % 2 ? paper : tint));
      body.push(label(`${i + 1}. ${q.prompt}`, 30, y + 21, 12, ink));
      body.push(label(answer(q.answer), w - 32, y + 21, 13, accent, "end", true));
    });
  }

  return <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="primary-math-template" aria-label={String(d.title)}>
    <rect x={.6} y={.6} width={w - 1.2} height={h - 1.2} rx={14} fill={paper} stroke={line} strokeWidth={1.2} />
    <rect x={16} y={18} width={4} height={27} rx={2} fill={accent} />
    {label(d.title, 30, 29, 16, accent, "start", true)}
    {label(d.subtitle, 30, 46, 9, muted)}
    <line x1={18} y1={56} x2={w - 18} y2={56} stroke={line} strokeWidth={.7} />
    {body.map((node, i) => <React.Fragment key={i}>{node}</React.Fragment>)}
    {label(footer, w / 2, footerY, 9, muted, "middle")}
  </svg>;
};

function template(id: string, name: string, category: MathTopic, grades: MathGrade[], kind: string, data: Record<string, unknown>, height = 220): MathTemplate {
  return { id: `math-${id}`, name, category, grades, type: kind === "daily-practice" ? "practice" : "visual-model",
    subcategory: "Primary Essentials", tags: ["primary essentials", kind, name.toLowerCase(), ...grades.map(g => `class ${g}`)],
    defaultWidth: 380, defaultHeight: height, styleVariants: ["clean", "color-coded", "visual"], renderer: PrimaryMathRenderer,
    defaultData: { kind, title: name, subtitle: `CLASS ${grades.join(" / ")} · THINK, DRAW & EXPLAIN`, instruction: "Explain your thinking.", ...data },
    configFields: Object.entries(data).filter(([, v]) => typeof v === "number").map(([key, value]) => {
      const bounds: Record<string, [number, number]> = { count: [kind === "times-table" ? 4 : 0, kind === "twenty-frame" ? 20 : kind === "times-table" ? 12 : 10],
        start: [0, 900], highlightEvery: [1, 20], factor: [1, kind === "times-table" ? 20 : 100000], interval: [1, 10000],
        total: [1, 30], numerator: [0, 12], denominator: [1, 12], numeratorA: [0, 12], denominatorA: [1, 12], numeratorB: [0, 12], denominatorB: [1, 12],
        length: [1, 12], breadth: [1, 10], startMinutes: [0, 1439], duration: [1, 720], gridSize: [2, 10], pointX: [0, 10], pointY: [0, 10],
        number: [1, kind === "doubles" ? 11 : kind === "factors" ? 100 : 999999], value: [0, 999999] };
      const [min, max] = bounds[key] || [0, 10000];
      return { key, label: key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, c => c.toUpperCase()), type: "number", defaultValue: value, min, max, step: kind === "unit-conversion" ? .001 : 1 };
    }),
  };
}

export const PRIMARY_MATH_TEMPLATES: MathTemplate[] = [
  template("ten-frame", "Ten-frame counting", "numbers", [1], "ten-frame", { count: 7, countLabel: "How many counters?", instruction: "How many more make 10?" }),
  template("twenty-frame", "Twenty-frame number builder", "numbers", [1, 2], "twenty-frame", { count: 14, countLabel: "Count tens and ones:", instruction: "How many more make 20?" }),
  template("count-match", "Count and write", "numbers", [1], "count-match", { counts: [3, 5, 8], instruction: "Count each group. Write its numeral." }),
  template("hundred-chart", "Hundred-chart explorer", "numbers", [1, 2, 3], "hundred-chart", { start: 1, highlightEvery: 5, missing: [12, 24, 36, 48, 60, 72, 84, 96], instruction: "Find patterns. Fill the missing numbers." }, 390),
  template("doubles", "Doubles and near doubles", "addition", [1, 2], "doubles", { number: 6, nearDouble: true }, 235),
  template("times-table", "Multiplication table builder", "multiplication", [2, 3, 4], "times-table", { factor: 4, count: 10, instruction: "Use equal groups to explain each fact." }, 285),
  template("rounding-number-line", "Rounding on a number line", "place-value", [3, 4, 5], "rounding", { number: 347, interval: 10, instruction: "Find the nearer endpoint. Halfway rounds up." }, 235),
  template("fraction-of-set", "Fraction of a collection", "fractions", [3, 4, 5], "fraction-set", { total: 12, numerator: 1, denominator: 3, instruction: "Make equal groups. Count the shaded share." }, 245),
  template("fraction-compare-bars", "Compare fractions visually", "fractions", [4, 5], "fraction-compare", { numeratorA: 2, denominatorA: 3, numeratorB: 3, denominatorB: 4, instruction: "Both bars represent the same whole." }, 240),
  template("perimeter-lab", "Perimeter lab", "measurement", [3, 4, 5], "perimeter", { length: 6, breadth: 4, unit: "cm", instruction: "Add all four sides to check your answer." }, 270),
  template("area-grid-lab", "Area with square units", "measurement", [3, 4, 5], "area-grid", { length: 6, breadth: 4, unit: "cm", instruction: "Count squares, then multiply rows by columns." }, 270),
  template("unit-conversion-lab", "Metric conversion bridge", "measurement", [3, 4, 5], "unit-conversion", { value: 3, factor: 1000, fromUnit: "km", toUnit: "m", direction: "multiply", instruction: "Check the unit in your answer." }),
  template("elapsed-time-journey", "Elapsed-time journey", "time", [2, 3, 4, 5], "elapsed-time", { startMinutes: 555, duration: 95, instruction: "Find the finishing time. Times use the 24-hour clock." }),
  template("factor-pairs", "Factor-pair finder", "multiplication", [4, 5], "factors", { number: 24, instruction: "List all the factors:" }, 255),
  template("coordinate-explorer", "Coordinate-grid explorer", "geometry", [5], "coordinates", { gridSize: 5, pointX: 3, pointY: 4, pointLabel: "Point A", instruction: "Move across first, then up: (x, y)." }, 300),
  ...([1, 2, 3, 4, 5] as MathGrade[]).map(grade => {
    const questions = {
      1: [{ prompt: "4 + 3 =", answer: "7" }, { prompt: "9 − 2 =", answer: "7" }, { prompt: "One more than 15:", answer: "16" }, { prompt: "Complete: 2, 4, 6, …", answer: "8" }],
      2: [{ prompt: "36 + 27 =", answer: "63" }, { prompt: "54 − 18 =", answer: "36" }, { prompt: "5 × 4 =", answer: "20" }, { prompt: "Half of 18:", answer: "9" }],
      3: [{ prompt: "348 + 176 =", answer: "524" }, { prompt: "72 ÷ 8 =", answer: "9" }, { prompt: "One quarter of 20:", answer: "5" }, { prompt: "3 m = … cm", answer: "300" }],
      4: [{ prompt: "3,475 rounded to 100:", answer: "3,500" }, { prompt: "36 × 12 =", answer: "432" }, { prompt: "2/8 in simplest form:", answer: "1/4" }, { prompt: "Area: 8 cm × 5 cm", answer: "40 cm²" }],
      5: [{ prompt: "4.75 + 2.6 =", answer: "7.35" }, { prompt: "3/4 − 1/4 =", answer: "1/2" }, { prompt: "25% of 80:", answer: "20" }, { prompt: "LCM of 6 and 8:", answer: "24" }],
    }[grade];
    return template(`daily-practice-${grade}`, `Class ${grade} · Daily maths practice`, "assessment", [grade], "daily-practice", { questions, instruction: "Show your working. Check with a partner." }, 255);
  }),
];

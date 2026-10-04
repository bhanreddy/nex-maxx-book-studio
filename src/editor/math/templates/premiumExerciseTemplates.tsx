import React from "react";
import type { MathTemplate, MathRendererProps, MathConfigField } from "../types";
import { worksheetLines, worksheetNumber as n, worksheetString as s, worksheetColors, worksheetNumberLabel, WORKSHEET_DESIGN_DEFAULTS, WORKSHEET_DESIGN_FIELDS, worksheetResponseLayout } from "../worksheetDesign";

export type ExerciseKind = "qa" | "match" | "blanks" | "true-false" | "odd" | "choice" | "sequence" | "classify" | "table";
export interface ExerciseQuestion { prompt: string; answer: string; explanation?: string; choices?: string[]; cells?: string[] }
type Data = Record<string, unknown>;
const questionList = (data: Data): ExerciseQuestion[] => Array.isArray(data.questions) ? data.questions.filter(q => q !== null && typeof q === "object") : [];

/** A permutation of canonical pairs: shuffling choices never changes the answer key. */
export function matchingOrder(data: Data): number[] {
  const count = questionList(data).length;
  const order = Array.isArray(data.matchOrder) ? data.matchOrder.map(Number) : [];
  const valid = order.length === count && new Set(order).size === count && order.every(i => Number.isInteger(i) && i >= 0 && i < count);
  return valid ? order : Array.from({ length: count }, (_, i) => (i + 1) % count);
}
export function shuffleMatchingOrder(data: Data, random = Math.random) {
  const current = matchingOrder(data), next = [...current];
  for (let i = next.length - 1; i > 0; i--) { const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1)))); [next[i], next[j]] = [next[j], next[i]]; }
  if (next.length > 1 && next.every((v, i) => v === current[i])) next.push(next.shift()!);
  return { matchOrder: next };
}

interface InlineRun { text: string; x: number; y: number; blank: boolean; width: number }
function blankRuns(prompt: string, answer: string, width: number, size: number, blankWidth: number) {
  const leading = size * 1.45, answers = answer.split('|').map(a => a.trim());
  let x = 0, y = 0, index = 0, lineHeight = leading;
  const runs: InlineRun[] = [];
  for (const token of prompt.split(/(\{\{blank\}\}|\n)/g)) {
    if (token === '\n') { y += lineHeight; x = 0; lineHeight = leading; continue; }
    if (token === '{{blank}}') {
      const bw = Math.min(width, blankWidth), value = answers[index++] || '';
      const lines = worksheetLines(value, bw - 8, size);
      if (x && x + bw > width) { y += lineHeight; x = 0; lineHeight = leading; }
      lines.forEach((text, i) => runs.push({ text, x, y: y + i * leading, blank: true, width: bw }));
      lineHeight = Math.max(lineHeight, lines.length * leading); x += bw;
    } else {
      for (const word of token.match(/\s+|\S+/g) || []) {
        if (/^\s+$/.test(word)) { if (x) x += size * .28; continue; }
        for (const text of worksheetLines(word, width, size)) {
          const tw = Math.min(width, [...text].reduce((w, ch) => w + (/[iljtI.,:!]/.test(ch) ? .28 : /[mwMW]/.test(ch) ? .82 : /[A-Z]/.test(ch) ? .66 : .54), 0) * size);
          if (x && x + tw > width) { y += lineHeight; x = 0; lineHeight = leading; }
          runs.push({ text, x, y, blank: false, width: tw }); x += tw;
        }
      }
    }
  }
  return { runs, height: y + lineHeight };
}

export function premiumExerciseLayout(data: Data, width: number) {
  const kind = s(data.exerciseKind) as ExerciseKind, size = n(data.fontSize, 20, 14, 28), leading = size * 1.45;
  const title = s(data.title).trim() ? worksheetLines(data.title, width - 48, size + 4) : [];
  const instructions = s(data.instructions).trim() ? worksheetLines(data.instructions, width - 48, size - 3) : [];
  const kicker = s(data.sectionLabel).trim() ? worksheetLines(data.sectionLabel, width - 48, 11) : [];
  const titleY = 18 + kicker.length * 16;
  const instructionY = titleY + title.length * (size + 8) + 4;
  let y = instructionY + instructions.length * leading + 12;
  const wordBank = data.showWordBank !== false && Array.isArray(data.wordBank) && data.wordBank.length ? worksheetLines(`Word bank: ${data.wordBank.map(s).join('  ·  ')}`, width - 64, size - 2) : [];
  const bankY = y; y += wordBank.length ? wordBank.length * leading + 22 : 0;
  const bodyWidth = width - 92, gap = n(data.answerGap, WORKSHEET_DESIGN_DEFAULTS.answerGap, 0, 96), rowGap = n(data.questionGap, WORKSHEET_DESIGN_DEFAULTS.questionGap, 12, 96), writingLeading = Math.max(leading, n(data.lineSpacing, WORKSHEET_DESIGN_DEFAULTS.lineSpacing, 20, 56));
  const order = matchingOrder(data), questions = questionList(data);
  const columns = Array.isArray(data.columns) ? data.columns.map(s) : ['Item', 'Answer'];
  const columnGap = n(data.matchingColumnGap, 52, 24, 100), columnWidth = (width - 48 - columnGap) / 2;
  const leftHeading = worksheetLines(data.leftHeading || 'Column A', columnWidth, size - 3), rightHeading = worksheetLines(data.rightHeading || 'Column B', columnWidth, size - 3);
  const columnsY = y;
  if (kind === 'match') y += Math.max(leftHeading.length, rightHeading.length) * leading + 14;
  const cellWidth = (width - 48) / Math.max(2, columns.length);
  const tableHeadHeight = Math.max(1, ...columns.map(c => worksheetLines(c, cellWidth - 16, size - 3).length)) * leading + 16;
  if (kind === 'classify' || kind === 'table') y += tableHeadHeight;
  const tableY = columnsY;
  const rows = questions.map((question, index) => {
    const top = y, answer = worksheetLines(question.answer, bodyWidth - 12, size);
    let prompt = worksheetLines(question.prompt, bodyWidth, size);
    const explanation = s(question.explanation).trim() ? worksheetLines(question.explanation, bodyWidth - 12, size - 2) : [];
    const choices = Array.isArray(question.choices) ? question.choices.map(s) : [];
    const choiceColumns = Math.min(Math.round(n(data.choiceColumns, 2, 1, 2)), Math.max(1, Math.floor((bodyWidth + 12) / 132))), choiceWidth = (bodyWidth - (choiceColumns - 1) * 12) / choiceColumns;
    const tfColumns = bodyWidth >= 180 ? 2 : 1;
    const tfWidth = Math.min(128, (bodyWidth - (tfColumns - 1) * 12) / tfColumns, Math.max(84, ...[data.trueLabel || 'True', data.falseLabel || 'False'].map(value => s(value).length * (size - 3) * .62 + 42)));
    const tfLabels = [s(data.trueLabel || 'True'), s(data.falseLabel || 'False')].map(value => worksheetLines(value, tfWidth - 42, size - 3));
    const tfHeight = Math.max(30, Math.max(...tfLabels.map(v => v.length)) * leading + 4);
    const tfTotalWidth = tfColumns * tfWidth + (tfColumns - 1) * 12;
    const inlinePromptWidth = bodyWidth - tfTotalWidth - 20;
    const inlinePrompt = worksheetLines(question.prompt, inlinePromptWidth, size);
    const tfInline = kind === 'true-false' && data.choicePlacement !== 'below' && tfColumns === 2 && tfLabels.every(lines => lines.length === 1) && inlinePromptWidth >= 160 && inlinePrompt.length <= 2;
    if (tfInline) prompt = inlinePrompt;
    const tfX = tfInline ? width - 26 - tfTotalWidth : 68;
    const choiceHeight = Math.max(1, ...choices.map(c => worksheetLines(c, choiceWidth - 42, size - 2).length)) * leading + 16;
    const promptEnd = top + (prompt.length - 1) * leading + size;
    const choiceTop = tfInline ? top + Math.max(0, ((prompt.length - 1) * leading + size - tfHeight) / 2) : promptEnd + gap + 4;
    const choiceRows = Math.ceil(choices.length / choiceColumns);
    const choiceBottom = choiceTop + choiceRows * choiceHeight + Math.max(0, choiceRows - 1) * 12;
    const responseValue = kind === 'true-false' || kind === 'odd' || kind === 'choice' ? question.explanation : question.answer;
    const response = worksheetResponseLayout(data, responseValue, bodyWidth - 12, size, writingLeading);
    const count = response.count, label = response.label;
    const inline = blankRuns(s(question.prompt), s(question.answer), bodyWidth, size, n(data.blankWidth, 96, 48, 180));
    let responseTop = promptEnd + gap;
    let answerTop = responseTop + response.labelHeight;
    let bottom = responseTop + response.height + rowGap;
    let explanationTop = bottom - rowGap + 6;
    let matchLeft: string[] = [], matchRight: string[] = [];
    let cells: string[][] = [], cellHeight = 0;
    if (kind === 'match') {
      matchLeft = worksheetLines(question.prompt, columnWidth - 46, size);
      matchRight = worksheetLines(questions[order[index]]?.answer, columnWidth - 46, size);
      bottom = top + Math.max(matchLeft.length, matchRight.length, 1) * leading + 24 + rowGap;
    } else if (kind === 'blanks') {
      answerTop = top + inline.height + gap;
      bottom = answerTop + (data.showExplanations ? Math.max(1, explanation.length) * leading : 0) + rowGap;
    } else if (kind === 'true-false') {
      const tfBottom = Math.max(promptEnd, choiceTop + Math.ceil(2 / tfColumns) * tfHeight + (tfColumns === 1 ? 12 : 0));
      responseTop = tfBottom + gap;
      answerTop = responseTop + response.labelHeight;
      bottom = tfBottom + (data.requireCorrection ? gap + response.height : 0) + rowGap;
    } else if (kind === 'choice' || kind === 'odd' || kind === 'sequence') {
      responseTop = choiceBottom + gap;
      answerTop = responseTop + response.labelHeight;
      bottom = choiceBottom + (kind === 'sequence' || data.requireExplanation ? gap + response.height : 0) + rowGap;
    } else if (kind === 'classify' || kind === 'table') {
      const values = kind === 'classify' ? [question.prompt, ...columns.slice(1).map(() => '')] : [question.prompt, ...(Array.isArray(question.cells) ? question.cells : [])];
      const keys = s(question.answer).split('|'); let blankIndex = 0;
      cells = columns.map((_, col) => worksheetLines(s(values[col]).replace(/\{\{blank\}\}/g, () => keys[blankIndex++]?.trim() || ''), cellWidth - 16, size - 2));
      const studentCells = columns.map((_, col) => worksheetLines(s(values[col]).replace(/\{\{blank\}\}/g, '________'), cellWidth - 16, size - 2));
      cellHeight = Math.max(1, ...cells.map(c => c.length), ...studentCells.map(c => c.length)) * leading + gap + 18;
      bottom = top + cellHeight;
    } else if (data.showExplanations && explanation.length) { explanationTop = bottom - rowGap + 6; bottom += explanation.length * leading + 6; }
    y = bottom;
    return { question, top, bottom, prompt, answer: kind === 'qa' || kind === 'sequence' ? response.lines : answer, explanation: kind === 'true-false' || kind === 'odd' || kind === 'choice' ? response.lines : explanation, label, response, responseTop, explanationTop, answerTop, count, choices, choiceColumns, choiceWidth, choiceHeight, choiceTop, tfLabels, tfHeight, tfWidth, tfColumns, tfInline, tfX, inline, matchLeft, matchRight, cells, cellHeight };
  });
  return { kind, size, leading, writingLeading, title, instructions, kicker, titleY, instructionY, bankY, wordBank, bodyWidth, columnGap, columnWidth, leftHeading, rightHeading, columnsY, order, columns, cellWidth, tableY, tableHeadHeight, rows, height: Math.max(48, y - (rows.length && kind !== 'classify' && kind !== 'table' ? rowGap : 0) + 16) };
}

export const PremiumExerciseRenderer: React.FC<MathRendererProps> = ({ data, mode, styleVariant, width, height }) => {
  const l = premiumExerciseLayout(data, width), c = worksheetColors(data, styleVariant), h = Math.max(height, l.height), radius = n(data.cornerRadius, 12, 0, 24);
  const rowGap = n(data.questionGap, WORKSHEET_DESIGN_DEFAULTS.questionGap, 12, 96), panelPadding = Math.min(6, rowGap / 2 - 1);
  const label = (value: string, x: number, y: number, key: string, size = l.size, fill = c.ink, weight = 400, anchor: 'start' | 'middle' | 'end' = 'start') => <text key={key} x={x} y={y} fontSize={size} fill={fill} fontWeight={weight} textAnchor={anchor}>{value}</text>;
  const lines = (values: string[], x: number, y: number, key: string, size = l.size, fill = c.ink, weight = 400, step = l.leading) => values.map((value, i) => label(value, x, y + i * step, `${key}-${i}`, size, fill, weight));
  const rules = (r: typeof l.rows[number], count = r.count) => data.responseStyle !== 'open' && Array.from({ length: count }, (_, i) => <line key={`rule-${i}`} x1={68 + r.response.indent} x2={width - 26} y1={r.answerTop + l.size + i * l.writingLeading + 4} y2={r.answerTop + l.size + i * l.writingLeading + 4} stroke={c.rule} strokeWidth={.8} />);
  const isTable = l.kind === 'table' || l.kind === 'classify';
  return <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox={`0 0 ${width} ${h}`} fontFamily="Inter, sans-serif" aria-label={s(data.title) || 'Premium exercise'}>
    <rect key="paper" x={.5} y={.5} width={width - 1} height={h - 1} rx={16} fill={c.paper} stroke={c.rule} />
    {lines(l.kicker, 24, 23, 'kicker', 11, c.accent, 600)}
    {l.title.map((value, i) => label(value, 24, l.titleY + l.size + 2 + i * (l.size + 8), `title-${i}`, l.size + 4, c.accent, 700))}
    {lines(l.instructions, 24, l.instructionY + l.size - 3, 'instruction', l.size - 3, c.muted)}
    {l.wordBank.length > 0 && <g key="word-bank"><rect key="bank-bg" x={24} y={l.bankY - 2} width={width - 48} height={l.wordBank.length * l.leading + 12} fill={c.tint} rx={radius} />{lines(l.wordBank, 32, l.bankY + l.size, 'bank', l.size - 2, c.accent)}</g>}
    {l.kind === 'match' && <g key="column-titles">{lines(l.leftHeading, 24, l.columnsY + l.size, 'left-title', l.size - 3, c.accent, 600)}{lines(l.rightHeading, 24 + l.columnWidth + l.columnGap, l.columnsY + l.size, 'right-title', l.size - 3, c.accent, 600)}</g>}
    {isTable && <g key="table-header">{l.columns.map((column, col) => <g key={`head-${col}`}><rect key="fill" x={24 + col * l.cellWidth} y={l.tableY} width={l.cellWidth} height={l.tableHeadHeight} fill={c.tint} stroke={c.rule} />{lines(worksheetLines(column, l.cellWidth - 16, l.size - 3), 32 + col * l.cellWidth, l.tableY + l.size + 4, 'head-text', l.size - 3, c.accent, 600)}</g>)}</g>}
    {l.rows.map((r, index) => {
      const show = mode === 'teacher' || data.showExample === true && index === 0;
      const number = worksheetNumberLabel(index, data);
      const answerTextY = r.answerTop + l.size;
      const answerX = 68 + r.response.indent;
      const responseLabel = lines(r.label, 68, r.responseTop + (r.response.inlineLabel ? l.size : r.response.labelSize), 'answer-label', r.response.labelSize, c.muted, 400, r.response.labelLeading);
      const choices = r.choices.map((choice, i) => {
        const x = 68 + i % r.choiceColumns * (r.choiceWidth + 12), y = r.choiceTop + Math.floor(i / r.choiceColumns) * (r.choiceHeight + 12);
        const correct = show && (l.kind === 'odd' || l.kind === 'choice') && choice === r.question.answer;
        return <g key={`choice-${i}`}><rect key="box" x={x} y={y} width={r.choiceWidth} height={r.choiceHeight} rx={radius} fill={correct ? c.tint : c.paper} stroke={correct ? c.accent : c.rule} strokeWidth={correct ? 1.6 : .8} />
          <rect key="marker" x={x + 10} y={y + 12} width={18} height={18} rx={l.kind === 'sequence' ? 3 : 9} fill={correct ? c.accent : c.paper} stroke={correct ? c.accent : c.rule} />
          {l.kind !== 'sequence' && label(String.fromCharCode(97 + i), x + 19, y + 25, 'choice-letter', 12, correct ? c.paper : c.muted, 600, 'middle')}
          {lines(worksheetLines(choice, r.choiceWidth - 42, l.size - 2), x + 36, y + l.size + 7, 'choice-text', l.size - 2)}
        </g>;
      });
      if (isTable) {
        let blankIndex = 0;
        return <g key={`question-${index}`}>{l.columns.map((_, col) => {
          const raw = col === 0 ? r.question.prompt : (r.question.cells || [])[col - 1] || '';
          const values = l.kind === 'table' ? worksheetLines(s(raw).replace(/\{\{blank\}\}/g, () => show ? s(r.question.answer).split('|')[blankIndex++]?.trim() || '' : '________'), l.cellWidth - 16, l.size - 2) : r.cells[col];
          const x = 24 + col * l.cellWidth;
          return <g key={`cell-${col}`}><rect key="cell-box" x={x} y={r.top} width={l.cellWidth} height={r.cellHeight} fill={data.showPanels === false || index % 2 ? c.paper : c.tint} stroke={c.rule} />
            {l.kind === 'classify' && col > 0 ? <g key="classification"><rect key="check" x={x + l.cellWidth / 2 - 9} y={r.top + r.cellHeight / 2 - 9} width={18} height={18} rx={4} fill={show && r.question.answer === l.columns[col] ? c.accent : c.paper} stroke={c.rule} /></g> : lines(values, x + 8, r.top + l.size + 4, 'cell-text', l.size - 2, col === 0 ? c.ink : c.answer)}
          </g>;
        })}</g>;
      }
      if (l.kind === 'match') {
        const rightX = 24 + l.columnWidth + l.columnGap, rowHeight = r.bottom - r.top - n(data.questionGap, WORKSHEET_DESIGN_DEFAULTS.questionGap, 12, 96);
        const dotY = r.top + rowHeight / 2;
        return <g key={`question-${index}`}><rect key="left-card" x={24} y={r.top} width={l.columnWidth} height={rowHeight} rx={radius} fill={data.showPanels === false ? c.paper : c.tint} stroke={c.rule} /><rect key="right-card" x={rightX} y={r.top} width={l.columnWidth} height={rowHeight} rx={radius} fill={c.paper} stroke={c.rule} />
          {data.showNumbering !== false && label(number, 34, r.top + l.size + 6, 'left-number', 14, c.accent, 600)}
          {lines(r.matchLeft, 58, r.top + l.size + 6, 'left-text')}
          {label(worksheetNumberLabel(index, { startNumber: 1, numberingStyle: 'letters' }), rightX + 10, r.top + l.size + 6, 'right-number', 14, c.accent, 600)}
          {lines(r.matchRight, rightX + 34, r.top + l.size + 6, 'right-text')}
          <circle key="left-dot" cx={24 + l.columnWidth} cy={dotY} r={3} fill={c.accent} /><circle key="right-dot" cx={rightX} cy={dotY} r={3} fill={c.accent} />
          {show && (() => { const target = l.rows[l.order.indexOf(index)], targetHeight = target.bottom - target.top - n(data.questionGap, WORKSHEET_DESIGN_DEFAULTS.questionGap, 12, 96); return <line key="solution-link" x1={24 + l.columnWidth + 4} y1={dotY} x2={rightX - 4} y2={target.top + targetHeight / 2} stroke={c.answer} strokeWidth={1.4} />; })()}
        </g>;
      }
      return <g key={`question-${index}`}>
        {data.showPanels !== false && <rect key="panel" x={18} y={r.top - panelPadding} width={width - 36} height={Math.max(12, r.bottom - r.top - rowGap + panelPadding * 2)} rx={radius} fill={index % 2 ? c.paper : c.tint} />}
        {data.showNumbering !== false && label(`${number}.`, 56, r.top + l.size, 'number', l.size - 2, c.accent, 600, 'end')}
        {l.kind === 'blanks' ? r.inline.runs.map((run, i) => <g key={`inline-${i}`}>{run.blank ? <g key="blank"><line key="rule" x1={68 + run.x} x2={68 + run.x + run.width} y1={r.top + run.y + l.size + 4} y2={r.top + run.y + l.size + 4} stroke={c.accent} />{show && label(run.text, 72 + run.x, r.top + run.y + l.size, 'blank-answer', l.size, c.answer, 600)}</g> : label(run.text, 68 + run.x, r.top + run.y + l.size, 'word')}</g>) : lines(r.prompt, 68, r.top + l.size, 'prompt', l.size, c.ink, n(data.questionWeight, 600, 400, 700))}
        {l.kind === 'qa' && <g key="response">{responseLabel}{rules(r)}{show && lines(r.answer, answerX, answerTextY, 'answer', l.size, c.answer, 400, l.writingLeading)}{show && data.showExplanations && lines(r.explanation, 68, r.explanationTop + l.size - 2, 'explanation', l.size - 2, c.muted)}</g>}
        {l.kind === 'blanks' && show && data.showExplanations && lines(r.explanation, 68, r.answerTop + l.size - 2, 'explanation', l.size - 2, c.muted)}
        {l.kind === 'true-false' && <g key="true-false">{r.tfLabels.map((values, i) => {
          const selected = show && s(r.question.answer).toLowerCase() === (i === 0 ? 'true' : 'false'), x = r.tfX + i % r.tfColumns * (r.tfWidth + 12), y = r.choiceTop + Math.floor(i / r.tfColumns) * (r.tfHeight + 12);
          return <g key={`tf-${i}`}><rect key="box" x={x} y={y} width={r.tfWidth} height={r.tfHeight} rx={radius} fill={selected ? c.tint : c.paper} stroke={selected ? c.accent : c.rule} /><circle key="radio" cx={x + 16} cy={y + r.tfHeight / 2} r={6} fill={selected ? c.accent : c.paper} stroke={c.rule} />{lines(values, x + 32, y + (r.tfHeight - (values.length - 1) * l.leading) / 2 + (l.size - 3) * .35, 'tf-label', l.size - 3)}</g>;
        })}{data.requireCorrection && <g key="correction">{responseLabel}{rules(r, Math.max(r.count, r.explanation.length))}{show && lines(r.explanation, answerX, answerTextY, 'correction-text', l.size - 2, c.answer, 400, l.writingLeading)}</g>}</g>}
        {(l.kind === 'odd' || l.kind === 'choice' || l.kind === 'sequence') && <g key="options">{choices}{(data.requireExplanation || l.kind === 'sequence') && <g key="reason">{responseLabel}{rules(r, Math.max(r.count, r.explanation.length))}{show && lines(l.kind === 'sequence' ? r.answer : r.explanation, answerX, answerTextY, 'reason-answer', l.size - 2, c.answer, 400, l.writingLeading)}</g>}</g>}
      </g>;
    })}
  </svg>;
};

const q = (prompt: string, answer: string, explanation = '', choices?: string[]): ExerciseQuestion => ({ prompt, answer, explanation, ...(choices ? { choices } : {}) });
function exercise(id: string, name: string, kind: ExerciseKind, title: string, instructions: string, questions: ExerciseQuestion[], extra: Data = {}): MathTemplate {
  const specific: Data = { ...(['qa', 'blanks'].includes(kind) ? { showExplanations: false } : {}), ...(['choice', 'odd'].includes(kind) ? { requireExplanation: false } : {}), ...(kind === 'true-false' ? { requireCorrection: false } : {}), ...(['choice', 'odd', 'sequence'].includes(kind) ? { choiceColumns: 2 } : {}), ...extra };
  const defaultData = { ...WORKSHEET_DESIGN_DEFAULTS, exerciseKind: kind, title, instructions, sectionLabel: '', paletteId: 'indigo', questions, answerLabel: kind === 'odd' ? 'Explain your choice' : 'Answer', ...specific };
  const fields: MathConfigField[] = [
    { key: 'title', label: 'Exercise title', type: 'text', defaultValue: title }, { key: 'instructions', label: 'Instructions', type: 'text', defaultValue: instructions }, { key: 'sectionLabel', label: 'Section label', type: 'text', defaultValue: defaultData.sectionLabel },
    { key: 'questions', label: kind === 'match' ? 'Matching pairs' : 'Questions & answers', type: 'items', defaultValue: questions }, ...WORKSHEET_DESIGN_FIELDS,
    ...(kind === 'true-false' ? [{ key: 'choicePlacement', label: 'True/False choice position', type: 'select' as const, defaultValue: 'auto', options: [{ label: 'Beside the statement when it fits', value: 'auto' }, { label: 'Below the statement', value: 'below' }] }] : []),
  ];
  const declared = new Set(fields.map(f => f.key));
  Object.entries(specific).filter(([key]) => !declared.has(key)).forEach(([key, value]) => fields.push({ key, label: key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase()), ...(key === 'choiceColumns' ? { min: 1, max: 2 } : key === 'blankWidth' ? { min: 48, max: 180 } : {}), type: Array.isArray(value) ? 'items' : typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'text', defaultValue: value }));
  return { id: `premium-${id}`, name, category: 'assessment', grades: [1, 2, 3, 4, 5], subcategory: 'Premium Exercise Studio', chapterTag: 'Premium Exercise Studio', type: 'practice', tags: ['premium', 'ready made', 'editable', 'question and answer', 'any subject', kind, name.toLowerCase()], defaultData, defaultWidth: 460, defaultHeight: premiumExerciseLayout(defaultData, 460).height, measureHeight: premiumExerciseLayoutHeight, renderer: PremiumExerciseRenderer, configFields: fields, styleVariants: ['clean', 'color-coded', 'visual'], a11yDescription: `${name}. Editable student exercise and teacher solution.` };
}
const premiumExerciseLayoutHeight = (data: Data, width: number) => premiumExerciseLayout(data, width).height;
export const PREMIUM_EXERCISE_TEMPLATES: MathTemplate[] = [
  exercise('question-answer', 'Premium · Question & Answer', 'qa', 'Questions worth thinking about', 'Read, reflect and write your answer.', [q('Why do plants need sunlight?', 'Plants use sunlight to make their food.'), q('What is a noun?', 'A noun names a person, place, animal or thing.'), q('What is evaporation?', 'The change of a liquid into a gas.')]),
  exercise('long-answer', 'Premium · Extended answers', 'qa', 'Explain your thinking', 'Use complete sentences and a clear example.', [q('How can we reduce waste at school?', 'Reuse materials, avoid single-use items and recycle properly.'), q('Why is it useful to estimate before calculating?', 'An estimate helps us check whether the exact answer is reasonable.')], { answerLines: 3, paletteId: 'teal' }),
  exercise('worked-answer', 'Premium · Worked Q&A', 'qa', 'A little working goes a long way', 'Show the method as well as the answer.', [q('A box has 24 pencils. How many pencils are in 6 boxes?', '144 pencils', '24 × 6 = 144.'), q('Find the perimeter of a square with side 7 cm.', '28 cm', '4 × 7 = 28 cm.')], { showExplanations: true }),
  exercise('match-following', 'Premium · Match the following', 'match', 'Make the connection', 'Draw a line to connect each item with its correct match.', [q('Roots', 'Absorb water'), q('Leaves', 'Make food'), q('Stem', 'Supports the plant'), q('Flower', 'Helps reproduction')], { fontSize: 18, leftHeading: 'Plant part', rightHeading: 'What it does', matchOrder: [2, 0, 3, 1], paletteId: 'teal' }),
  exercise('match-maths', 'Premium · Match maths facts', 'match', 'Match each expression', 'Connect each calculation to its answer.', [q('6 × 7', '42'), q('72 ÷ 8', '9'), q('125 + 75', '200'), q('90 − 36', '54')], { fontSize: 18, leftHeading: 'Expression', rightHeading: 'Value', matchOrder: [1, 3, 0, 2] }),
  exercise('fill-blanks', 'Premium · Fill in the blanks', 'blanks', 'Find the missing word', 'Complete each sentence with the correct word.', [q('Plants absorb water through their {{blank}}.', 'roots'), q('The Sun rises in the {{blank}}.', 'east'), q('A triangle has {{blank}} sides.', 'three')], { blankWidth: 96, paletteId: 'forest' }),
  exercise('word-bank-blanks', 'Premium · Blanks with a word bank', 'blanks', 'Choose. Complete. Check.', 'Use a word from the bank to complete each sentence.', [q('Water changes into {{blank}} when it evaporates.', 'water vapour'), q('A {{blank}} is a word that names something.', 'noun'), q('A square has {{blank}} equal sides.', 'four')], { wordBank: ['four', 'noun', 'water vapour'], showWordBank: true, blankWidth: 150, paletteId: 'violet' }),
  exercise('true-false', 'Premium · True or false', 'true-false', 'Fact check', 'Read each statement. Choose True or False.', [q('A square has four equal sides.', 'True'), q('One kilogram equals 100 grams.', 'False'), q('Every even number is divisible by 2.', 'True')], { trueLabel: 'True', falseLabel: 'False', paletteId: 'copper' }),
  exercise('true-false-correct', 'Premium · True, false & correct', 'true-false', 'Spot it. Fix it.', 'Choose True or False. Correct each false statement.', [q('A triangle has four sides.', 'False', 'A triangle has three sides.'), q('Plants need water to grow.', 'True', 'No correction needed.')], { trueLabel: 'True', falseLabel: 'False', requireCorrection: true, answerLabel: 'Correction', answerLines: 1, paletteId: 'rose' }),
  exercise('odd-one-out', 'Premium · Odd one out', 'odd', 'Which one does not belong?', 'Circle the odd item and explain your choice.', [q('Look at the plant parts.', 'Glass', 'Glass is not a plant part.', ['Root', 'Stem', 'Leaf', 'Glass']), q('Look at the numbers.', '7', '7 is odd; the other numbers are even.', ['2', '4', '7', '8'])], { requireExplanation: true, answerLines: 1, paletteId: 'violet' }),
  exercise('odd-word-out', 'Premium · Odd word out', 'odd', 'Find the word that stands apart', 'Choose the odd word in each group.', [q('Which word is not a noun?', 'Quickly', 'Quickly is an adverb.', ['Table', 'River', 'Quickly', 'Teacher']), q('Which word is not a verb?', 'Chair', 'Chair is a noun in this group.', ['Run', 'Jump', 'Read', 'Chair'])], { requireExplanation: false, paletteId: 'rose' }),
  exercise('multiple-choice', 'Premium · Multiple choice', 'choice', 'Choose with confidence', 'Select the correct answer for each question.', [q('Which number is prime?', '11', '', ['9', '11', '15', '21']), q('How many centimetres are in one metre?', '100', '', ['10', '100', '1,000', '1'])], { choiceColumns: 2, paletteId: 'indigo' }),
  exercise('choose-explain', 'Premium · Choose & explain', 'choice', 'An answer and a reason', 'Select the correct answer, then explain why.', [q('Which fraction is equal to 1/2?', '2/4', '2/4 simplifies to 1/2.', ['1/4', '2/4', '3/4', '4/4'])], { requireExplanation: true, answerLabel: 'My reason', answerLines: 2, choiceColumns: 2, paletteId: 'teal' }),
  exercise('sequence', 'Premium · Put in order', 'sequence', 'First. Next. Then. Finally.', 'Number the steps, then write them in the correct order.', [q('Arrange the stages of plant growth.', 'Seed → Seedling → Plant → Flower', '', ['Plant', 'Seed', 'Flower', 'Seedling'])], { answerLines: 2, choiceColumns: 2, paletteId: 'forest' }),
  exercise('classify', 'Premium · Sort & classify', 'classify', 'Sort it out', 'Tick the category that each item belongs to.', [q('Tree', 'Living'), q('Rock', 'Non-living'), q('Butterfly', 'Living'), q('Chair', 'Non-living')], { columns: ['Item', 'Living', 'Non-living'], paletteId: 'teal' }),
  exercise('complete-table', 'Premium · Complete the table', 'table', 'Complete the pattern', 'Fill the missing facts about these shapes.', [{ ...q('Square', '4'), cells: ['4', '{{blank}}'] }, { ...q('Triangle', '3'), cells: ['{{blank}}', '3'] }, { ...q('Rectangle', '4 | 4'), cells: ['{{blank}}', '{{blank}}'] }], { columns: ['Shape', 'Sides', 'Corners'], paletteId: 'copper' }),
  exercise('correct-mistake', 'Premium · Find & fix the mistake', 'qa', 'Be the careful checker', 'Find the error and write the corrected answer.', [q('A learner writes: 48 ÷ 6 = 6.', '48 ÷ 6 = 8.'), q('A learner writes: A rectangle has three corners.', 'A rectangle has four corners.')], { answerLines: 2, paletteId: 'rose' }),
  exercise('one-word', 'Premium · One-word answers', 'qa', 'Say it in a word', 'Write one word or one number for each answer.', [q('What is the opposite of hot?', 'Cold'), q('How many days are in a week?', 'Seven'), q('Which part of a plant absorbs water?', 'Roots')], { answerLines: 1, paletteId: 'violet' }),
  exercise('compare', 'Premium · Compare & contrast', 'qa', 'Find what is alike and different', 'Write one similarity and one difference.', [q('Compare a square and a rectangle.', 'Both have four right angles. A square has four equal sides; a rectangle need not.'), q('Compare evaporation and condensation.', 'Both involve a change of state. Evaporation changes liquid to gas; condensation changes gas to liquid.')], { answerLines: 3, paletteId: 'teal' }),
  exercise('exit-ticket', 'Premium · Reflection & exit ticket', 'qa', 'Before you go…', 'Reflect on your learning in your own words.', [q('One thing I learnt today:', 'Answers will vary.'), q('One question I still have:', 'Answers will vary.'), q('One example I can explain:', 'Answers will vary.')], { answerLines: 2, paletteId: 'forest', sectionLabel: 'REFLECT · MAKE IT YOURS' }),
];

import React from 'react';
import { Shuffle, RotateCcw } from 'lucide-react';
import type { MathTemplate, MathStyleVariant } from './types';
import { MathDataFields } from './MathDataFields';
import { WORKSHEET_PALETTES, WORKSHEET_DESIGN_FIELDS, WORKSHEET_DESIGN_DEFAULTS, WORKSHEET_COMPACT_SPACING, worksheetPalettePatch, nextWorksheetPalette, worksheetColors } from './worksheetDesign';
import { shuffleMatchingOrder } from './templates/premiumExerciseTemplates';

type Data = Record<string, unknown>;
export function WorksheetPalettePicker({ paletteId, onChange }: { paletteId: string; onChange: (id: string) => void }) {
  return <div className="worksheet-palette-picker" role="group" aria-label="Worksheet color palette">
    {WORKSHEET_PALETTES.map(p => <button key={p.id} type="button" className="worksheet-palette" aria-label={`${p.name} palette`} title={p.name} aria-pressed={paletteId === p.id} onClick={() => onChange(p.id)}><span style={{ background: p.main }} /><span className="sr-only">{p.name}</span></button>)}
    <button type="button" className="worksheet-shuffle" onClick={() => onChange(nextWorksheetPalette(paletteId).paletteId)}><Shuffle size={14} />Shuffle colors</button>
  </div>;
}

/** Keep frequently used layout controls visible; advanced styling stays optional. */
export function WorksheetStyleControls({ template, data, variant, onUpdate }: { template: MathTemplate; data: Data; variant: MathStyleVariant; onUpdate: (patch: Data, fitHeight?: boolean) => void }) {
  const colors = worksheetColors(data, variant);
  const effective = { ...WORKSHEET_DESIGN_DEFAULTS, ...template.defaultData, ...data, accentColor: colors.accent, answerColor: colors.answer, inkColor: colors.ink, tintColor: colors.tint, ruleColor: colors.rule, cornerRadius: data.cornerRadius ?? template.defaultData.cornerRadius ?? (template.id.startsWith('premium-') ? 12 : 10) };
  const kind = String(data.exerciseKind || (Array.isArray(data.questions) ? 'qa' : 'math')), plain = data.presentation === 'plain';
  const hasWriting = kind === 'qa' || kind === 'sequence' || Boolean(data.requireExplanation || data.requireCorrection);
  const basicKeys = ['fontSize', 'answerGap', ...(kind === 'table' || kind === 'classify' ? [] : ['questionGap'])];
  const allowed = WORKSHEET_DESIGN_FIELDS.filter(f => f.key !== 'paletteId' && (kind !== 'math' || ['accentColor', 'ruleColor'].includes(f.key)) &&
    (hasWriting || !['lineSpacing', 'answerLines', 'showAnswerLabel', 'answerLabel', 'responseStyle'].includes(f.key)) &&
    (kind === 'match' || f.key !== 'matchingColumnGap') &&
    (!plain || !['showPanels', 'cornerRadius'].includes(f.key)) &&
    (!['match', 'table', 'classify'].includes(kind) || !['showNumbering', 'startNumber', 'numberingStyle', 'questionWeight'].includes(f.key)) &&
    (template.id.startsWith('premium-') || plain || !['showAnswerLabel', 'answerLabel'].includes(f.key)));
  const paletteId = variant === 'clean' ? 'mono' : String(data.paletteId || (plain ? 'mono' : variant === 'visual' ? 'teal' : 'indigo'));
  const pick = (id: string) => onUpdate(worksheetPalettePatch(id));
  return <section className="worksheet-style-controls" aria-label="Exercise design">
    <div className="worksheet-style-heading"><strong>Color & spacing</strong><span>Make it yours</span></div>
    <WorksheetPalettePicker paletteId={paletteId} onChange={pick} />
    <p>Shuffle a coordinated theme. Your questions and answer key stay intact.</p>
    <MathDataFields template={template} data={effective} fields={allowed.filter(f => basicKeys.includes(f.key))} onUpdate={onUpdate} />
    {kind !== 'math' && kind !== 'table' && kind !== 'classify' && <button type="button" className="worksheet-action" onClick={() => onUpdate(WORKSHEET_COMPACT_SPACING, true)}>Compact spacing</button>}
    {kind === 'match' && <button type="button" className="worksheet-action" onClick={() => onUpdate(shuffleMatchingOrder(data))}><Shuffle size={14} />Shuffle matching choices</button>}
    {(kind === 'choice' || kind === 'odd') && <p>Use the exact option text as the answer key. Add your reason in Explanation.</p>}
    {kind === 'true-false' && <p>Use True or False as the answer key, including when you rename the buttons.</p>}
    {kind === 'blanks' && <p>Use {'{{blank}}'} where a word is missing. Separate multiple answers with |.</p>}
    {kind === 'table' && <p>Use {'{{blank}}'} in a missing cell. Separate its answers with |.</p>}
    <details><summary>More layout & color options</summary><MathDataFields template={template} data={effective} fields={allowed.filter(f => !basicKeys.includes(f.key))} onUpdate={onUpdate} />
      <button type="button" className="worksheet-action" onClick={() => onUpdate({ ...Object.fromEntries(allowed.filter(f => !f.key.endsWith('Color')).map(f => [f.key, template.defaultData[f.key] ?? f.defaultValue])), ...worksheetPalettePatch(String(template.defaultData.paletteId || (plain ? 'mono' : 'indigo'))) })}><RotateCcw size={14} />Reset design</button>
    </details>
  </section>;
}

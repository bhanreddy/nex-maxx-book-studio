import React from "react";
import type { MathConfigField, MathTemplate } from "./types";

/** Every data property is available, including older templates with no schema. */
export function editableMathFields(template: MathTemplate, data: Record<string, unknown>): MathConfigField[] {
  const fields = template.propSchema || template.configFields || [];
  const declared = new Set(fields.map(f => f.key));
  const inferred = Object.entries({ ...template.defaultData, ...data }).filter(([key]) => !declared.has(key) && key !== "kind").map(([key, value]): MathConfigField => ({
    key, label: key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/^./, c => c.toUpperCase()),
    type: Array.isArray(value) || value !== null && typeof value === "object" ? "items" : typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "text", defaultValue: template.defaultData[key] ?? value,
  }));
  return [...fields, ...inferred];
}

function ValueEditor({ label, value, sample, onChange }: { label: string; value: unknown; sample?: unknown; onChange: (value: unknown) => void }) {
  if (Array.isArray(value)) return <div className="math-collection space-y-2">
    <div className="flex items-center justify-between"><strong>{label}</strong><small>{value.length} items</small></div>
    {value.map((item, i) => <div key={i} className="math-collection-item space-y-2">
      <div className="flex items-center justify-between"><span>Item {i + 1}</span><button type="button" aria-label={`Remove ${label} item ${i + 1}`} className="math-quiet-button" onClick={() => onChange(value.filter((_, index) => index !== i))}>Remove</button></div>
      <ValueEditor label={`${label} ${i + 1}`} value={item} sample={Array.isArray(sample) ? sample[i] || sample[0] : undefined} onChange={next => onChange(value.map((v, index) => index === i ? next : v))} />
    </div>)}
    <button className="math-quiet-button" type="button" disabled={value.length >= 50} onClick={() => onChange([...value, structuredClone(value[value.length - 1] ?? (Array.isArray(sample) ? sample[0] : undefined) ?? "New item")])}>Add {label.toLowerCase()} item</button>
  </div>;
  if (value !== null && typeof value === "object") return <div className="space-y-2">{Object.entries(value).map(([key, child]) => <ValueEditor key={key} label={`${label} · ${key.replace(/([a-z])([A-Z])/g, "$1 $2")}`} value={child} sample={sample !== null && typeof sample === "object" ? (sample as Record<string, unknown>)[key] : undefined} onChange={next => onChange({ ...value, [key]: next })} />)}</div>;
  if (typeof value === "boolean") return <label className="flex items-center gap-2 min-h-8"><input aria-label={label} type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />{label}</label>;
  if (typeof value === "number") return <label className="math-control"><span>{label}</span><input aria-label={label} type="number" value={value} step="any" onChange={e => { if (e.target.value !== "" && Number.isFinite(Number(e.target.value))) onChange(Number(e.target.value)); }} /></label>;
  return <label className="math-control"><span>{label}</span><textarea aria-label={label} rows={String(value || "").length > 70 ? 3 : 1} value={String(value ?? "")} onChange={e => onChange(e.target.value)} /></label>;
}

export function MathDataFields({ template, data, onUpdate }: { template: MathTemplate; data: Record<string, unknown>; onUpdate: (patch: Record<string, unknown>) => void }) {
  return <div className="math-data-fields space-y-2">{editableMathFields(template, data).map(field => {
    const value = data[field.key] ?? field.defaultValue;
    const change = (next: unknown) => onUpdate({ [field.key]: next, ...(field.key === "options" && Array.isArray(next) ? { correctIndex: Math.max(0, Math.min(Number(data.correctIndex) || 0, next.length - 1)) } : {}) });
    if (field.type === "items" || field.type === "array-numbers") return <ValueEditor key={field.key} label={field.label} value={value} sample={field.defaultValue} onChange={change} />;
    if (field.type === "boolean") return <label key={field.key} className="flex items-center gap-2 min-h-8"><input aria-label={field.label} type="checkbox" checked={Boolean(value)} onChange={e => change(e.target.checked)} />{field.label}</label>;
    if (field.type === "select") return <label key={field.key} className="math-control"><span>{field.label}</span><select aria-label={field.label} value={String(value)} onChange={e => change(field.options?.find(o => String(o.value) === e.target.value)?.value ?? e.target.value)}>{field.options?.map(o => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}</select></label>;
    if (["number", "range"].includes(field.type)) return <label key={field.key} className="math-control"><span>{field.label}</span><input aria-label={field.label} type="number" value={Number(value)} min={field.min} max={field.key === "correctIndex" && Array.isArray(data.options) ? data.options.length - 1 : field.max} step={field.step ?? 1} onChange={e => {
      if (!e.target.value) return;
      const n = Number(e.target.value); if (Number.isFinite(n)) change(Math.max(field.min ?? -Infinity, Math.min(field.key === "correctIndex" && Array.isArray(data.options) ? data.options.length - 1 : field.max ?? Infinity, n)));
    }} /></label>;
    if (field.type === "color") return <label key={field.key} className="math-control"><span>{field.label}</span><input aria-label={field.label} type="color" value={String(value)} onChange={e => change(e.target.value)} /></label>;
    return <label key={field.key} className="math-control"><span>{field.label}</span><textarea aria-label={field.label} rows={String(value).length > 70 ? 3 : 1} value={String(value ?? "")} onChange={e => change(e.target.value)} /></label>;
  })}</div>;
}

import type { SmartBlockInstance } from '../../../domain/educational/blockSchema';
type Content=SmartBlockInstance['semanticContent'];
const roots=new Set(['badgeLabel','unitBadge','qrUrl','numberValue','title','chapterNumber','subtitle','introText','calloutText','passage','quote','prediction','reveal','finalAnswer','hint','difficulty','footnote','items','steps','questions','vocabulary','formula','images','annotations','comparison','grid','materials']);
export function readEducationalField(content:Content,path:string):string {
 if(!roots.has(path.split('.')[0]))return '';
 let value:unknown=content;
 for(const key of path.split('.'))value=value&&typeof value==='object'?(value as Record<string,unknown>)[key]:undefined;
 return Array.isArray(value)?value.join('\n'):typeof value==='string'||typeof value==='number'?String(value):'';
}
/** Semantic edits remain the source of truth, rather than per-line SVG overrides. */
export function editEducationalField(content:Content,path:string,value:string):Partial<Content> {
 const keys=path.split('.');if(!roots.has(keys[0])||keys.some(key=>['__proto__','prototype','constructor'].includes(key)))return {};
 const next=structuredClone(content) as unknown as Record<string,unknown>;
 let target=next;for(const key of keys.slice(0,-1)){if(!target[key]||typeof target[key]!=='object')return {};target=target[key] as Record<string,unknown>;}
 const key=keys[keys.length-1];if(keys[0]==='numberValue'&&!Number.isFinite(Number(value)))return {};
 target[key]=keys[0]==='numberValue'?Number(value):Array.isArray(target[key])?value.split('\n'):value;
 return {[keys[0]]:next[keys[0]]};
}

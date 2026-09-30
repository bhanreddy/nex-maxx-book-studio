'use client';
import { useEffect,useState } from 'react';
interface Presence { editors:Array<{ user_id:string;full_name:string;self:boolean }>;last_editor?:{ full_name:string;updated_at:string } }
export function ChapterPresence({ masterChapterId }:{ masterChapterId?:string }) {
  const [presence,setPresence]=useState<Presence>();
  const [unavailable,setUnavailable]=useState(false);
  useEffect(()=>{
    setPresence(undefined);setUnavailable(false);
    if (!masterChapterId) return;
    let active=true;
    const endpoint=`/api/curriculum/chapters/${masterChapterId}/presence`;
    const heartbeat=async()=>{
      try {
        const response=await fetch(endpoint,{ method:'POST',cache:'no-store' });
        const json=await response.json();
        if (!response.ok) throw new Error('Presence unavailable');
        if (active) { setPresence(json.data);setUnavailable(false); }
      } catch { if (active) setUnavailable(true); }
    };
    void heartbeat();const timer=setInterval(heartbeat,30000);
    return()=>{ active=false;clearInterval(timer);void fetch(`${endpoint}/release`,{ method:'POST',keepalive:true }).catch(()=>{}); };
  },[masterChapterId]);
  if (!masterChapterId) return null;
  const others=presence?.editors.filter(editor=>!editor.self) || [];
  return <div className="curriculum-cloud-status" aria-live="polite">
    {unavailable ? 'Editing presence unavailable. Save conflict protection still applies.' : others.length ? `Also editing: ${others.map(editor=>editor.full_name || 'Another author').join(', ')}` : presence ? 'No other active editors reported.' : 'Checking editing presence…'}
    {presence?.last_editor?.full_name && <div>Last edited by {presence.last_editor.full_name} · {new Date(presence.last_editor.updated_at).toLocaleString()}</div>}
  </div>;
}

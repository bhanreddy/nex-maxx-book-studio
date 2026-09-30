import type { PageElement, ElementTransform } from "../../domain/element/types";
export type ArrangeMode = "left" | "center" | "right" | "top" | "middle" | "bottom" | "horizontal" | "vertical" | "stack" | "row" | "grid";
export interface ArrangeBounds { x: number; y: number; width: number; height: number }

/** Position only: preserve reading size and object dimensions. */
export function arrangeElements(elements: PageElement[], bounds: ArrangeBounds, mode: ArrangeMode, gap = 18, columns = 2): Record<string, ElementTransform> {
  const items = elements.filter(el => !el.locked && !el.hidden && !el.smartBlockData?.isLockedDesign);
  if (!items.length) return {};
  const output = Object.fromEntries(items.map(el => [el.id, {...el.transform}]));
  const spacing = Math.max(0, Number.isFinite(gap) ? gap : 18);
  if (["stack","row","grid"].includes(mode)) {
    const ordered = [...items].sort((a,b)=>a.transform.y-b.transform.y || a.transform.x-b.transform.x);
    const count = mode === "stack" ? 1 : mode === "row" ? items.length : Math.max(1, Math.floor(columns));
    let y = bounds.y;
    for(let i=0;i<ordered.length;i+=count){
      let x=bounds.x, height=0;
      ordered.slice(i,i+count).forEach(el=>{output[el.id].x=x;output[el.id].y=y;x+=el.transform.width+spacing;height=Math.max(height,el.transform.height);});
      y+=height+spacing;
    }
  } else if (mode === "horizontal" || mode === "vertical") {
    const axis = mode === "horizontal" ? "x" : "y", size = mode === "horizontal" ? "width" : "height";
    const sorted = [...items].sort((a,b)=>a.transform[axis]-b.transform[axis]);
    if(sorted.length<3) return {};
    const start=sorted[0].transform[axis], last=sorted[sorted.length-1].transform;
    const free=last[axis]+last[size]-start-sorted.reduce((sum,el)=>sum+el.transform[size],0);
    if(free<0) throw new Error("There is not enough space between the first and last objects. Use a row or stack with a smaller gap.");
    let cursor=start;
    sorted.forEach(el=>{output[el.id][axis]=cursor;cursor+=el.transform[size]+free/(sorted.length-1);});
  } else {
    items.forEach(el=>{
      const t=output[el.id];
      if(mode==="left")t.x=bounds.x;
      if(mode==="center")t.x=bounds.x+(bounds.width-t.width)/2;
      if(mode==="right")t.x=bounds.x+bounds.width-t.width;
      if(mode==="top")t.y=bounds.y;
      if(mode==="middle")t.y=bounds.y+(bounds.height-t.height)/2;
      if(mode==="bottom")t.y=bounds.y+bounds.height-t.height;
    });
  }
  return output;
}

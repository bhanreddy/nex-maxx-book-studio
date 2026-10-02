import type { SceneNode } from '../publicationScene';
type Token={kind:'text'|'fraction'|'power'|'subscript';text:string;denominator?:string};
/** Small primary-school notation grammar. Plain Unicode, fractions and scripts stay vector text. */
export function formulaNodes(expression:string,x:number,y:number,width:number,size:number,color:string,measure:(value:string,size:number)=>number){
 const tokens:Token[]=[],pattern=/\\frac\{([^{}]+)\}\{([^{}]+)\}|([\^_])(?:\{([^{}]+)\}|([\w+-]))/g;
 let last=0,match:RegExpExecArray|null;
 while((match=pattern.exec(expression))){if(match.index>last)tokens.push({kind:'text',text:expression.slice(last,match.index)});tokens.push(match[1]?{kind:'fraction',text:match[1],denominator:match[2]}:{kind:match[3]==='^'?'power':'subscript',text:match[4]||match[5]});last=pattern.lastIndex;}
 if(last<expression.length)tokens.push({kind:'text',text:expression.slice(last)});
 const nodes:SceneNode[]=[],small=Math.max(10,size*.58),fractionSize=size*.7,hasFraction=tokens.some(t=>t.kind==='fraction'),rowHeight=size*(hasFraction?2.2:1.7);
 let cursor=x,row=y;
 const text=(value:string,tx:number,baseline:number,fs:number,w:number)=>nodes.push({kind:'text',x:tx,y:baseline,text:value,size:fs,fill:color,bold:true,font:'serif',wrapWidth:w});
 for(const token of tokens){
  if(token.kind==='text'){
   // Character wrapping retains unusually long expressions at a readable size.
   for(const char of Array.from(token.text)){const cw=measure(char,size);if(cursor+cw>x+width&&cursor>x){cursor=x;row+=rowHeight;}text(char,cursor,row+size*(hasFraction?1.25:1),size,cw);cursor+=cw;}
  }else{
   const fs=token.kind==='fraction'?fractionSize:small,tw=measure(token.text,fs),dw=measure(token.denominator||'',fs),tokenWidth=Math.max(tw,dw)+(token.kind==='fraction'?12:2);
   if(cursor+tokenWidth>x+width&&cursor>x){cursor=x;row+=rowHeight;}
   if(token.kind==='fraction'){text(token.text,cursor+(tokenWidth-tw)/2,row+fractionSize,fractionSize,tw);nodes.push({kind:'line',x:cursor,y:row+size,x2:cursor+tokenWidth,y2:row+size,stroke:color,strokeWidth:1});text(token.denominator!,cursor+(tokenWidth-dw)/2,row+size+fractionSize+3,fractionSize,dw);}
   else text(token.text,cursor,row+size*(hasFraction?1.25:1)+(token.kind==='power'?-size*.45:small*.5),small,tw);
   cursor+=tokenWidth;
  }
 }
 const height=row-y+rowHeight;
 nodes.push({kind:'rect',x,y,w:width,h:height,fill:'transparent',fieldPath:'formula.expression'});
 return {nodes,height,warning:/\\(?!frac\{)/.test(expression)?'Unsupported formula command. Use Unicode notation, \\frac{a}{b}, x^2 or x_{1}; review this expression before printing.':undefined};
}

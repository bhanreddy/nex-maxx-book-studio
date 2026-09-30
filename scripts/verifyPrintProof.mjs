import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
import ts from 'typescript';
const require=createRequire(import.meta.url);
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
const {buildPrintHtml}=require('../src/editor/publishing/publicationPrint.ts');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),output=path.join(root,'output/pdf');fs.mkdirSync(output,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(path.join(root,'public/fonts/manifest.json'),'utf8'));
const fonts=['notosans.ttf','notosanstelugu.ttf','notosansdevanagari.ttf'],names=['Noto Sans','Noto Sans Telugu','Noto Sans Devanagari'];
const css=fonts.map((filename,index)=>{
  const bytes=fs.readFileSync(path.join(root,'public/fonts',filename)),pin=manifest.files.find(f=>f.filename===filename);
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==pin?.sha256)throw new Error(`Font checksum mismatch: ${filename}`);
  return `@font-face{font-family:'${names[index]}';src:url(data:font/ttf;base64,${bytes.toString('base64')});font-weight:100 900;font-style:normal;font-display:block}`;
}).join('');
const samples=[
  ['English','Read, think, and explain.','Place value: 4,582 = 4,000 + 500 + 80 + 2.','A flower grows from a seed. Observe its leaves.'],
  ['తెలుగు','చదవండి, ఆలోచించండి, వివరించండి.','స్థాన విలువ: 4,582 = 4,000 + 500 + 80 + 2.','క్ష త్ర శ్రీ - ఒక విత్తనం నుండి మొక్క పెరుగుతుంది.'],
  ['हिन्दी','पढ़ें, सोचें और समझाएँ।','स्थानीय मान: 4,582 = 4,000 + 500 + 80 + 2.','क्ष त्र ज्ञ श्र - एक बीज से पौधा उगता है।'],
];
const book={title:'NEX MAXX Multilingual Print Proof',dimensions:{widthPt:595.28,heightPt:841.89},bleed:{topPt:9,bottomPt:9,leftPt:9,rightPt:9}};
const pages=samples.map(([language,...lines],index)=>({number:String(index+1),elements:[{element:{id:`proof-${index}`,transform:{x:42,y:60,width:510,height:650,rotation:0,zIndex:1},style:{}},scene:{width:510,height:650,variant:'font-proof',warnings:[],nodes:[{kind:'rect',x:0,y:0,w:510,h:650,radius:12,fill:'#F4F7FD'},
  {kind:'text',x:24,y:48,text:language,size:28,bold:true,fill:'#132C45'},...lines.map((text,i)=>({kind:'text',x:24,y:110+i*64,text,size:17,fill:'#162B3A'})),
  {kind:'text',x:24,y:420,text:'Bundled fonts. Vector text. A4 trim + 9 pt bleed.',size:12,fill:'#465E70'},
  {kind:'text',x:24,y:460,text:'Local export evidence; staging acceptance is still required.',size:12,fill:'#465E70'}]}}]}));
const html=path.join(output,'nexmaxx-multilingual-proof.html'),pdf=path.join(output,'nexmaxx-multilingual-proof.pdf');
fs.writeFileSync(html,buildPrintHtml(book,pages,css,{bleed:true,cropMarks:true}));
const chrome=process.env.NEXMAXX_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',profile=fs.mkdtempSync(path.join(os.tmpdir(),'nexmaxx-print-'));
try{
  const result=spawnSync(chrome,['--headless','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,'--no-pdf-header-footer',`--print-to-pdf=${pdf}`,'--virtual-time-budget=5000',pathToFileURL(html).href],{encoding:'utf8',timeout:30000});
  if(result.status!==0||!fs.existsSync(pdf))throw new Error('Chrome PDF proof failed');
  const report=spawnSync('pdffonts',[pdf],{encoding:'utf8'});if(report.status!==0)throw new Error('pdffonts is required to verify embedded fonts');
  fs.writeFileSync(path.join(output,'embedded-fonts.txt'),report.stdout);
  const rows=report.stdout.trim().split('\n').slice(2);
  if(rows.length<3||rows.some(row=>!/(?:yes\s+yes\s+yes)\s+\d+\s+\d+\s*$/.test(row)))throw new Error('PDF contains an unembedded font or missing Unicode map');
  for(const expected of ['NotoSans-Regular','NotoSansTelugu','NotoSansDevanagari'])if(!report.stdout.includes(expected))throw new Error(`Missing required PDF font ${expected}`);
  const extraction=spawnSync('pdftotext',['-layout',pdf,path.join(output,'extracted-text.txt')],{encoding:'utf8'});if(extraction.status!==0)throw new Error('PDF text extraction failed');
  console.log(JSON.stringify({pdf,fonts:rows.length,fontsEmbedded:true,sourceFontCommit:manifest.commit,sha256:crypto.createHash('sha256').update(fs.readFileSync(pdf)).digest('hex'),scope:'local multilingual export proof; visual review required'}));
}finally{fs.rmSync(profile,{recursive:true,force:true});}

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
const {NextRequest}=require('next/server');
const {GET,POST}=require('../src/app/api/curriculum/[...path]/route.ts');
const checksum='a'.repeat(64);
const path=['assets','4e7fb97c-c9ba-49a3-b157-59bf3b73bfd1','revisions','1','render'];
const request=()=>new NextRequest(`https://studio.example/api/curriculum/${path.join('/')}?checksum=${checksum}`,{headers:{cookie:'nex_platform_access=test-only-token'}});
const context={params:Promise.resolve({path})};
function setApi(t, value) { const previous=process.env.SCHOOLIMS_API_URL; process.env.SCHOOLIMS_API_URL=value; t.after(()=>{if(previous===undefined)delete process.env.SCHOOLIMS_API_URL;else process.env.SCHOOLIMS_API_URL=previous;}); }

test('cloud picture reads require the platform session and writes reject foreign origins',async()=>{
  const denied=await GET(new NextRequest('https://studio.example/api/curriculum/assets'),{params:Promise.resolve({path:['assets']})});
  assert.equal(denied.status,401);
  const cross=await POST(new NextRequest('https://studio.example/api/curriculum/assets/uploads',{method:'POST',headers:{origin:'https://foreign.example'},body:'{}'}),{params:Promise.resolve({path:['assets','uploads']})});
  assert.equal(cross.status,403);
});

test('verified pinned pictures stream on the studio origin for canvas and print export',async t=>{
  setApi(t,'https://central.example/api/v1/');
  const calls=[];
  t.mock.method(globalThis,'fetch',async(url,init)=>{
    calls.push({url:String(url),init});
    if(calls.length===1)return Response.json({success:true,data:{url:'https://account.r2.cloudflarestorage.com/image',checksum}});
    return new Response(new Uint8Array([137,80,78,71]),{headers:{'Content-Type':'image/png'}});
  });
  const response=await GET(request(),context);
  assert.equal(response.status,200); assert.equal(response.headers.get('content-type'),'image/png');
  assert.equal(response.headers.get('location'),null); assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  assert.equal(calls[0].url,`https://central.example/api/v1/curriculum/authoring/assets/${path[1]}/revisions/1/download?checksum=${checksum}`);
  assert.equal(calls[0].init.headers.get('authorization'),'Bearer test-only-token');
  assert.equal(calls[1].init.headers,undefined);
  assert.equal((await response.arrayBuffer()).byteLength,4);
});

test('picture delivery rejects a mismatched revision checksum without fetching the image',async t=>{
  setApi(t,'https://central.example');let calls=0;
  t.mock.method(globalThis,'fetch',async()=>{calls++;return Response.json({success:true,data:{url:'https://account.r2.cloudflarestorage.com/image',checksum:'b'.repeat(64)}});});
  assert.equal((await GET(request(),context)).status,409); assert.equal(calls,1);
});

test('picture delivery rejects an unexpected storage host and active document MIME',async t=>{
  setApi(t,'https://central.example');
  t.mock.method(globalThis,'fetch',async()=>Response.json({success:true,data:{url:'https://foreign.example/image',checksum}}));
  assert.equal((await GET(request(),context)).status,502);
  let calls=0;t.mock.method(globalThis,'fetch',async()=>++calls===1?Response.json({success:true,data:{url:'https://account.r2.cloudflarestorage.com/image',checksum}}):new Response('<script/>',{headers:{'Content-Type':'text/html'}}));
  assert.equal((await GET(request(),context)).status,502);
});

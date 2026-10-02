import { NextRequest, NextResponse } from "next/server";
import { platformApiUrl } from "../../../../editor/persistence/platformApiUrl";

const COOKIE = "nex_platform_access";

async function proxy(request: NextRequest, path: string[]) {
  if (path.some(part => part==='.' || part==='..' || /[\/\\\u0000-\u001f]/.test(part))) {
    return NextResponse.json({success:false,error:'Invalid curriculum path',code:'INVALID_REQUEST'},{status:400});
  }
  if (request.method !== 'GET') {
    const origin = request.headers.get('origin');
    if ((origin && origin !== request.nextUrl.origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
      return NextResponse.json({success:false,error:'Open Book Studio on its configured origin before saving.',code:'ORIGIN_DENIED'},{status:403});
    }
  }
  const token = request.cookies.get(COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: "Unauthorized", code: "PLATFORM_AUTH_REQUIRED" }, { status: 401 });
  }
  const DEFAULT_SCHOOLIMS_API_URL = "https://simsapi.nexsyrus.com/api/v1/";
  const base = process.env.SCHOOLIMS_API_URL || DEFAULT_SCHOOLIMS_API_URL;
  if (!base) {
    return NextResponse.json({ success: false, error: "Curriculum API is not configured", code: "CURRICULUM_API_UNCONFIGURED" }, { status: 503 });
  }
  const DEFAULT_SCHOOL_ID = "1";
  const schoolId = request.headers.get("x-school-id") || request.nextUrl.searchParams.get("school_id") || process.env.SCHOOL_ID || DEFAULT_SCHOOL_ID;
  const renderAsset = request.method === 'GET' && path.length === 5 && path[0] === 'assets' && path[2] === 'revisions' && path[4] === 'render';
  const upstreamPath = renderAsset ? [...path.slice(0, 4), 'download'] : path;
  const searchParams = new URLSearchParams(request.nextUrl.searchParams);
  if (!renderAsset && !searchParams.has("school_id")) {
    searchParams.set("school_id", schoolId);
  }
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const target = `${platformApiUrl(base, `api/v1/curriculum/authoring/${upstreamPath.map(encodeURIComponent).join("/")}`)}${queryString}`;
  const headers = new Headers();
  headers.set("authorization", `Bearer ${token}`);
  headers.set("content-type", "application/json");
  headers.set("x-school-id", schoolId);
  headers.set("x-request-id", request.headers.get("x-request-id") || crypto.randomUUID());
  const idempotencyKey = request.headers.get('idempotency-key');
  if (idempotencyKey) headers.set('idempotency-key', idempotencyKey);
  const init: RequestInit = { method: request.method, headers, cache: 'no-store', signal: AbortSignal.timeout(25000), redirect:'error' };
  if (request.method !== "GET" && request.method !== "HEAD") {
    let bodyText = await request.text();
    if (bodyText && (request.headers.get("content-type") || "").includes("application/json")) {
      try {
        const parsed = JSON.parse(bodyText);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed.school_id === undefined) {
          parsed.school_id = Number(schoolId);
          bodyText = JSON.stringify(parsed);
        }
      } catch {
        // preserve body text as is
      }
    }
    init.body = bodyText;
    if (new TextEncoder().encode(init.body).byteLength > 4 * 1024 * 1024) {
      return NextResponse.json({success:false,error:'Chapter payload exceeds 4 MB. Move images to the asset library.',code:'CONTENT_TOO_LARGE'},{status:413});
    }
  }
  let response: Response;
  try { response = await fetch(target, init); } catch {
    return NextResponse.json({success:false,error:'Central curriculum is unreachable. Your local recovery copy is safe.',code:'CURRICULUM_UNREACHABLE'},{status:502});
  }
  if(renderAsset&&response.ok){
    const json=await response.json();
    if(!json.data?.url||json.data.checksum!==request.nextUrl.searchParams.get('checksum'))return NextResponse.json({success:false,error:'Asset revision checksum mismatch'},{status:409});
    const url=new URL(json.data.url);if(url.protocol!=='https:'||!url.hostname.endsWith('.r2.cloudflarestorage.com'))return NextResponse.json({success:false,error:'Invalid asset delivery origin'},{status:502});
    // Keep image reads same-origin for canvas/PDF export. The signed URL stays
    // server-side and each read still checks the authenticated revision pin.
    let delivery: Response;
    try { delivery = await fetch(url, { signal: AbortSignal.timeout(25000), redirect: 'error' }); }
    catch { return NextResponse.json({success:false,error:'Cloud picture delivery failed. Retry loading the library.',code:'ASSET_UNREACHABLE'},{status:502}); }
    const mime = delivery.headers.get('content-type')?.split(';')[0];
    if (!delivery.ok || !mime || !['image/png','image/jpeg','image/webp'].includes(mime)) return NextResponse.json({success:false,error:'Cloud picture is unavailable',code:'ASSET_UNAVAILABLE'},{status:502});
    return new NextResponse(delivery.body,{status:200,headers:{'content-type':mime,'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
  }
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json",
      "x-request-id": response.headers.get("x-request-id") || headers.get("x-request-id") || "",
      "cache-control": "private, no-store",
    },
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

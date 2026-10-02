import { NextRequest, NextResponse } from "next/server";
import { platformApiUrl } from "../../../../editor/persistence/platformApiUrl";

const COOKIE = "nex_platform_access";

export async function POST(request: NextRequest) {
  const origin=request.headers.get('origin');
  if ((origin && origin!==request.nextUrl.origin) || request.headers.get('sec-fetch-site')==='cross-site') {
    return NextResponse.json({error:'Open Book Studio on its configured origin to sign in.'},{status:403});
  }
  const base = process.env.SUPERADMIN_API_URL;
  if (!base) {
    return NextResponse.json({ error: "Platform login is not configured" }, { status: 503 });
  }
  const raw=await request.text();
  if (new TextEncoder().encode(raw).byteLength>10000) return NextResponse.json({error:'Login request too large'},{status:413});
  let body;
  try { body=JSON.parse(raw); } catch { return NextResponse.json({error:'Invalid login request'},{status:400}); }
  if (!body || typeof body.email!=='string' || typeof body.password!=='string') return NextResponse.json({error:'Email and password are required'},{status:400});
  let response: Response;
  try { response = await fetch(platformApiUrl(base, "api/super-admin/auth/login"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
    cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000),
  }); } catch { return NextResponse.json({error:'Platform sign in is unreachable. Try again.'},{status:502}); }
  const json = await response.json().catch(() => ({}));
  const token = json.session?.access_token;
  if (!response.ok || !token) {
    return NextResponse.json({ error: "Login failed" }, { status: response.ok ? 502 : response.status });
  }
  const next = NextResponse.json({ success: true, role: json.role || null });
  next.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 15 * 60,
  });
  return next;
}

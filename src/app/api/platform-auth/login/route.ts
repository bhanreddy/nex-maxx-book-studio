import { NextRequest, NextResponse } from "next/server";
import { platformApiUrl } from "../../../../editor/persistence/platformApiUrl";

const COOKIE = "nex_platform_access";
const REFRESH_COOKIE = "nex_platform_refresh";
const DEFAULT_SUPERADMIN_API_URL = "https://superadminapi.nexsyrus.com/api/v1/";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== request.nextUrl.origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "Open Book Studio on its configured origin to sign in." }, { status: 403 });
  }

  const base = process.env.SUPERADMIN_API_URL || DEFAULT_SUPERADMIN_API_URL;
  if (!base) {
    return NextResponse.json({ error: "Platform login is not configured" }, { status: 503 });
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 10000) {
    return NextResponse.json({ error: "Login request too large" }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid login request" }, { status: 400 });
  }

  // Accept email, identifier, employee ID, or founder ID
  const identifier = String(body?.identifier || body?.email || body?.employeeId || body?.founderId || "").trim();
  const password = typeof body?.password === "string" ? body.password : "";

  if (!identifier || !password) {
    return NextResponse.json({ error: "Email or Founder ID and password are required" }, { status: 400 });
  }

  let response: Response;
  const targetUrl = platformApiUrl(base, "api/super-admin/auth/login");

  try {
    response = await fetch(targetUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier,
        email: identifier,
        password,
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(45000), // Resilient to Render cold starts (up to 45s)
    });
  } catch (cause) {
    const isTimeout = cause instanceof Error && (cause.name === "AbortError" || cause.name === "TimeoutError");
    return NextResponse.json(
      {
        error: isTimeout
          ? "Platform sign in timed out while connecting to the SuperAdmin service. The service is waking up; please try again in a few moments."
          : "Platform sign in is unreachable. Please verify your connection to the SuperAdmin platform and try again.",
      },
      { status: 502 }
    );
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errMsg = json.error || json.message || "Invalid credentials. Please verify your SuperAdmin Founder credentials.";
    return NextResponse.json({ error: errMsg }, { status: response.status || 401 });
  }

  const token = json.session?.access_token;
  if (!token) {
    return NextResponse.json({ error: "Authentication succeeded but no access token was returned." }, { status: 502 });
  }

  // Verify that the user credentials belong to a SuperAdmin Founder
  const role = String(json.role || json.user?.role || "").toUpperCase();
  const isFounderOrSuperAdmin = Boolean(
    json.isSuperAdmin ||
    role === "FOUNDER" ||
    role === "SUPER_ADMIN" ||
    Boolean(json.founder)
  );

  if (!isFounderOrSuperAdmin) {
    return NextResponse.json(
      { error: "Access denied. Only SuperAdmin Founder credentials can log in to this platform." },
      { status: 403 }
    );
  }

  const user = json.user || {};
  const next = NextResponse.json({
    success: true,
    role: json.role || "FOUNDER",
    user: {
      id: user.id || null,
      email: user.email || identifier,
      fullName: user.full_name || user.fullName || "Founder",
      employeeId: user.employee_id || user.employeeId || null,
      role: json.role || "FOUNDER",
      isSuperAdmin: true,
    },
  });

  const isProduction = process.env.NODE_ENV === "production";

  // Access token cookie (15 min TTL aligned with platform JWT expiry)
  next.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: 15 * 60,
  });

  // Refresh token cookie (7 days TTL for seamless session renewal)
  if (json.session?.refresh_token) {
    next.cookies.set(REFRESH_COOKIE, json.session.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
  }

  return next;
}

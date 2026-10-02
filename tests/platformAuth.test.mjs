import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
require.extensions['.ts'] = (module, file) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText,
    file
  );

const { NextRequest } = require('next/server');
const { POST } = require('../src/app/api/platform-auth/login/route.ts');
const COOKIE = 'nex_platform_access';
const REFRESH_COOKIE = 'nex_platform_refresh';

test('platform auth rejects cross-site origin', async () => {
  const req = new NextRequest('https://studio.example/api/platform-auth/login', {
    method: 'POST',
    headers: { origin: 'https://evil.example', 'content-type': 'application/json' },
    body: JSON.stringify({ identifier: 'test', password: 'test' }),
  });
  const res = await POST(req);
  assert.equal(res.status, 403);
  const json = await res.json();
  assert.equal(json.error, 'Open Book Studio on its configured origin to sign in.');
});

test('platform auth requires email or Founder ID and password', async () => {
  const req = new NextRequest('https://studio.example/api/platform-auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier: '', password: '' }),
  });
  const res = await POST(req);
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.error, 'Email or Founder ID and password are required');
});

test('platform auth forwards Founder credentials to SuperAdmin and sets session cookies', async t => {
  const prevUrl = process.env.SUPERADMIN_API_URL;
  process.env.SUPERADMIN_API_URL = 'https://superadmin.test/api/v1/';
  t.after(() => {
    if (prevUrl === undefined) delete process.env.SUPERADMIN_API_URL;
    else process.env.SUPERADMIN_API_URL = prevUrl;
  });

  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json({
      role: 'FOUNDER',
      isSuperAdmin: true,
      user: {
        id: '984f8a31-a135-465f-ab88-211e1157b341',
        email: '25e001.nexsyrus@gmail.com',
        full_name: 'Super Admin',
        employee_id: 'FOUNDER-001',
        role: 'FOUNDER',
      },
      session: {
        access_token: 'test-founder-jwt-token',
        refresh_token: 'test-founder-refresh-token',
      },
      founder: {
        id: '984f8a31-a135-465f-ab88-211e1157b341',
        email: '25e001.nexsyrus@gmail.com',
      },
    });
  });

  const req = new NextRequest('https://studio.example/api/platform-auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier: 'FOUNDER-001', password: 'SecretPassword123!' }),
  });

  const res = await POST(req);
  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://superadmin.test/api/super-admin/auth/login');

  const sentBody = JSON.parse(calls[0].init.body);
  assert.equal(sentBody.identifier, 'FOUNDER-001');
  assert.equal(sentBody.email, 'FOUNDER-001');
  assert.equal(sentBody.password, 'SecretPassword123!');

  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.role, 'FOUNDER');
  assert.equal(json.user.fullName, 'Super Admin');
  assert.equal(json.user.employeeId, 'FOUNDER-001');

  // Verify cookies set
  const setCookie = res.headers.get('set-cookie');
  assert.ok(setCookie.includes(`${COOKIE}=test-founder-jwt-token`));
  assert.ok(setCookie.includes(`${REFRESH_COOKIE}=test-founder-refresh-token`));
});

test('platform auth rejects non-founder non-superadmin roles', async t => {
  const prevUrl = process.env.SUPERADMIN_API_URL;
  process.env.SUPERADMIN_API_URL = 'https://superadmin.test/api/v1/';
  t.after(() => {
    if (prevUrl === undefined) delete process.env.SUPERADMIN_API_URL;
    else process.env.SUPERADMIN_API_URL = prevUrl;
  });

  t.mock.method(globalThis, 'fetch', async () => {
    return Response.json({
      role: 'SALES_EXECUTIVE',
      isSuperAdmin: false,
      user: {
        id: 'd31ae914-45d3-44db-80ac-47cadf9ef429',
        email: 'sales@example.com',
        role: 'SALES_EXECUTIVE',
      },
      session: {
        access_token: 'test-sales-token',
      },
      founder: null,
    });
  });

  const req = new NextRequest('https://studio.example/api/platform-auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier: 'sales@example.com', password: 'password' }),
  });

  const res = await POST(req);
  assert.equal(res.status, 403);
  const json = await res.json();
  assert.ok(json.error.includes('Only SuperAdmin Founder credentials'));
});

test('platform auth falls back to default SuperAdmin API URL when unset', async t => {
  const prevUrl = process.env.SUPERADMIN_API_URL;
  delete process.env.SUPERADMIN_API_URL;
  t.after(() => {
    if (prevUrl !== undefined) process.env.SUPERADMIN_API_URL = prevUrl;
  });

  let calledUrl = '';
  t.mock.method(globalThis, 'fetch', async url => {
    calledUrl = String(url);
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  });

  const req = new NextRequest('https://studio.example/api/platform-auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
  });

  const res = await POST(req);
  assert.equal(res.status, 401);
  assert.equal(calledUrl, 'https://superadminapi.nexsyrus.com/api/super-admin/auth/login');
});

import { NextResponse } from 'next/server';
export function GET() { const appIds = (process.env.SIMS_APPLE_APP_IDS || '').split(',').filter(v => /^[A-Z0-9]{10}\.[A-Za-z0-9.-]+$/.test(v)); if (!appIds.length)
    return NextResponse.json({ error: 'App associations are not configured' }, { status: 503 }); return NextResponse.json({ applinks: { details: appIds.map(appID => ({ appID, paths: ['/q/*'] })) } }, { headers: { 'cache-control': 'public, max-age=300' } }); }

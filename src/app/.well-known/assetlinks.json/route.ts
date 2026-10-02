import { NextResponse } from 'next/server';
export function GET() { try {
    const apps = JSON.parse(process.env.SIMS_ANDROID_ASSOCIATIONS || '[]') as {
        packageName: string;
        fingerprints: string[];
    }[];
    if (!Array.isArray(apps) || !apps.length || apps.some(a => !/^[A-Za-z0-9_.]+$/.test(a.packageName) || !Array.isArray(a.fingerprints) || !a.fingerprints.length || a.fingerprints.some(f => !/^([A-F0-9]{2}:){31}[A-F0-9]{2}$/.test(f))))
        throw Error();
    return NextResponse.json(apps.map(a => ({ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: a.packageName, sha256_cert_fingerprints: a.fingerprints } })), { headers: { 'cache-control': 'public, max-age=300' } });
}
catch {
    return NextResponse.json({ error: 'App associations are not configured' }, { status: 503 });
} }

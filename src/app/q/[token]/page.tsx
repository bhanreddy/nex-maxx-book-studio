import { notFound } from 'next/navigation';
export default async function LearningLanding({ params }: {
    params: Promise<{
        token: string;
    }>;
}) {
    const { token } = await params;
    if (!/^qr_[A-Za-z0-9_-]{43}$/.test(token))
        notFound();
    const store = process.env.SIMS_INSTALL_URL;
    const install = store && /^https:\/\/(?:play\.google\.com|apps\.apple\.com)\//.test(store) ? store : null;
    return <main style={{ minHeight: '100vh', background: '#FAF8F5', color: '#29262B', display: 'grid', placeItems: 'center', padding: 24 }}><article style={{ maxWidth: 460, width: '100%', padding: 40, border: '1px solid #E4DDE0', borderRadius: 20, background: '#FFFFFF' }}><div style={{ color: '#651F34', fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>NEX MAXX</div><h1 style={{ fontSize: 32, lineHeight: 1.15, margin: '24px 0 16px' }}>Learning continues<br />in SIMS.</h1><p style={{ color: '#69636B', lineHeight: 1.6 }}>This learning resource is available through the SIMS app. Sign in with your school account to watch and continue where you left off.</p><a href={`schoolims:///q/${token}`} style={{ display: 'block', textAlign: 'center', background: '#651F34', color: 'white', padding: 16, borderRadius: 12, marginTop: 28 }}>Open in SIMS</a>{install ? <a href={install} style={{ display: 'block', padding: 16, textAlign: 'center', color: '#651F34' }}>Install / Update SIMS</a> : <p style={{ fontSize: 13, color: '#69636B', marginTop: 20 }}>Get the SIMS installation link from your school.</p>}<p style={{ fontSize: 11, color: '#69636B', marginTop: 32 }}>FROM YOUR NEX MAXX BOOK</p></article></main>;
}

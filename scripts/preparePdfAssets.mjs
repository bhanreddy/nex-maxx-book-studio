import { createRequire } from 'node:module';
import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Self-host matching worker/fonts/decoders; never fetch user templates or code from a CDN.
const require = createRequire(import.meta.url);
const source = path.dirname(require.resolve('pdfjs-dist/package.json'));
const { version } = require('pdfjs-dist/package.json');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'public', 'pdfjs', version);
await mkdir(destination, { recursive: true });
await cp(path.join(source, 'build', 'pdf.worker.min.mjs'), path.join(destination, 'pdf.worker.min.mjs'));
for (const folder of ['cmaps', 'standard_fonts', 'wasm', 'iccs']) {
  await cp(path.join(source, folder), path.join(destination, folder), { recursive: true });
}
console.log(`Prepared local PDF renderer assets (${version}).`);

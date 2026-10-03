import { IMPORT_LIMITS } from './types';

/** Inspect the central directory before decompressing. No archive paths are written to disk. */
export function validateDocxArchive(buffer: ArrayBuffer) {
  const view = new DataView(buffer), bytes = new Uint8Array(buffer);
  const fail = () => { throw new Error('This is not a supported Word document. Save it as a fresh .docx file and try again.'); };
  if (view.byteLength < 22 || view.getUint32(0, true) !== 0x04034b50) fail();
  let end = view.byteLength - 22;
  while (end >= Math.max(0, view.byteLength - 65557) && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < Math.max(0, view.byteLength - 65557)) fail();
  const count = view.getUint16(end + 10, true), size = view.getUint32(end + 12, true), start = view.getUint32(end + 16, true);
  if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true) || !count || count > IMPORT_LIMITS.entries || start + size > end) fail();
  let offset = start, total = 0;
  const names = new Set<string>();
  for (let i = 0; i < count; i++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50) fail();
    const flags = view.getUint16(offset + 8, true), method = view.getUint16(offset + 10, true);
    const packed = view.getUint32(offset + 20, true), unpacked = view.getUint32(offset + 24, true);
    const length = view.getUint16(offset + 28, true), extra = view.getUint16(offset + 30, true), comment = view.getUint16(offset + 32, true);
    const local = view.getUint32(offset + 42, true);
    if (flags & 1) throw new Error('This Word document is encrypted. Save an unlocked .docx copy first.');
    if (![0, 8].includes(method) || offset + 46 + length + extra + comment > end || local + 30 > start) fail();
    const name = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + length));
    if (names.has(name) || name.includes('..') || name.startsWith('/') || name.includes('\\')) fail();
    names.add(name); total += unpacked;
    if (unpacked > IMPORT_LIMITS.entryBytes || total > IMPORT_LIMITS.expandedBytes || (packed && unpacked / packed > 1000)) {
      throw new Error('This Word file expands beyond the safe import limit. Split it into smaller chapters before importing.');
    }
    if (view.getUint32(local, true) !== 0x04034b50 || local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true) + packed > start) fail();
    offset += 46 + length + extra + comment;
  }
  if (!names.has('word/document.xml') || !names.has('[Content_Types].xml') || offset !== start + size) fail();
  return { entries: count, expandedBytes: total };
}

import { ChapterRepositoryError, type ChapterSaveResult, type ChapterSaveTarget, type ChapterSnapshot, type ContentRevisionToken, type CloudChapterRepository } from './chapterRepository';
import type { SemanticDocument } from './semanticDocument';

export type CloudSaveState = 'Saved' | 'Saving' | 'Offline' | 'Local backup only' | 'Cloud save failed' | 'Conflict detected';
export interface CloudSaveStatus { state: CloudSaveState; dirty: boolean; error?: string; current?: ContentRevisionToken; base: ContentRevisionToken }
interface PendingSave<TDocument> { key: string; document: TDocument; base: ContentRevisionToken }
export interface CloudRecoveryRecord<TDocument = SemanticDocument> {
  target: ChapterSaveTarget;
  base: ContentRevisionToken;
  document?: TDocument;
  acknowledged: string;
  pending?: PendingSave<TDocument>;
  conflict?: ContentRevisionToken;
}
export interface RecoveryStorage<TDocument = SemanticDocument> {
  save(record: CloudRecoveryRecord<TDocument>): void;
  archive(document: TDocument): void;
}

function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, sorted(item)]));
  return value;
}
export const documentSignature = (document: unknown) => JSON.stringify(sorted(document));
export const emptyContentToken = (): ContentRevisionToken => ({ revision: 0, edit_version: 0, checksum: null });
const asToken = (value: ContentRevisionToken): ContentRevisionToken => ({ revision: value.revision, edit_version: value.edit_version, checksum: value.checksum,...(value.layout?{layout:{...value.layout}}:{}) });

/** One serialized save queue per linked chapter. Local recovery precedes network writes. */
export class CloudSaveController<TDocument = SemanticDocument> {
  private record: CloudRecoveryRecord<TDocument>;
  private timer?: ReturnType<typeof setTimeout>;
  private running?: Promise<ChapterSaveResult | undefined>;
  private state: CloudSaveState;
  private error?: string;
  constructor(
    record: CloudRecoveryRecord<TDocument>,
    private repository: CloudChapterRepository<TDocument>,
    private recovery: RecoveryStorage<TDocument>,
    private onStatus: (status: CloudSaveStatus) => void = () => {},
    private online: () => boolean = () => typeof navigator === 'undefined' || navigator.onLine,
    private debounceMs = 1200,
  ) {
    this.record = structuredClone(record);
    this.state = record.conflict ? 'Conflict detected' : this.dirty ? 'Local backup only' : 'Saved';
    this.emit();
  }
  get target() { return this.record.target; }
  get document() { return this.record.document; }
  get dirty() { return Boolean(this.record.pending || (this.record.document && documentSignature(this.record.document) !== this.record.acknowledged)); }
  get status(): CloudSaveStatus { return { state: this.state, dirty: this.dirty, error: this.error, current: this.record.conflict, base: asToken(this.record.base) }; }
  private emit() { this.onStatus(this.status); }
  private persist() { this.recovery.save(structuredClone(this.record)); }
  private schedule() {
    if (this.timer) clearTimeout(this.timer);
    if (this.record.conflict) return;
    this.timer = setTimeout(() => { this.timer = undefined; void this.flush().catch(() => {}); }, this.debounceMs);
  }
  update(document: TDocument) {
    if (this.record.document && documentSignature(document) === documentSignature(this.record.document)) return;
    this.record.document = structuredClone(document);
    this.error = undefined;
    try { this.persist(); } catch {
      this.state = 'Cloud save failed'; this.error = 'Local recovery storage is full or unavailable. Export this chapter before closing.'; this.emit(); return;
    }
    this.state = this.record.conflict ? 'Conflict detected' : this.dirty ? (this.online() ? 'Saving' : 'Offline') : 'Saved';
    this.emit();
    if (this.dirty && this.online()) this.schedule();
  }
  /** Explicitly choosing remote content preserves the displaced local draft. */
  acceptRemote(snapshot: ChapterSnapshot<TDocument>) {
    if (this.running) throw new Error('Wait for the current save before reloading.');
    if (this.timer) clearTimeout(this.timer);
    if (this.record.document && this.dirty) this.recovery.archive(this.record.document);
    this.record = { target: this.record.target, base: asToken(snapshot), document: structuredClone(snapshot.document), acknowledged: documentSignature(snapshot.document) };
    this.persist(); this.state = 'Saved'; this.error = undefined; this.emit();
  }
  flush(): Promise<ChapterSaveResult | undefined> {
    if (this.timer) clearTimeout(this.timer);
    if (this.running) return this.running;
    this.running = this.run().finally(() => { this.running = undefined; });
    return this.running;
  }
  private async run(): Promise<ChapterSaveResult | undefined> {
    let result: ChapterSaveResult | undefined;
    while (this.dirty) {
      if (this.record.conflict) throw new ChapterRepositoryError('Reload or compare central changes before saving.', 'CONTENT_CONFLICT', 409, this.record.conflict);
      if (!this.online()) { this.state = 'Offline'; this.emit(); throw new Error('Offline. Your recovery copy is saved on this device.'); }
      if (!this.record.document) break;
      this.record.pending ||= { key: crypto.randomUUID(), document: structuredClone(this.record.document), base: asToken(this.record.base) };
      try {
        // Retain this exact key, document and base after timeouts, including a timeout after DB commit.
        this.persist(); this.state = 'Saving'; this.error = undefined; this.emit();
        const pending = this.record.pending;
        result = await this.repository.save(pending.document, this.record.target, { base: pending.base, idempotencyKey: pending.key });
        this.record.base = asToken(result);
        this.record.acknowledged = documentSignature(pending.document);
        this.record.pending = undefined;
        this.persist();
        this.state = this.dirty ? 'Saving' : 'Saved'; this.emit();
      } catch (error) {
        const typed = error instanceof ChapterRepositoryError ? error : undefined;
        if (typed?.status === 409 || typed?.status === 428) {
          this.record.conflict = typed.current || asToken(this.record.base);
          this.state = 'Conflict detected';
        } else this.state = this.online() ? 'Cloud save failed' : 'Offline';
        this.error = error instanceof Error ? error.message : 'Cloud save failed. Your local recovery copy is safe.';
        try { this.persist(); } catch { this.error += ' Local recovery storage is also unavailable; export before closing.'; }
        this.emit(); throw error;
      }
    }
    return result;
  }
  dispose() { if (this.timer) clearTimeout(this.timer); }
}

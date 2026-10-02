import { SemanticDocument, upgradeSemanticDocument } from "./semanticDocument";

export interface ContentRevisionToken { revision: number; edit_version: number; checksum: string | null; layout?: {revision:number;checksum:string|null} }
export interface ChapterSaveResult extends ContentRevisionToken { checksum: string; updated_at?: string; status?: string }
export interface ChapterSnapshot<TDocument = SemanticDocument> extends ChapterSaveResult { document: TDocument }
export interface ChapterSaveOptions { base?: ContentRevisionToken; idempotencyKey?: string }
export class ChapterRepositoryError extends Error {
  constructor(message: string, public code: string, public status: number, public current?: ContentRevisionToken) { super(message); }
}

export interface ChapterSaveTarget {
  bookId?: string;
  masterChapterId: string;
  curriculumVersionId: string;
}

export interface ChapterRepository<TDocument = SemanticDocument> {
  readonly kind: "local" | "cloud";
  save(document: TDocument, target: ChapterSaveTarget, options?: ChapterSaveOptions): Promise<ChapterSaveResult>;
  load(masterChapterId: string, revision?: number): Promise<TDocument>;
}

const LOCAL_SEMANTIC_KEY = "nex_maxx_book_studio_semantic_v1";

export const localChapterRepository: ChapterRepository = {
  kind: "local",
  async save(document, target) {
    if (typeof localStorage === "undefined") {
      throw new Error("Local chapter storage is only available in the browser");
    }
    const raw = localStorage.getItem(LOCAL_SEMANTIC_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[target.masterChapterId] = document;
    localStorage.setItem(LOCAL_SEMANTIC_KEY, JSON.stringify(all));
    return { revision: 0, edit_version: 0, checksum: "local" };
  },
  async load(masterChapterId) {
    if (typeof localStorage === "undefined") {
      throw new Error("Local chapter storage is only available in the browser");
    }
    const raw = localStorage.getItem(LOCAL_SEMANTIC_KEY);
    const all = raw ? JSON.parse(raw) : {};
    const document = all[masterChapterId];
    if (!document) throw new Error("Local chapter not found");
    return document as SemanticDocument;
  },
};

export function defaultChapterRepository(): ChapterRepository {
  return localChapterRepository;
}

export interface CloudChapterRepository<TDocument = SemanticDocument> extends ChapterRepository<TDocument> {
  loadSnapshot(masterChapterId: string, revision?: number): Promise<ChapterSnapshot<TDocument>>;
}

export function cloudChapterRepository(fetchImpl: typeof fetch = fetch): CloudChapterRepository {
  const read = async (masterChapterId: string, revision?: number): Promise<ChapterSnapshot> => {
    const query = revision ? `?revision=${revision}` : "";
    const response = await fetchImpl(`/api/curriculum/chapters/${masterChapterId}/document${query}`, { cache: "no-store", headers: { "x-school-id": "1" } });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new ChapterRepositoryError(json.error || "Cloud chapter load failed", json.code || "CLOUD_LOAD_FAILED", response.status, json.current);
    if (!json.data?.document || typeof json.data.document !== "object" || !Number.isSafeInteger(json.data.revision)
      || !Number.isSafeInteger(json.data.edit_version) || !/^[a-f0-9]{64}$/.test(json.data.checksum)) {
      throw new Error("Cloud chapter load returned invalid revision metadata");
    }
    return { ...json.data, document: upgradeSemanticDocument(json.data.document) };
  };
  return {
    kind: "cloud",
    async save(document, target, options = {}) {
      const response = await fetchImpl(`/api/curriculum/chapters/${target.masterChapterId}/document`, {
        method: "PUT",
        headers: { "content-type": "application/json", "x-school-id": "1", ...(options.idempotencyKey ? { "idempotency-key": options.idempotencyKey } : {}) },
        body: JSON.stringify({ school_id: 1, curriculum_version_id: target.curriculumVersionId, document: upgradeSemanticDocument(document), base: options.base }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new ChapterRepositoryError(json.error || "Cloud chapter save failed", json.code || "CLOUD_SAVE_FAILED", response.status, json.current);
      if (!Number.isSafeInteger(json.data?.revision) || !Number.isSafeInteger(json.data?.edit_version) || !/^[a-f0-9]{64}$/.test(json.data?.checksum)) {
        throw new Error("Cloud chapter save returned an invalid revision");
      }
      return json.data;
    },
    loadSnapshot: read,
    async load(masterChapterId, revision) { return (await read(masterChapterId, revision)).document; },
  };
}

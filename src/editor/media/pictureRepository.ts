import { z } from "zod";
import { curriculumRequest } from "../persistence/bookRepository";
import { ChapterRepositoryError } from "../persistence/chapterRepository";
import { assetRenderUrl } from "../persistence/assetReferences";
import type { PageElement } from "../../domain/element/types";

const assetSchema = z.object({
  id: z.string().uuid(), title: z.string(), revision: z.number().int().positive(),
  checksum: z.string().regex(/^[a-f0-9]{64}$/), mime_type: z.string(), size_bytes: z.number(),
});
export type PictureAsset = z.infer<typeof assetSchema>;
export interface PictureCatalog { items: PictureAsset[]; next_offset: number | null }
const revisionSchema = z.object({ asset_id: z.string().uuid(), revision: z.number().int().positive(),
  checksum: z.string().regex(/^[a-f0-9]{64}$/), mime_type: z.string(), size_bytes: z.number(),
  width_px: z.number().positive(), height_px: z.number().positive() });
export const MAX_PICTURE_BYTES = 25 * 1024 * 1024;

export async function listCloudPictures(search = "", offset = 0): Promise<PictureCatalog> {
  const result = await curriculumRequest<{ items: unknown[]; next_offset: number | null }>(`assets?search=${encodeURIComponent(search.trim().slice(0, 200))}&offset=${offset}`);
  return { items: result.items.flatMap(value => {
    const parsed = assetSchema.safeParse(value);
    return parsed.success && parsed.data.mime_type.startsWith("image/") ? [parsed.data] : [];
  }), next_offset: result.next_offset };
}

export async function validatePictureFile(file: File) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Choose a PNG, JPG or WebP picture.");
  if (!file.size || file.size > MAX_PICTURE_BYTES) throw new Error("Each picture must be between 1 byte and 25 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte);
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!(file.type === "image/png" && png || file.type === "image/jpeg" && jpeg || file.type === "image/webp" && webp)) throw new Error("The picture contents do not match its file type.");
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

interface UploadRequest { key: string; payload: { title: string; filename: string; mime: string; size: number; checksum: string } }
const pending = new Map<string, UploadRequest>();
function recoveryStorage() { try { return typeof localStorage === "undefined" ? undefined : localStorage; } catch { return undefined; } }

/** Only return a preset after the server verifies its bytes and commits its cloud revision. */
export async function uploadCloudPicture(file: File, title = file.name.replace(/\.[^.]+$/, "")) {
  const checksum = await validatePictureFile(file);
  title = title.trim().slice(0, 300);
  if (!title) throw new Error("Enter a picture name.");
  const recoveryKey = `nexmaxx:picture-upload:${checksum}:${encodeURIComponent(title)}`;
  const payload = { title, filename: file.name.replace(/[\x00-\x1f\x7f/\\]/g, "_").slice(0, 255), mime: file.type, size: file.size, checksum };
  let request = pending.get(recoveryKey);
  if (!request) {
    try { request = JSON.parse(recoveryStorage()?.getItem(recoveryKey) || "null"); } catch { /* Invalid recovery metadata starts a fresh upload. */ }
    if (!request?.key || JSON.stringify(request.payload) !== JSON.stringify(payload)) request = { key: crypto.randomUUID(), payload };
    pending.set(recoveryKey, request);
    try { recoveryStorage()?.setItem(recoveryKey, JSON.stringify(request)); } catch { /* Keep only retry metadata in memory when storage is full. */ }
  }
  let session: { upload_id: string; upload_url?: string; mime: string; status?: string };
  try { session = await curriculumRequest("assets/uploads", "POST", request.payload, request.key); }
  catch (error) {
    if (error instanceof ChapterRepositoryError && error.code === "UPLOAD_EXPIRED") {
      pending.delete(recoveryKey); recoveryStorage()?.removeItem(recoveryKey);
      throw new Error("The upload expired. Select the picture again to retry.");
    }
    throw error;
  }
  if (session.status !== "READY") {
    const url = new URL(session.upload_url || "");
    if (url.protocol !== "https:" || !url.hostname.endsWith(".r2.cloudflarestorage.com") || session.mime !== file.type) throw new Error("Cloud storage returned an invalid upload destination.");
    const response = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type }, signal: AbortSignal.timeout(120000), credentials: "omit", redirect: "error" });
    if (!response.ok) throw new Error("Picture upload failed. Select the same file to retry.");
  }
  const revision = revisionSchema.parse(await curriculumRequest(`assets/uploads/${encodeURIComponent(session.upload_id)}/confirm`, "POST", {}));
  if (revision.checksum !== checksum || revision.size_bytes !== file.size || revision.mime_type !== file.type) throw new Error("Cloud verification did not match this picture. The preset has not been added.");
  pending.delete(recoveryKey);
  try { recoveryStorage()?.removeItem(recoveryKey); } catch { /* Cloud commit already succeeded. */ }
  return { id: revision.asset_id, title, revision: revision.revision, checksum, mime_type: file.type, size_bytes: file.size,
    width_px: revision.width_px, height_px: revision.height_px };
}

export function pictureElement(asset: PictureAsset, pageId: string, zIndex: number, dimensions = { width: 1, height: 1 }): PageElement {
  const pin = { assetId: asset.id, revision: asset.revision, checksum: asset.checksum };
  const scale = Math.min(220 / dimensions.width, 260 / dimensions.height);
  return { id: crypto.randomUUID(), pageId, type: "image", category: "media", version: 1, displayName: asset.title,
    transform: { x: 54, y: 120, width: dimensions.width * scale, height: dimensions.height * scale, rotation: 0, zIndex },
    style: { objectFit: "contain", backgroundColor: "transparent", opacity: 1 },
    content: { src: assetRenderUrl(pin), assetRef: pin, alt: asset.title, ...(dimensions.width > 1 ? { rawWidthPx: dimensions.width, rawHeightPx: dimensions.height } : {}) }, locked: false, hidden: false };
}

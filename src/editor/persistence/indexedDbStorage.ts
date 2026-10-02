/**
 * NEX MAXX Book Studio - Local-First IndexedDB Persistence Engine
 * 
 * Provides high-capacity, browser-quota-managed local storage for 200–400+ page books,
 * local asset caching, crash recovery snapshots, and offline project management.
 */

import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import type { CustomLayoutDefinition } from "../../domain/layout/customLayoutTypes";
import type { Book } from "../../domain/book/types";
import type { PageElement } from "../../domain/element/types";

const DB_NAME = "nex_maxx_book_studio_db";
const DB_VERSION = 1;

export interface StorageProjectPayload {
  books: Book[];
  activeBookId: string;
  activePageIndex: number;
  elements: Record<string, PageElement>;
  publicationPresets?: Record<string, { name: string; block: SmartBlockInstance }>;
  userCustomLayouts?: Record<string, CustomLayoutDefinition>;
  savedAt: string;
}

export interface CrashRecoverySnapshot {
  id: string;
  bookId: string;
  timestamp: string;
  totalPages: number;
  totalElements: number;
  payload: StorageProjectPayload;
}

export interface CachedAsset {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  byteSize: number;
  lastAccessed: string;
}

class IndexedDbStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isAvailable: boolean = true;

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === "undefined" || !window.indexedDB) {
      return Promise.reject(new Error("IndexedDB is not available"));
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          // Store 1: Current workspace state
          if (!db.objectStoreNames.contains("workspace")) {
            db.createObjectStore("workspace", { keyPath: "key" });
          }
          // Store 2: Books individual records
          if (!db.objectStoreNames.contains("books")) {
            db.createObjectStore("books", { keyPath: "id" });
          }
          // Store 3: Page Elements
          if (!db.objectStoreNames.contains("elements")) {
            const elStore = db.createObjectStore("elements", { keyPath: "id" });
            elStore.createIndex("pageId", "pageId", { unique: false });
          }
          // Store 4: Local Assets (Images, illustrations)
          if (!db.objectStoreNames.contains("assets")) {
            db.createObjectStore("assets", { keyPath: "id" });
          }
          // Store 5: Crash Recovery Snapshots
          if (!db.objectStoreNames.contains("snapshots")) {
            const snapStore = db.createObjectStore("snapshots", { keyPath: "id" });
            snapStore.createIndex("timestamp", "timestamp", { unique: false });
          }
          // Store 6: Offline Sync Queue
          if (!db.objectStoreNames.contains("syncQueue")) {
            db.createObjectStore("syncQueue", { keyPath: "id", autoIncrement: true });
          }
        };

        request.onsuccess = () => {
          request.result.onversionchange = () => { request.result.close(); this.dbPromise = null; };
          resolve(request.result);
        };

        request.onerror = () => {
          this.dbPromise = null;
          reject(request.error || new Error("Failed to open IndexedDB"));
        };

        request.onblocked = () => {
          console.warn("[IndexedDB] Database open blocked. Close other tabs.");
        };
      } catch (err) {
        this.isAvailable = false;
        reject(err);
      }
    });

    return this.dbPromise;
  }

  /**
   * Save complete active workspace state into IndexedDB
   */
  async saveWorkspace(payload: StorageProjectPayload): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(["workspace", "snapshots"], "readwrite");
        const workspaceStore = tx.objectStore("workspace");
        const snapStore = tx.objectStore("snapshots");

        // Retain the previous successful save independently from the current state.
        const previous = workspaceStore.get("active_workspace");
        previous.onsuccess = () => {
          const prior = previous.result;
          if (prior?.books?.length) {
            const book = prior.books.find((book: Book) => book.id === prior.activeBookId);
            if (book) snapStore.put({ id: `previous_${book.id}`, bookId: book.id, timestamp: prior.savedAt, totalPages: book.pages.length, totalElements: Object.keys(prior.elements).length, payload: prior });
          }
        };
        workspaceStore.put({ key: "active_workspace", ...payload, savedAt: new Date().toISOString() });

        // Keep a rolling recovery snapshot for crash protection
        const activeBook = payload.books.find(b => b.id === payload.activeBookId);
        if (activeBook) {
          const snapshotId = `snap_${activeBook.id}`;
          snapStore.put({
            id: snapshotId,
            bookId: activeBook.id,
            timestamp: new Date().toISOString(),
            totalPages: activeBook.pages.length,
            totalElements: Object.keys(payload.elements).length,
            payload,
          });
        }

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error("Local storage transaction aborted"));
      });
    } catch (err) {
      console.warn("[IndexedDB] saveWorkspace failed, falling back to localStorage", err);
      return false;
    }
  }

  /**
   * Load workspace state from IndexedDB
   */
  async loadWorkspace(): Promise<StorageProjectPayload | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(["workspace"], "readonly");
        const store = tx.objectStore("workspace");
        const request = store.get("active_workspace");

        request.onsuccess = () => {
          if (request.result) {
            const { key, ...data } = request.result;
            resolve(data as StorageProjectPayload);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn("[IndexedDB] loadWorkspace error", err);
      return null;
    }
  }

  /**
   * Cache asset locally (image, illustration data URL)
   */
  async cacheAsset(asset: CachedAsset): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(["assets"], "readwrite");
        const store = tx.objectStore("assets");
        store.put(asset);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error("Local storage transaction aborted"));
      });
    } catch {
      return false;
    }
  }

  /**
   * Retrieve cached asset by ID
   */
  async getCachedAsset(id: string): Promise<CachedAsset | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(["assets"], "readonly");
        const store = tx.objectStore("assets");
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }

  /**
   * Check for crash recovery snapshots
   */
  async getLatestRecoverySnapshot(): Promise<CrashRecoverySnapshot | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(["snapshots"], "readonly");
        const store = tx.objectStore("snapshots");
        const index = store.index("timestamp");
        const request = index.openCursor(null, "prev"); // newest first

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            resolve(cursor.value as CrashRecoverySnapshot);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }

  /**
   * Queue offline sync operation
   */
  async queueOfflineChange(change: { action: string; entityId: string; data: unknown }): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(["syncQueue"], "readwrite");
      tx.objectStore("syncQueue").add({
        ...change,
        queuedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("[IndexedDB] Failed to queue offline change", err);
    }
  }

  /**
   * Get pending offline sync changes count
   */
  async getPendingSyncCount(): Promise<number> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(["syncQueue"], "readonly");
        const req = tx.objectStore("syncQueue").count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }
}

export const localDb = new IndexedDbStorageService();

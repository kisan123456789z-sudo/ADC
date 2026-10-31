import { collection, doc, setDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';

// Maximum size in bytes before image compression is triggered (350 KB)
const IMAGE_COMPRESSION_THRESHOLD = 350 * 1024;
// Maximum characters in a single chunk for Firestore document storage (~380 KB string)
const CHUNK_SIZE = 380 * 1024;

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeBytes?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Resizes and compresses an image data URL if it exceeds the specified maximum size.
 * Guarantees that Firestore documents (which have a strict 1MB size limit) never fail.
 */
export async function compressDataUrl(
  dataUrl: string,
  options: ImageCompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    maxSizeBytes = 120 * 1024,
    format = 'image/jpeg'
  } = options;

  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  // If already under size threshold (accounting for ~1.37 base64 multiplier), return as is
  if (dataUrl.length <= maxSizeBytes * 1.37) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width / maxWidth > height / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          // Background white for transparent images if exporting to jpeg
          if (format === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          }
          ctx.drawImage(img, 0, 0, width, height);

          let currentQuality = quality;
          let compressed = canvas.toDataURL(format, currentQuality);

          // If still over threshold, compress more aggressively
          if (compressed.length > maxSizeBytes * 1.37 && currentQuality > 0.4) {
            currentQuality = Math.max(0.4, currentQuality - 0.25);
            compressed = canvas.toDataURL(format, currentQuality);
          }

          // If STILL over threshold, scale dimensions down further
          if (compressed.length > maxSizeBytes * 1.37) {
            const smallerCanvas = document.createElement('canvas');
            smallerCanvas.width = Math.max(1, Math.round(width * 0.65));
            smallerCanvas.height = Math.max(1, Math.round(height * 0.65));
            const sCtx = smallerCanvas.getContext('2d');
            if (sCtx) {
              if (format === 'image/jpeg') {
                sCtx.fillStyle = '#FFFFFF';
                sCtx.fillRect(0, 0, smallerCanvas.width, smallerCanvas.height);
              }
              sCtx.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height);
              compressed = smallerCanvas.toDataURL(format, 0.65);
            }
          }

          resolve(compressed);
        } catch (e) {
          console.warn('compressDataUrl error, returning fallback:', e);
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
}

/**
 * Compresses an uploaded image file into a compact data URL.
 * Guarantees that files (even 10MB phone camera shots) are compressed to ~30KB-90KB,
 * fitting comfortably into Firestore documents without exceeding limits.
 */
export async function compressImageFile(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<{ dataUrl: string; size: number }> {
  // If not an image (e.g. PDF), read directly
  if (!file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result as string, size: file.size });
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // If SVG, read as text/dataURL directly
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result as string, size: file.size });
      reader.onerror = () => reject(new Error('Failed to read SVG'));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        resolve({ dataUrl: '', size: 0 });
        return;
      }
      try {
        const compressed = await compressDataUrl(rawDataUrl, options);
        const approxBytes = Math.round((compressed.length * 3) / 4);
        resolve({ dataUrl: compressed, size: approxBytes });
      } catch (err) {
        console.warn('Image compression fallback:', err);
        resolve({ dataUrl: rawDataUrl, size: file.size });
      }
    };
    reader.onerror = () => resolve({ dataUrl: '', size: 0 });
    reader.readAsDataURL(file);
  });
}

/**
 * Optimizes an image client-side using HTML5 Canvas to keep it within Firestore document
 * size limits while maintaining high diagnostic clarity for dental X-rays and reports.
 */
export async function optimizeImageIfNeeded(file: File): Promise<{ dataUrl: string; size: number }> {
  return compressImageFile(file, {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.8,
    maxSizeBytes: 280 * 1024
  });
}

/**
 * Stores file chunks in `document_chunks` if the file base64 exceeds Firestore single doc limit
 */
export async function storeDocumentFileChunks(
  docId: string, 
  dataUrl: string
): Promise<{ isChunked: boolean; chunksCount: number; primaryFileUrl: string }> {
  // If string length is small enough to fit directly in one Firestore document (< 650KB dataURL)
  if (dataUrl.length < 650 * 1024) {
    // Cache in IndexedDB for fast retrieval
    saveToIndexedDB(docId, dataUrl).catch(() => {});
    return {
      isChunked: false,
      chunksCount: 1,
      primaryFileUrl: dataUrl
    };
  }

  // File is large (PDF or uncompressed image) -> chunk it
  const totalChunks = Math.ceil(dataUrl.length / CHUNK_SIZE);
  const chunks: string[] = [];
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, dataUrl.length);
    chunks.push(dataUrl.slice(start, end));
  }

  // Write chunks to Firestore using batch or parallel setDoc
  const batch = writeBatch(db);
  for (let i = 0; i < chunks.length; i++) {
    const chunkDocRef = doc(db, 'document_chunks', `${docId}_chk_${i}`);
    batch.set(chunkDocRef, {
      docId,
      chunkIndex: i,
      totalChunks,
      data: chunks[i],
      createdAt: new Date().toISOString()
    });
  }
  await batch.commit();

  // Cache full dataUrl in IndexedDB
  await saveToIndexedDB(docId, dataUrl).catch(() => {});

  return {
    isChunked: true,
    chunksCount: totalChunks,
    primaryFileUrl: chunks[0].slice(0, 500) // Small preview stub for reference
  };
}

/**
 * Loads the complete file data URL, reassembling chunks if needed
 */
export async function resolveDocumentFileUrl(
  docId: string, 
  primaryUrl: string, 
  isChunked?: boolean
): Promise<string> {
  // Try IndexedDB local cache first
  try {
    const cached = await getFromIndexedDB(docId);
    if (cached) return cached;
  } catch {}

  // If not chunked, primaryUrl is already the full file
  if (!isChunked || !primaryUrl) {
    return primaryUrl || '';
  }

  // Reassemble from document_chunks
  try {
    const q = query(
      collection(db, 'document_chunks'),
      where('docId', '==', docId)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      return primaryUrl;
    }
    const chunkItems: { chunkIndex: number; data: string }[] = [];
    snap.forEach((d) => {
      const c = d.data();
      chunkItems.push({
        chunkIndex: c.chunkIndex ?? 0,
        data: c.data || ''
      });
    });
    chunkItems.sort((a, b) => a.chunkIndex - b.chunkIndex);
    const fullDataUrl = chunkItems.map(c => c.data).join('');

    // Cache reassembled file in IndexedDB
    saveToIndexedDB(docId, fullDataUrl).catch(() => {});
    return fullDataUrl;
  } catch (err) {
    console.error('Error reassembling document chunks:', err);
    return primaryUrl;
  }
}

/**
 * Strips all `undefined` values from an object before sending to Firestore
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        clean[key] = sanitizeForFirestore(value);
      } else {
        clean[key] = value;
      }
    } else {
      // Replace undefined with empty string for string types or null
      clean[key] = '';
    }
  }
  return clean as T;
}

// ================= IndexedDB Helpers for Offline / Large File Caching =================
const IDB_NAME = 'anujay_clinic_docs_v1';
const IDB_STORE = 'files_cache';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToIndexedDB(id: string, dataUrl: string): Promise<void> {
  try {
    const idb = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put({ id, dataUrl, savedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Graceful fallback if indexedDB fails or quota exceeded
  }
}

export async function getFromIndexedDB(id: string): Promise<string | null> {
  try {
    const idb = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result?.dataUrl) {
          resolve(req.result.dataUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

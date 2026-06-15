const DB_NAME = "homepage-image-store";
const STORE_NAME = "images";
const DB_VERSION = 1;
const IMAGE_REF_PREFIX = "idb:";

const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open image database."));
  });
};

const runTransaction = async <T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore, resolve: (value: T) => void, reject: (error: unknown) => void) => void
): Promise<T> => {
  const database = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);

    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
      database.close();
    };

    run(store, resolve, reject);
  });
};

const createImageRef = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${IMAGE_REF_PREFIX}${crypto.randomUUID()}`;
  }

  const randomPart = Math.random().toString(36).slice(2);
  const timePart = Date.now().toString(36);
  return `${IMAGE_REF_PREFIX}${timePart}-${randomPart}`;
};

const refToKey = (ref: string): string => {
  return ref.startsWith(IMAGE_REF_PREFIX) ? ref.slice(IMAGE_REF_PREFIX.length) : ref;
};

const keyToRef = (key: string): string => {
  return `${IMAGE_REF_PREFIX}${key}`;
};

export const isImageRef = (value: string): boolean => {
  return value.startsWith(IMAGE_REF_PREFIX) && value.length > IMAGE_REF_PREFIX.length;
};

export const saveImageBlob = async (blob: Blob): Promise<string> => {
  const ref = createImageRef();
  const key = refToKey(ref);

  await runTransaction<void>("readwrite", (store, resolve, reject) => {
    const request = store.put(blob, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Failed to store image blob."));
  });

  return ref;
};

export const saveImageFile = async (file: File): Promise<string> => {
  return saveImageBlob(file);
};

export const saveImageBlobWithRefIfMissing = async (ref: string, blob: Blob): Promise<boolean> => {
  if (!isImageRef(ref)) {
    return false;
  }

  const key = refToKey(ref);

  return runTransaction<boolean>("readwrite", (store, resolve, reject) => {
    const getRequest = store.get(key);
    getRequest.onerror = () => reject(getRequest.error ?? new Error("Failed to read existing image blob."));
    getRequest.onsuccess = () => {
      if (getRequest.result instanceof Blob) {
        resolve(false);
        return;
      }

      const putRequest = store.put(blob, key);
      putRequest.onerror = () => reject(putRequest.error ?? new Error("Failed to store image blob."));
      putRequest.onsuccess = () => resolve(true);
    };
  });
};

export const getImageBlob = async (ref: string): Promise<Blob | null> => {
  if (!isImageRef(ref)) {
    return null;
  }

  const key = refToKey(ref);

  return runTransaction<Blob | null>("readonly", (store, resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => {
      const value = request.result;
      resolve(value instanceof Blob ? value : null);
    };
    request.onerror = () => reject(request.error ?? new Error("Failed to read image blob."));
  });
};

export const deleteImage = async (ref: string): Promise<void> => {
  if (!isImageRef(ref)) {
    return;
  }

  const key = refToKey(ref);

  await runTransaction<void>("readwrite", (store, resolve, reject) => {
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Failed to delete image blob."));
  });
};

export const getAllStoredImages = async (): Promise<Array<{ ref: string; blob: Blob }>> => {
  return runTransaction<Array<{ ref: string; blob: Blob }>>("readonly", (store, resolve, reject) => {
    const request = store.openCursor();
    const images: Array<{ ref: string; blob: Blob }> = [];

    request.onerror = () => reject(request.error ?? new Error("Failed to list stored images."));
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(images);
        return;
      }

      const value = cursor.value;
      const key = typeof cursor.key === "string" ? cursor.key : String(cursor.key);
      if (value instanceof Blob) {
        images.push({ ref: keyToRef(key), blob: value });
      }
      cursor.continue();
    };
  });
};

import { get, set, del, keys } from "idb-keyval";

const BLOB_PREFIX = "quackboard-blob:";

function blobKey(storageKey: string): string {
  return `${BLOB_PREFIX}${storageKey}`;
}

export async function storeBlob(
  storageKey: string,
  data: Uint8Array,
): Promise<void> {
  await set(blobKey(storageKey), data);
}

export async function loadBlob(
  storageKey: string,
): Promise<Uint8Array | null> {
  const data = await get<Uint8Array>(blobKey(storageKey));
  return data ?? null;
}

export async function deleteBlob(storageKey: string): Promise<void> {
  await del(blobKey(storageKey));
}

export async function listBlobKeys(): Promise<string[]> {
  const allKeys = await keys();
  return allKeys
    .filter((k) => typeof k === "string" && k.startsWith(BLOB_PREFIX))
    .map((k) => (k as string).slice(BLOB_PREFIX.length));
}

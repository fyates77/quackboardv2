import type { QueryResult } from "@/engine/types";

const MAX_ENTRIES = 50;

/** Simple in-memory LRU-ish cache keyed by SQL string hash. */
class QueryCache {
  private cache = new Map<string, QueryResult>();

  private hash(sql: string): string {
    // FNV-1a 32-bit — fast, good distribution, no crypto overhead
    let h = 0x811c9dc5;
    for (let i = 0; i < sql.length; i++) {
      h ^= sql.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(36);
  }

  get(sql: string): QueryResult | undefined {
    const key = this.hash(sql);
    const result = this.cache.get(key);
    if (result) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, result);
    }
    return result;
  }

  set(sql: string, result: QueryResult): void {
    const key = this.hash(sql);
    this.cache.delete(key); // remove if exists to refresh order
    this.cache.set(key, result);

    // Evict oldest if over limit
    if (this.cache.size > MAX_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const queryCache = new QueryCache();

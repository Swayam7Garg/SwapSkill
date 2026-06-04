import { Redis } from "@upstash/redis";

interface CacheStore {
  get(key: string): Promise<any>;
  set(key: string, value: any, options?: { ex?: number }): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  lpush(key: string, value: string): Promise<number>;
  rpop(key: string): Promise<string | null>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
}

// In-memory fallback implementation of Redis operations
class MemoryCache implements CacheStore {
  private store = new Map<string, any>();
  private expiries = new Map<string, number>();

  private isExpired(key: string): boolean {
    const expiry = this.expiries.get(key);
    if (expiry && expiry < Date.now()) {
      this.store.delete(key);
      this.expiries.delete(key);
      return true;
    }
    return false;
  }

  async get(key: string): Promise<any> {
    if (this.isExpired(key)) return null;
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: any, options?: { ex?: number }): Promise<void> {
    this.store.set(key, value);
    if (options?.ex) {
      this.expiries.set(key, Date.now() + options.ex * 1000);
    } else {
      this.expiries.delete(key);
    }
  }

  async incr(key: string): Promise<number> {
    if (this.isExpired(key)) {
      this.store.set(key, 0);
    }
    const val = (Number(this.store.get(key)) || 0) + 1;
    this.store.set(key, val);
    return val;
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (this.store.has(key)) {
      this.expiries.set(key, Date.now() + seconds * 1000);
    }
  }

  // Queue operations (List)
  async lpush(key: string, value: string): Promise<number> {
    if (this.isExpired(key) || !Array.isArray(this.store.get(key))) {
      this.store.set(key, []);
    }
    const list = this.store.get(key) as string[];
    list.unshift(value); // Push to the front
    return list.length;
  }

  async rpop(key: string): Promise<string | null> {
    if (this.isExpired(key)) return null;
    const list = this.store.get(key);
    if (!Array.isArray(list) || list.length === 0) return null;
    return list.pop() ?? null; // Pop from the back
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (this.isExpired(key)) return [];
    const list = this.store.get(key);
    if (!Array.isArray(list)) return [];
    // Convert negative indices
    const len = list.length;
    const actualStart = start < 0 ? len + start : start;
    const actualStop = stop < 0 ? len + stop : stop;
    return list.slice(actualStart, actualStop + 1);
  }
}

let redisClient: CacheStore;

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (url && token && url !== "your-upstash-redis-url" && token !== "your-upstash-redis-token") {
  console.log("Connecting to Upstash Redis...");
  try {
    redisClient = new Redis({
      url,
      token,
    }) as unknown as CacheStore;
  } catch (error) {
    console.warn("Failed to initialize Upstash Redis, falling back to MemoryCache:", error);
    redisClient = new MemoryCache();
  }
} else {
  console.log("Upstash Redis credentials missing. Using local In-Memory Cache/Queue.");
  redisClient = new MemoryCache();
}

export { redisClient as redis };
export type { CacheStore };

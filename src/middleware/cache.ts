import type { MiddlewareHandler } from "hono";
import * as redisModule from "../utils/redis";

const redis = redisModule as {
  get: (key: string) => Promise<string | null>;
  setEx: (key: string, duration: number, value: string) => Promise<void>;
  enabled: boolean;
};

const getCacheKey = (url: URL): string => {
  const key = url.pathname;
  const entries = [...url.searchParams.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );

  if (entries.length === 0) {
    return key;
  }

  const query = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return `${key}?${query}`;
};

export const cache = (duration: number): MiddlewareHandler => {
  return async (c, next) => {
    if (!redis.enabled) {
      await next();
      return;
    }

    try {
      const key = getCacheKey(new URL(c.req.url));
      const cachedResponse = await redis.get(key);

      if (cachedResponse) {
        return c.json(JSON.parse(cachedResponse));
      }

      await next();

      const contentType = c.res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        return;
      }

      const bodyText = await c.res.clone().text();
      await redis.setEx(key, duration, bodyText);
    } catch (error) {
      console.error("Cache error:", error);
      await next();
    }
  };
};

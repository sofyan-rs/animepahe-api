import type { MiddlewareHandler } from "hono";
import * as redisModule from "../utils/redis";

const redis = redisModule as {
  get: (key: string) => Promise<string | null>;
  setEx: (key: string, duration: number, value: string) => Promise<void>;
  enabled: boolean;
};

const RATE_LIMIT_MAX = Number.parseInt(process.env.RATE_LIMIT_MAX ?? "100", 10);
const RATE_LIMIT_WINDOW = Number.parseInt(process.env.RATE_LIMIT_WINDOW ?? "900", 10);
const RATE_LIMIT_SECRET = process.env.RATE_LIMIT_SECRET;

export const rateLimiter: MiddlewareHandler = async (c, next) => {
  if (!RATE_LIMIT_SECRET || !redis.enabled) {
    if (!redis.enabled) {
      console.warn("Redis not enabled, skipping rate limiting");
    }
    await next();
    return;
  }

  const path = new URL(c.req.url).pathname;
  if (path === "/api/health" || path === "/api/status") {
    await next();
    return;
  }

  try {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "unknown";

    if (ip === "unknown") {
      console.warn("Could not determine client IP address");
      await next();
      return;
    }

    const key = `rate-limit:${ip}:${Math.floor(Date.now() / 1000 / RATE_LIMIT_WINDOW)}`;
    const currentCount = await redis.get(key);

    if (currentCount === null) {
      await redis.setEx(key, RATE_LIMIT_WINDOW, "1");
      c.header("X-RateLimit-Remaining", String(RATE_LIMIT_MAX - 1));
      c.header("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
      c.header(
        "X-RateLimit-Reset",
        new Date(Date.now() + RATE_LIMIT_WINDOW * 1000).toISOString(),
      );
      await next();
      return;
    }

    const count = Number.parseInt(currentCount, 10);
    if (count >= RATE_LIMIT_MAX) {
      return c.json(
        {
          error: "Rate limit exceeded. Please try again later.",
          message: `Too many requests from this IP. Limit is ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW} seconds.`,
          retryAfter: RATE_LIMIT_WINDOW,
        },
        429,
      );
    }

    await redis.setEx(key, RATE_LIMIT_WINDOW, String(count + 1));
    c.header("X-RateLimit-Remaining", String(RATE_LIMIT_MAX - count - 1));
    c.header("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
    c.header(
      "X-RateLimit-Reset",
      new Date(Date.now() + RATE_LIMIT_WINDOW * 1000).toISOString(),
    );

    await next();
  } catch (error) {
    console.error("Rate limiting error:", error);
    await next();
  }
};

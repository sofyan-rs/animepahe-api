import Redis from "redis";

// Check if Redis should be enabled
const REDIS_ENABLED = !!process.env.REDIS_URL;

type RedisClient = ReturnType<typeof Redis.createClient>;
let redisClient: RedisClient | null = null;

if (REDIS_ENABLED) {
  redisClient = Redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.log("Max reconnection attempts reached");
          return new Error("Max reconnection attempts reached");
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  redisClient.on("error", (err: Error) => {
    console.error("Redis Client Error:", err.message);
  });

  // Connect to Redis
  (async () => {
    try {
      await redisClient?.connect();
      console.log("\x1b[32m%s\x1b[0m", "Redis Client Connected");
    } catch (error) {
      console.error("Redis connection failed:", (error as Error).message);
    }
  })();
}

const get = async (key: string): Promise<string | null> => {
  if (!REDIS_ENABLED || !redisClient) return null;
  try {
    const value = await redisClient.get(key);
    if (value === null) return null;
    return typeof value === "string" ? value : value.toString();
  } catch (error) {
    console.error("Redis get error:", (error as Error).message);
    return null;
  }
};

const setEx = async (
  key: string,
  duration: number,
  value: string,
): Promise<void> => {
  if (!REDIS_ENABLED || !redisClient) return;
  try {
    await redisClient.setEx(key, duration, value);
  } catch (error) {
    console.error("Redis setEx error:", (error as Error).message);
  }
};

const enabled = REDIS_ENABLED;

export { redisClient, get, setEx, enabled };

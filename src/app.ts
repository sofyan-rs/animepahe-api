import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import configModule from "./utils/config";
import { handleAppError } from "./middleware/errorHandler";
import { rateLimiter } from "./middleware/rateLimiter";
import { testRoutes } from "./routes/testRoutes";
import { homeRoutes } from "./routes/homeRoutes";
import { queueRoutes } from "./routes/queueRoutes";
import { animeListRoutes } from "./routes/animeListRoutes";
import { animeInfoRoutes } from "./routes/animeInfoRoutes";
import { playRoutes } from "./routes/playRoutes";

const Config = configModule as {
  validate: () => void;
  loadFromEnv: () => void;
  setHostUrl: (protocol: string, host: string) => void;
};

try {
  Config.validate();
  Config.loadFromEnv();
  console.log("\x1b[36m%s\x1b[0m", "Configuration set!.");
} catch (error) {
  console.error((error as Error).message);
  throw error;
}

const corsMiddleware: MiddlewareHandler = async (c, next) => {
  const requestOrigin = c.req.header("origin");
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : ["*"];

  let allowOrigin = "*";
  if (requestOrigin && !allowedOrigins.includes("*")) {
    if (!allowedOrigins.includes(requestOrigin)) {
      throw new Error("Not allowed by CORS");
    }
    allowOrigin = requestOrigin;
  } else if (requestOrigin) {
    allowOrigin = requestOrigin;
  }

  c.header("Access-Control-Allow-Origin", allowOrigin);
  c.header("Access-Control-Allow-Credentials", "true");
  c.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  c.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );

  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  await next();
};

const setHostUrl: MiddlewareHandler = async (c, next) => {
  const url = new URL(c.req.url);
  const protocol =
    c.req.header("x-forwarded-proto") ?? url.protocol.replace(":", "") ?? "https";
  const host = c.req.header("host") ?? url.host;
  Config.setHostUrl(protocol, host);
  await next();
};

export const app = new Hono();

app.use("*", corsMiddleware);
app.use("*", setHostUrl);
app.use("*", rateLimiter);

app.route("/api", testRoutes);
app.route("/api", homeRoutes);
app.route("/api", queueRoutes);
app.route("/api", animeListRoutes);
app.route("/api", animeInfoRoutes);
app.route("/api", playRoutes);

app.notFound((c) =>
  c.json(
    {
      status: 404,
      message:
        "Route not found. Please check the API documentation at https://github.com/ElijahCodes12345/animepahe-api",
    },
    404,
  ),
);

app.onError((error, c) => handleAppError(error, c));

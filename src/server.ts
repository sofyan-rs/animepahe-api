import { app } from "./app";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`API running on http://localhost:${port}`);

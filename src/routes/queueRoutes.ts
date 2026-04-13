import { Hono } from "hono";
import QueueModel from "../models/queueModel";
import { CustomError } from "../middleware/errorHandler";
import { cache } from "../middleware/cache";

export const queueRoutes = new Hono();

queueRoutes.get("/queue", cache(30), async (c) => {
  const queue = await QueueModel.getQueue();
  if (!queue) {
    throw new CustomError("Failed to fetch queue data", 404);
  }
  return c.json(queue);
});

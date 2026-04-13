import { Hono } from "hono";
import AnimeListModel from "../models/animeListModel";
import { CustomError } from "../middleware/errorHandler";
import { cache } from "../middleware/cache";

export const animeListRoutes = new Hono();

animeListRoutes.get("/anime", cache(18000), async (c) => {
  const tab = c.req.query("tab");
  const animeList = await AnimeListModel.getAnimeList(tab, undefined, undefined);
  if (!animeList) {
    throw new CustomError("Failed to fetch anime list", 404);
  }
  return c.json(animeList);
});

animeListRoutes.get("/anime/:tag1/:tag2", cache(18000), async (c) => {
  const tab = c.req.query("tab");
  const { tag1, tag2 } = c.req.param();
  if (!tag1 && !tag2) {
    throw new CustomError("At least one tag is required", 400);
  }
  const animeList = await AnimeListModel.getAnimeList(tab, tag1, tag2);
  if (!animeList) {
    throw new CustomError("No anime found with these tags", 404);
  }
  return c.json(animeList);
});

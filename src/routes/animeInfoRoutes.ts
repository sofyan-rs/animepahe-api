import { Hono } from "hono";
import AnimeInfoModel from "../models/animeInfoModel";
import { CustomError } from "../middleware/errorHandler";
import { cache } from "../middleware/cache";

export const animeInfoRoutes = new Hono();

animeInfoRoutes.get("/:id", cache(86400), async (c) => {
  const animeId = c.req.param("id");
  if (!animeId) {
    throw new CustomError("Anime ID is required", 400);
  }

  const animeInfo = await AnimeInfoModel.getAnimeInfo(animeId);
  if (!animeInfo) {
    throw new CustomError("Anime not found", 404);
  }

  return c.json(animeInfo);
});

animeInfoRoutes.get("/:id/releases", cache(86400), async (c) => {
  const animeId = c.req.param("id");
  const sort = c.req.query("sort") ?? "episode_desc";
  const page = Number.parseInt(c.req.query("page") ?? "1", 10) || 1;

  if (!animeId) {
    throw new CustomError("Anime ID is required", 400);
  }

  const animeReleases = await AnimeInfoModel.getAnimeReleases(animeId, sort, page);
  if (!animeReleases) {
    throw new CustomError("No releases found", 404);
  }

  return c.json(animeReleases);
});

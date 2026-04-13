import { Hono } from "hono";
import HomeModel from "../models/homeModel";
import { CustomError } from "../middleware/errorHandler";
import { cache } from "../middleware/cache";

export const homeRoutes = new Hono();

homeRoutes.get("/airing", cache(30), async (c) => {
  const page = Number.parseInt(c.req.query("page") ?? "1", 10) || 1;
  const airingAnime = await HomeModel.getAiringAnime(page);
  if (!airingAnime) {
    throw new CustomError("No airing anime found", 404);
  }
  return c.json(airingAnime);
});

homeRoutes.get("/search", cache(120), async (c) => {
  const query = c.req.query("q");
  const page = Number.parseInt(c.req.query("page") ?? "1", 10) || 1;

  if (!query) {
    throw new CustomError("Search query is required", 400);
  }

  const searchResults = await HomeModel.searchAnime(query, page);
  if (!searchResults) {
    throw new CustomError("No results found", 404);
  }

  return c.json(searchResults);
});

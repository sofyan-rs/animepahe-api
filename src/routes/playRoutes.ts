import { Hono } from "hono";
import PlayModel from "../models/playModel";
import { CustomError } from "../middleware/errorHandler";
import { cache } from "../middleware/cache";

export const playRoutes = new Hono();

playRoutes.get("/play/download-links", cache(3600), async (c) => {
  const url = c.req.query("url");
  if (!url) {
    throw new CustomError("Url is required", 400);
  }
  const links = await PlayModel.getDownloadLinks(url);
  return c.json(links);
});

playRoutes.get("/play/:id", cache(3600), async (c) => {
  const id = c.req.param("id");
  const episodeId = c.req.query("episodeId");
  const downloads = c.req.query("downloads");
  if (!id || !episodeId) {
    throw new CustomError("Both id and episodeId are required", 400);
  }
  const includeDownloads =
    downloads === undefined || downloads === "true" || downloads === "1";
  const links = await PlayModel.getStreamingLinks(id, episodeId, includeDownloads);
  return c.json(links);
});

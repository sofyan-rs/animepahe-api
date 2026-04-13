import DataProcessor from "../utils/dataProcessor";
import Animepahe from "../scrapers/animepahe";
import AnimeInfoModel from "./animeInfoModel";
import viewsStore from "../utils/viewsStore";
import { CustomError } from "../middleware/errorHandler";

class HomeModel {
  static async getAiringAnime(page: number) {
    const results = await Animepahe.getData("airing", { page });

    if (!results || !results.data) {
      throw new CustomError("No airing anime data found", 404);
    }

    const processed = DataProcessor.processApiData(results, "airing") as {
      paginationInfo?: Record<string, unknown>;
      data: Array<Record<string, unknown>>;
    };

    return this.enrichAiringPoster(processed);
  }

  static async searchAnime(query: string, page: number) {
    console.log(page);
    if (!query) {
      throw new CustomError("Search query is required", 400);
    }

    const results = await Animepahe.getData("search", { query, page });

    if (!results || !results.data) {
      throw new CustomError("No search results found", 404);
    }

    return DataProcessor.processApiData(results, "search");
  }

  static async getTopAiringAnime(page: number, limit: number) {
    const airing = (await this.getAiringAnime(page)) as {
      paginationInfo?: Record<string, unknown>;
      data: Array<Record<string, unknown>>;
    };

    const sessions = (airing.data || [])
      .map((item) => (typeof item.session === "string" ? item.session : null))
      .filter((session): session is string => Boolean(session));

    const viewCounts = viewsStore.getViewCounts(sessions);
    const ranked = (airing.data || [])
      .map((item) => {
        const session = typeof item.session === "string" ? item.session : "";
        return {
          ...item,
          views: viewCounts.get(session) ?? 0,
        };
      })
      .sort((a, b) => (b.views as number) - (a.views as number))
      .slice(0, limit);

    return {
      paginationInfo: airing.paginationInfo,
      data: ranked,
    };
  }

  static async enrichAiringPoster(processed: {
    paginationInfo?: Record<string, unknown>;
    data: Array<Record<string, unknown>>;
  }) {
    const sessionInfoCache = new Map<string, Promise<string | null>>();

    const enrichedData = await Promise.all(
      (processed.data || []).map(async (item) => {
        if (item.poster) {
          return item;
        }

        const session = typeof item.session === "string" ? item.session : null;
        if (!session) {
          return item;
        }

        if (!sessionInfoCache.has(session)) {
          sessionInfoCache.set(
            session,
            AnimeInfoModel.getAnimeInfo(session)
              .then((animeInfo) => {
                if (!animeInfo || typeof animeInfo !== "object") {
                  return null;
                }

                const image = (animeInfo as { image?: unknown }).image;
                return typeof image === "string" ? image : null;
              })
              .catch(() => null),
          );
        }

        const fallbackPoster = await sessionInfoCache.get(session);
        return {
          ...item,
          poster: fallbackPoster,
        };
      }),
    );

    return {
      ...processed,
      data: enrichedData,
    };
  }
}

export default HomeModel;

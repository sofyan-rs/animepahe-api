import DataProcessor from "../utils/dataProcessor";
import Animepahe from "../scrapers/animepahe";
import AnimeInfoModel from "./animeInfoModel";
import viewsStore from "../utils/viewsStore";
import { CustomError } from "../middleware/errorHandler";

class HomeModel {
  static readonly POPULAR_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

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

  static async getPopularSeries(page: number, limit: number) {
    const currentPage = Math.max(page, 1);
    const perPage = Math.max(limit, 1);
    const offset = (currentPage - 1) * perPage;

    const { total, rows } = viewsStore.getTopViewed(perPage, offset);
    const sessions = rows.map((row) => row.session);
    const cachedSeries = viewsStore.getCachedSeries(sessions);
    const now = Date.now();

    const series = await Promise.all(
      rows.map(async (row) => {
        const cached = cachedSeries.get(row.session);
        const cachedAge = cached
          ? now - new Date(cached.updatedAt).getTime()
          : Number.POSITIVE_INFINITY;
        const shouldRefresh = !cached || !Number.isFinite(cachedAge) || cachedAge > this.POPULAR_CACHE_TTL_MS;

        if (!shouldRefresh) {
          return {
            ...cached.payload,
            session: row.session,
            views: row.views,
          };
        }

        try {
          const animeInfo = await AnimeInfoModel.getAnimeInfo(row.session);
          if (!animeInfo || typeof animeInfo !== "object") return null;
          viewsStore.upsertCachedSeries(row.session, animeInfo as Record<string, unknown>);
          return {
            ...(animeInfo as Record<string, unknown>),
            session: row.session,
            views: row.views,
          };
        } catch {
          if (cached) {
            return {
              ...cached.payload,
              session: row.session,
              views: row.views,
            };
          }
          return null;
        }
      }),
    );

    const data = series.filter((item): item is NonNullable<typeof item> => item !== null);
    const lastPage = Math.max(Math.ceil(total / perPage), 1);
    const from = total === 0 ? 0 : offset + 1;
    const to = Math.min(offset + data.length, total);

    return {
      paginationInfo: {
        total,
        perPage,
        currentPage,
        lastPage,
        from,
        to,
      },
      data,
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

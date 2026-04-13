import AnimeListModel from '../models/animeListModel';
import { CustomError } from '../middleware/errorHandler';

type ControllerRequest = {
    query: Record<string, string | undefined>;
    params: Record<string, string | undefined>;
};

type ControllerResponse = {
    json: (payload: unknown) => unknown;
};

type Next = (error?: unknown) => void;

class AnimeListController {
    static async getAllAnime(req: ControllerRequest, res: ControllerResponse, next: Next) {
        try {
            const { tab } = req.query;
            const animeList = await AnimeListModel.getAnimeList(tab, undefined, undefined);

            if (!animeList) {
                throw new CustomError('Failed to fetch anime list', 404);
            }

            return res.json(animeList);
        } catch (error) {
            next(error);
        }
    }

    static async getAnimeByTags(req: ControllerRequest, res: ControllerResponse, next: Next) {
        try {
            const { tab } = req.query;
            const { tag1, tag2 } = req.params;

            if (!tag1 && !tag2) {
                throw new CustomError('At least one tag is required', 400);
            }

            const animeList = await AnimeListModel.getAnimeList(tab, tag1, tag2);

            if (!animeList) {
                throw new CustomError('No anime found with these tags', 404);
            }

            return res.json(animeList);
        } catch (error) {
            next(error);
        }
    }
}

export default AnimeListController;

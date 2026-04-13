import AnimeInfoModel from '../models/animeInfoModel';
import { CustomError } from '../middleware/errorHandler';

type ControllerRequest = {
    query: Record<string, string | undefined>;
    params: Record<string, string | undefined>;
};

type ControllerResponse = {
    json: (payload: unknown) => unknown;
};

type Next = (error?: unknown) => void;

class AnimeInfoController {
    static async getAnimeInfo(req: ControllerRequest, res: ControllerResponse, next: Next) {
        try {
            const animeId = req.params.id;
            
            if (!animeId) {
                throw new CustomError('Anime ID is required', 400);
            }

            const animeInfo = await AnimeInfoModel.getAnimeInfo(animeId);
            
            if (!animeInfo) {
                throw new CustomError('Anime not found', 404);
            }

            return res.json(animeInfo);
        } catch (error) {
            next(error);
        }
    }
    
    static async getAnimeReleases(req: ControllerRequest, res: ControllerResponse, next: Next) {
        try {
            const animeId = req.params.id;
            const sort = req.query.sort || 'episode_desc';
            const page = parseInt(req.query.page, 10) || 1; 

            if (!animeId) {
                throw new CustomError('Anime ID is required', 400);
            }

            const animeReleases = await AnimeInfoModel.getAnimeReleases(animeId, sort, page);
            
            if (!animeReleases) {
                throw new CustomError('No releases found', 404);
            }

            return res.json(animeReleases);
        } catch (error) {
            next(error);
        }
    }
}

export default AnimeInfoController;

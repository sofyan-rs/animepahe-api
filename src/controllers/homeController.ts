import HomeModel from '../models/homeModel';
import { CustomError } from '../middleware/errorHandler';

type ControllerRequest = {
    query: Record<string, string | undefined>;
};

type ControllerResponse = {
    json: (payload: unknown) => unknown;
};

type Next = (error?: unknown) => void;

class HomeController {
    static async getAiringAnime(req: ControllerRequest, res: ControllerResponse, next: Next) {
        try {
            const page = parseInt(req.query.page, 10) || 1; 
            const airingAnime = await HomeModel.getAiringAnime(page);
            
            if (!airingAnime) {
                throw new CustomError('No airing anime found', 404);
            }
            
            return res.json(airingAnime);
        } catch (error) {
            next(error);
        }
    }

    static async searchAnime(req: ControllerRequest, res: ControllerResponse, next: Next) {
        try {
            const query = req.query.q;
            const page = parseInt(req.query.page, 10) || 1; 
            
            if (!query) {
                throw new CustomError('Search query is required', 400);
            }

            const searchResults = await HomeModel.searchAnime(query, page);
            
            if (!searchResults) {
                throw new CustomError('No results found', 404);
            }
            
            return res.json(searchResults);
        } catch (error) {
            next(error);
        }
    }
}

export default HomeController;

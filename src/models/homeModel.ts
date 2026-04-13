import DataProcessor from '../utils/dataProcessor';
import Animepahe from '../scrapers/animepahe';
import { CustomError } from '../middleware/errorHandler';

class HomeModel {
    static async getAiringAnime(page: number) {
        const results = await Animepahe.getData("airing", { page });

        if (!results || !results.data) {
            throw new CustomError('No airing anime data found', 404);
        }

        return DataProcessor.processApiData(results);
    }

    static async searchAnime(query: string, page: number) {
        console.log(page);
        if (!query) {
            throw new CustomError('Search query is required', 400);
        }

        const results = await Animepahe.getData("search", { query, page });

        if (!results || !results.data) {
            throw new CustomError('No search results found', 404);
        }

        return DataProcessor.processApiData(results, 'search');
    }
}

export default HomeModel;

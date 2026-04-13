import DataProcessor from '../utils/dataProcessor';
import Animepahe from '../scrapers/animepahe';
import { CustomError } from '../middleware/errorHandler';

type QueueResult = {
    data?: Array<Record<string, unknown>>;
};

class QueueModel {
    static async getQueue() {
        const results = (await Animepahe.getData("queue", {})) as QueueResult | null;

        if (!results) {
            throw new CustomError('Failed to fetch queue data', 503);
        }

        if (typeof results === 'object' && !results.data) {
            results.data = [];
        }

        return DataProcessor.processApiData(results, "queue", false);
    }
}

export default QueueModel;

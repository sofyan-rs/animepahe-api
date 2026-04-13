import QueueModel from '../models/queueModel';
import { CustomError } from '../middleware/errorHandler';

type ControllerResponse = {
    json: (payload: unknown) => unknown;
};

type Next = (error?: unknown) => void;

class QueueController {
    static async getQueue(_req: unknown, res: ControllerResponse, next: Next) {
        try {
            const queue = await QueueModel.getQueue();
            
            if (!queue) {
                throw new CustomError('Failed to fetch queue data', 404);
            }

            return res.json(queue);
        } catch (error) {
            next(error);
        }
    }
}

export default QueueController;

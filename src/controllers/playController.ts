import PlayModel from '../models/playModel';
import { CustomError } from '../middleware/errorHandler';

type ControllerRequest = {
    query: Record<string, string | undefined>;
    params: Record<string, string | undefined>;
};

type ControllerResponse = {
    json: (payload: unknown) => unknown;
};

type Next = (error?: unknown) => void;

class PlayController {
    static async getStreamingLinks(req: ControllerRequest, res: ControllerResponse, next: Next) {
        try {
            const { id } = req.params;
            const { episodeId, downloads } = req.query;

            if (!id || !episodeId) {
                throw new CustomError('Both id and episodeId are required', 400);
            }

            // Parse downloads query parameter (defaults to true)
            // user can pass ?downloads=false or ?downloads=0 to skip downloads
            const includeDownloads = downloads === undefined || downloads === 'true' || downloads === '1';

            // console.log(`[PlayController] Request query downloads: '${downloads}' -> includeDownloads: ${includeDownloads}`);

            const links = await PlayModel.getStreamingLinks(id, episodeId, includeDownloads);
            
            return res.json(links);
        } catch (error) {
            next(error);
        }
    }

    static async getDownloadLinks(req: ControllerRequest, res: ControllerResponse, next: Next) {
        try {
            const { url } = req.query;

            if (!url) {
                throw new CustomError('Url is required', 400);
            }

            const links = await PlayModel.getDownloadLinks(url);
            return res.json(links);
        } catch (error) {
            next(error);
        }
    }
}

export default PlayController;

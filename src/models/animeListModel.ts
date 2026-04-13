import cheerio from 'cheerio';
import DataProcessor from '../utils/dataProcessor';
import Animepahe from '../scrapers/animepahe';
import { CustomError } from '../middleware/errorHandler';

class AnimeListModel {
    static async getAnimeList(tab?: string, tag1?: string, tag2?: string) {
        const results = await Animepahe.getData("animeList", { tag1, tag2 }, false);
        
        if (results?.data) {
            return DataProcessor.processApiData(results);
        }
        
        return this.scrapeAnimeListPage(results, tab);
    }

    static async scrapeAnimeListPage(pageHtml: string, tab?: string) {
        if (!pageHtml) {
            throw new CustomError('Failed to fetch anime list page', 503);
        }

        const $ = cheerio.load(pageHtml);
        const animeList = [];
        
        const extractSessionFromUrl = (url?: string | null) => {
            if (!url) return null;
            return url.replace(/^\/anime\//, '').replace(/^anime\//, '').replace(/^\/+|\/+$/g, '') || null;
        };

        const processPane = (pane) => {
            $(pane).find('div.col-12.col-md-6').each((j, entry) => {
                const $entry = $(entry);
                const $link = $entry.find('a');
                const href = $link.attr('href') || null;
                const badges = $entry.find('span.badge').map((_, el) => $(el).text().trim()).get().filter(Boolean);
                const session = extractSessionFromUrl(href);

                animeList.push({
                    title: $link.attr('title') || $link.text().trim(),
                    url: href,
                    type: badges[0] || null,
                    session
                });
            });
        };

        if (typeof tab !== 'undefined') {
            const targetId = tab === '#' || tab === 'hash' ? 'hash' : tab.toUpperCase();
            const $pane = $(`div.tab-pane#${targetId}`);
            
            if (!$pane.length) {
                throw new CustomError(`No content found for tab: ${tab}`, 404);
            }
            
            processPane($pane);
        } else {
            $('div.tab-content div.tab-pane').each((i, pane) => {
                processPane(pane);
            });
        }

        if (animeList.length === 0) {
            throw new CustomError('No anime entries found', 404);
        }

        return animeList;
    }
}

export default AnimeListModel;

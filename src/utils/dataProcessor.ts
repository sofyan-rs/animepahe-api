import Config from './config';

type ApiResponse = {
    _id?: string;
    data?: Array<Record<string, unknown>>;
    total?: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
    next_page_url?: string | null;
    prev_page_url?: string | null;
    from?: number;
    to?: number;
};

type DataType = 'airing' | 'search' | 'releases' | 'queue';

class DataProcessor {
    static processApiData(apiData: ApiResponse, type: DataType = 'airing', include = true) {

        const items = apiData.data || [];
        
        if (!Array.isArray(items)) {
            console.error('Unexpected API response format:', JSON.stringify(apiData).substring(0, 200));
            throw new Error('Unexpected API response format');
        }

        let paginationInfo;
        include ? paginationInfo = this._extractPaginationInfo(apiData, type) : paginationInfo;

        const dataProcessors: Record<DataType, (items: Array<Record<string, unknown>>) => Array<Record<string, unknown>>> = {
            'airing': this._processAiringData,
            'search': this._processSearchData,
            'releases': this._processReleaseData,
            'queue': this._processQueueData,
        };
        const releasesItems = items as Array<Record<string, unknown>> & { _parentId?: string };
        if (type === 'releases') releasesItems._parentId = apiData._id;

        const processor = dataProcessors[type] ?? this._processGenericData;
        
        const processedData = processor(releasesItems);
        
        if (processedData.length > 0) {
            console.log(`Processed ${processedData.length} items of type: ${type}`);
            // console.log("Sample:", processedData[0]);
        }
        
        return paginationInfo ? { paginationInfo, data: processedData } : { data: processedData };
    }
    
    static _extractPaginationInfo(apiData: ApiResponse, type: DataType) {
        const {
            _id, 
            total, per_page, current_page, last_page, 
            next_page_url, prev_page_url, from, to 
        } = apiData;

        const urlPrefix = _id ? `${_id}/${type}?` : `${type}?`;

        return {
            ...(total != null && { total }),
            ...(per_page != null && { perPage: per_page }),
            ...(current_page != null && { currentPage: current_page }),
            ...(last_page != null && { lastPage: last_page }),
            ...(next_page_url != null && { 
                nextPageUrl: next_page_url.replace(
                    new RegExp(`^(${Config.baseUrl}|/)`),
                    Config.hostUrl
                ).replace('api?', `api/${urlPrefix}`)
            }),
            ...(prev_page_url != null && { 
                prevPageUrl: prev_page_url.replace(
                    new RegExp(`^(${Config.baseUrl}|/)`),
                    Config.hostUrl
                ).replace('api?', `api/${urlPrefix}`)  
            }),
            ...(from != null && { from }),
            ...(to != null && { to })
        };
    }

    static _processAiringData(items: Array<Record<string, unknown>>) {
        return items.map((item) => ({
            id: item.id ?? null,
            anime_id: item.anime_id ?? null,
            title: item.anime_title ?? null,
            episode: item.episode ?? null,
            episode2: item.episode2 ?? null,
            edition: item.edition ?? null,
            fansub: item.fansub ?? null,
            image: item.snapshot ?? null,
            poster: item.thumb_cover ?? item.anime_cover ?? item.anime_poster ?? item.poster ?? null,
            disc: item.disc ?? null,
            session: item.anime_session ?? null,
            link: (item.session ? `${Config.getUrl('animeInfo', String(item.session))}` : '') || null,
            filler: item.filler ?? null,
            created_at: item.created_at ?? null,
            completed: item.completed ?? 1
        }));
    }
    
    static _processSearchData(items: Array<Record<string, unknown>>) {
        return items.map((item) => ({
            id: item.id ?? null,
            title: item.title ?? null,
            status: item.status ?? null,
            type: item.type ?? null,
            episodes: item.episodes ?? null,
            score: item.score ?? null,
            year: item.year ?? null,
            season: item.season ?? null,
            poster: item.poster ?? null,
            session: item.session ?? null,
            link: (item.session ? `${Config.getUrl('animeInfo', String(item.session))}` : '') || null,
        }));
    }

    static _processReleaseData(items: Array<Record<string, unknown>> & { _parentId?: string }) {
        return items.map((item) => ({
            id: item.id ?? null,
            anime_id: item.anime_id ?? null,
            episode: item.episode ?? null,
            episode2: item.episode2 ?? null,
            edition: item.edition ?? null,
            title: item.title ?? null,
            snapshot: item.snapshot ?? null,
            disc: item.disc ?? null,
            audio: item.audio ?? null,
            duration: item.duration ?? null,
            session: item.session ?? null,
            link: (item.session ? `${Config.getUrl('play', items._parentId ?? '', String(item.session))}` : '') || null,
            filler: item.filler ?? null,
            created_at: item.created_at ?? null
        }))
    }
    
    static _processQueueData(items: Array<Record<string, unknown>>) {
        return items.map((item) => ({
            title: item.title ?? null,
            episode: item.episode ?? null,
            resolution: item.resolution ?? null,
            filesize: item.filesize ?? null,
            fansub: item.fansub ?? null,
            audio: item.audio ?? null,
            progress: item.progress ?? null,
            instant: item.instant ?? null,
            current_duration: item.current_duration ?? null,
            original: item.original_duration ?? null,
            session: item.session ?? null,
            published: item.published ?? null,
        }));
    }
    
    // For unknown data types 
    static _processGenericData(items: Array<Record<string, unknown>>) {
        return items.map((item) => {
            // Clone the item but ensure no null property values
            const processed: Record<string, unknown> = {};
            Object.keys(item).forEach((key) => {
                processed[key] = item[key] ?? null;
            });
            return processed;
        });
    }
}

export default DataProcessor;

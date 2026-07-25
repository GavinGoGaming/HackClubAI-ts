const DEFAULTS = {
    BASE_URL: `https://ai.hackclub.com`,
    ROUTES: {
        chat: `/proxy/v1/chat/completions`,
        responses: `/proxy/v1/responses`,
        embeddings: `/proxy/v1/embeddings`,
        embeddings_models: `/proxy/v1/embeddings/models`,
        models: `/proxy/v1/models`,
        stats: `/proxy/v1/stats`,
        moderations: `/proxy/v1/moderations`,
        ocr: `/proxy/v1/ocr`,
        exa_search: `/proxy/v1/exa/search`,
        exa_findSimilar: `/proxy/v1/exa/findSimilar`,
        exa_answer: `/proxy/v1/exa/answer`,
        exa_contents: `/proxy/v1/exa/contents`
    }
};

export default function createConfig(AI_API_KEY: string, BASE_URL?: string | undefined): Config {
    return {
        ...DEFAULTS,
        AI_API_KEY,
        BASE_URL: BASE_URL || DEFAULTS.BASE_URL
    };
}

export type RouteType = "chat" | "responses" | "embeddings" | "embeddings_models" | "models" | "stats" | "moderations" | "ocr" | "exa_search" | "exa_findSimilar" | "exa_answer" | "exa_contents";
export interface Config {
    AI_API_KEY: string;
    BASE_URL: string;
    ROUTES: Record<RouteType, string>;
}
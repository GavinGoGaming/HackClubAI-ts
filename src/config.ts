import dotenv from "dotenv";
dotenv.config();

const AI_API_KEY = process.env.HACKCLUB_AI;
if(!AI_API_KEY) {
    throw new Error("HACKCLUB_AI environment variable is not set.");
}

const CONFIG: Config = {
    AI_API_KEY,
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

export type RouteType = "chat" | "responses" | "embeddings" | "embeddings_models" | "models" | "stats" | "moderations" | "ocr" | "exa_search" | "exa_findSimilar" | "exa_answer" | "exa_contents";
export interface Config {
    AI_API_KEY: string;
    BASE_URL: string;
    ROUTES: Record<RouteType, string>;
}

export default CONFIG;
import type { Config } from "./config.js";

export default class HCAIRequestor {
    constructor(private CONFIG: Config) {
        this.CONFIG = CONFIG;
    }
    async request(endpoint: string, data: any) {
        const res = await fetch(this.CONFIG.BASE_URL + endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.CONFIG.AI_API_KEY}`,
            },
            body: JSON.stringify(data),
        });
        const json = await res.json();
        return json;
    }
    requestSSE(endpoint: string, data: any, callbacks: {
        onMessage: (event: MessageEvent) => void;
        onError?: (err: any) => void;
    }) {
        const controller = new AbortController();

        (async () => {
            try {
                const res = await fetch(this.CONFIG.BASE_URL + endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${this.CONFIG.AI_API_KEY}`,
                    },
                    body: JSON.stringify({
                        ...data,
                        stream: true,
                    }),
                    signal: controller.signal,
                });

                if (!res.ok || !res.body) {
                    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
                }

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const chunks = buffer.split("\n\n");
                    buffer = chunks.pop() ?? "";

                    for (const chunk of chunks) {
                        const trimmedChunk = chunk.trim();
                        if (!trimmedChunk) continue;

                        // Skip SSE comments/keep-alives (e.g. OpenRouter's ": OPENROUTER PROCESSING")
                        if (trimmedChunk.startsWith(":")) continue;

                        if (!trimmedChunk.startsWith("data:")) continue;

                        const line = trimmedChunk.replace(/^data:\s*/, "").trim();
                        if (!line) continue;

                        if (line === "[DONE]") {
                            controller.abort();
                            return;
                        }

                        callbacks.onMessage(new MessageEvent("message", { data: line }));
                    }
                }
            } catch (err) {
                if (callbacks?.onError) {
                    callbacks.onError(err);
                }
            }
        })();

        return {
            close: () => controller.abort(),
        };
    }
}
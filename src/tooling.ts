import CONFIG from "./config.js";

export const DEFAULT_TOOLS: Record<'web_contents' | 'web_search', (query?: string) => Promise<any>> = {
    web_contents: async (query?: string) => {
        if (!query) {
            throw new Error("Query is required for web_contents.");
        }
        const res = await fetch(`https://ai.hackclub.com/proxy/v1/exa/search`, {
            method: "POST",
            body: JSON.stringify({ query, numResults: 1 }),
            headers: {
                "Authorization": `Bearer ${CONFIG.AI_API_KEY}`
            }
        });
        if (!res.ok) {
            throw new Error(`Web contents request failed: ${res.status} ${res.statusText}`);
        }
        const data = await res.json() as any;
        const result = data.results?.[0];
        if (!result) {
            return `Web contents of "${query}" returned no results.`;
        }
        
        const content = await fetch(`https://ai.hackclub.com/proxy/v1/exa/contents`, {
            method: "POST",
            body: JSON.stringify({ urls: [result.url] }),
            headers: {
                "Authorization": `Bearer ${CONFIG.AI_API_KEY}`
            }
        });
        if (!content.ok) {
            return `Web contents of "${query}": ${result.tile}`;
        }
        const contentData = await content.json() as any;
        const contentText = contentData.results?.[0]?.text;
        if (!contentText) {
            return `Web contents of "${query}": ${result.title}`;
        }
        return `Web contents of "${query}": ${result.title} with content: ${contentText}`;
    },
    web_search: async (query?: string) => {
        if (!query) {
            throw new Error("Query is required for search.");
        }
        const res = await fetch(`https://ai.hackclub.com/proxy/v1/exa/answer`, {
            method: "POST",
            body: JSON.stringify({ query }),
            headers: {
                "Authorization": `Bearer ${CONFIG.AI_API_KEY}`
            }
        });
        if (!res.ok) {
            throw new Error(`Web search request failed: ${res.status} ${res.statusText}`);
        }
        const data = await res.json() as any;
        const result = data.answer;
        if (!result) {
            return `Web search of "${query}" returned no results.`;
        }
        return `Web search of "${query}": ${result}`;
    }
};

export interface Tool {
    name: string;
    description: string;
    hasQuery?: boolean;
    execute: (query?: string) => Promise<any>;
}

export interface ToolExecutionResult {
    toolCalled: boolean;
    toolId?: string;
    result?: any;
}

export default class HCAITooling {
    private tools: Record<string, Tool>;
    constructor(tools: Record<string, Tool> | undefined) {
        this.tools = tools || {};
    }

    async getSystemMessage(otherPrompt: string, previousReplies?: ToolExecutionResult[] | undefined) {
        return {
            role: 'system',
            content: `${otherPrompt}

To gather further information, you may reply with a JSON object in the exact format below and no additional reply text. This is the ONLY EXACT format that you may use. You may only call one tool at a time.
Available tools:
${Object.keys(this.tools).map(tool => `{"tool": "${tool}"${this.tools[tool]?.hasQuery ? ', "query": "..."' :''}}: ${this.tools[tool]?.name || tool} - ${this.tools[tool]?.description || 'Gather information'}`).join("\n")}

${previousReplies?.length ? "Previous tool calls and their results:\n" : ""}
${previousReplies?.map(reply => `Tool: ${reply.toolId}\nResult: ${JSON.stringify(reply.result)}`).join("\n") || "None"}`
        };
    }

    async executeTool(toolId: string, query?: string) {
        const tool = this.tools[toolId];
        if (!tool) {
            throw new Error(`Tool with ID "${toolId}" not found.`);
        }
        return await tool.execute(query);
    }

    async tryExecuteTool(unclean: string): Promise<ToolExecutionResult> {
        const message = unclean
            .trim()
            .replace(/^```(?:json)?/i, '')
            .replace(/```$/, '')
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u200B\uFEFF]/g, '')
            .trim();

        try {
            const parsed = JSON.parse(message);
            if (parsed.tool) {
                const result = await this.executeTool(parsed.tool, parsed.query);
                return {
                    toolCalled: true,
                    toolId: parsed.tool,
                    result
                };
            }
        } catch (error) {
            return {
                toolCalled: false
            };
        }
        return {
            toolCalled: false
        };
    }
}
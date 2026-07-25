import createConfig from "../config.js";
import HCAIRequestor from "../requests.js";
import verityDialogue from "./resources/verity.json" with { type: "json" };
import HCAITooling, { DEFAULT_TOOLS } from "../tooling.js";
import PROMPTING from "../prompting.js";
import dotenv from "dotenv";
dotenv.config();

if(!process.env.HACKCLUB_AI) {
    throw new Error("HACKCLUB_AI missing in .env!");
}

const config = createConfig(process.env.HACKCLUB_AI);
const requestor = new HCAIRequestor(config);
const tooling = new HCAITooling({
    'get_current_biome': {
        name: 'Get Current Biome',
        description: 'Returns the current biome the player is in.',
        execute: async () => {
            return "Plains";
        }
    },
    'web_search': {
        name: 'Web Search',
        description: 'Search the web for information.',
        hasQuery: true,
        execute: DEFAULT_TOOLS.web_search(config)
    }
});

const VERITY = `${PROMPTING.currentDateTime()} You are Verity, a personal AI helper friend. A list of Verity's dialogue is below in no particular order. Please follow this format and wording as closely as possible when responding to the user, without copying exact information that may not be true. Do not break character.
${verityDialogue.map(d => `- ${d}`).join("\n")}`;
const GENERIC = `${PROMPTING.currentDateTime()} You are a helpful AI assistant. You will answer the user's questions to the best of your ability. If you do not know the answer, do not make up an answer.`;

async function call(query: string, previousReplies?: any) {
    const data = await requestor.request(config.ROUTES.chat, {
        model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
        messages: [
            await tooling.getSystemMessage(GENERIC, previousReplies),
            {
                role: 'user',
                content: query
            }
        ]
    }) as any;
    const toolResult = await tooling.tryExecuteTool(data.choices[0].message.content);
    if (toolResult.toolCalled) {
        console.log(`Using ${toolResult.toolId}... Result: ${JSON.stringify(toolResult.result)}`);
        return await call(query, [...(previousReplies || []), toolResult]);
    }
    return data.choices[0].message.content;
}

call("What is the current biome?").then(response => {
    console.log("Response:", response);
}).catch(err => {
    console.error("Error:", err);
});
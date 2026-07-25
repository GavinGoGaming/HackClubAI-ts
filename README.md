# HackClubAI.ts
A typescript implementation of the [HackClub AI](https://ai.hackclub.com/) api with built in JSON tooling support, web search, and prompt generation.

## Installing
Install via npm or pnpm from npmjs or directly from GitHub:
```bash
# latest release
npm install hackclubai-ts

# latest push / nightly
npm install github:gavingogaming/hackclubai-ts
```

## Usage
First, create a Config with your hackclub AI api key, supplying it to a HCAI Requestor to actually make requests.

```ts
import {Config, HCAIRequestor} from 'hackclubai-ts';

const config = createConfig(process.env.HACKCLUB_AI);
const requestor = new HCAIRequestor(config);
```

Once a requestor is made, you can use it to send all requests to the Hack Club AI api.
```ts
// awaited request
let response = await requestor.request(config.ROUTES[...], {...});

// SSE / streamed request
requestor.request(config.ROUTES[...], {...}, {
    onMessage: (event) => {
        console.log("SSE message: ", event.data);
    },
    onError: (err) => {
        console.error("SSE error: ", error);
    }
})
```

## Tooling
HackClubAI.ts includes a JSON-based tooling helper. This will not work for all models, and it isn't a 100% success rate for working models to spit out reliable results. I've seen success often with `nvidia/nemotron-3-ultra-550b-a55b:free`.

> [!WARNING]
> Tooling has not been tested for streaming/SSE. You'll need to check once the reply is complete, and for user experience, don't show raw reply segments if the first segment includes the start of a JSON object.

Create a HCAI Tooling that contains all your tools:
```ts
const tooling = new HCAITooling({
    'get_name': {
        name: 'Get Name',
        description: "Returns the current user's name.",
        // hasQuery?: false
        execute: async (query?: string) => {
            return "John Doe";
        }
    }
});
```

You can then add the tooling's system prompt, passing your own system prompt & previous tool responses (you have to store those yourself!)

You do not need to pass previousReplies for non-chat requests.
```ts
let previousReplies = [];
const systemPrompt = "You are a helpful assistant.";

/* request data */
return {
    model: ...,
    messages: [
        await tooling.getSystemMessage(systemPrompt, previousReplies),
        ...
    ]
};
```

Then, loop the request until all tool calls are done, checking with the tooling's `tryExecuteTool`.
```ts
async function call(query: string, previousReplies?: any) {
    const data = await requestor.request(config.ROUTES.chat, {
        model: ...,
        messages: [
            await tooling.getSystemMessage(systemPrompt, previousReplies),
            {
                role: 'user',
                content: query
            }
        ]
    }) as any;

    const toolResult = await tooling.tryExecuteTool(data.choices[0].message.content);
    if (toolResult.toolCalled) {
        return await call(query, [...(previousReplies || []), toolResult]);
    }
    return data.choices[0].message;
}
```

## Utility
HackClubAI.ts also contains some utility functions.

`DEFAULT_TOOLS` is a helper for creating common tools, including `web_search` (exa's answer api) and `web_contents` (exa's search+contents api).

```ts
const tooling = new HCAITooling({
    ...,
    'web_search': {
        name: 'Web Search',
        description: 'Search the web to get information.',
        hasQuery: true,
        execute: DEFAULT_TOOLS.web_search(config)
    }
});
```

PROMPTING is a helper for creating your system prompts. Currently only contains currentDateTime.

```ts
import {PROMPTING} from 'hackclubai-ts';
const prompt = `You are a helpful assistant. ${PROMPTING.currentDateTime()}`;
```
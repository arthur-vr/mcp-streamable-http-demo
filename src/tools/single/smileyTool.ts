import { z } from "zod"
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";

export const smileyInputSchema = z.object({
    wayOfLaughing: z.enum(['laugh', 'smile', 'lol']),
    numberOfLaughing: z.number().min(1).max(10)
})

export const smileyTool: Tool = {
    name: 'smiley',
    description: 'Smiley tool 💖',
    inputSchema: zodToJsonSchema(smileyInputSchema) as Tool['inputSchema'],
}

export const executeSmileyTool = (args: unknown) => {
    
    const parsed = smileyInputSchema.safeParse(args);
    if (!parsed.success) {
        throw new Error('Invalid input', { cause: parsed.error });
    }

    const { wayOfLaughing, numberOfLaughing } = parsed.data;

    const emojiMap = {
        'laugh': '🤣',
        'smile': '😊',
        'lol': '😂'
    };

    const result = emojiMap[wayOfLaughing].repeat(numberOfLaughing);

    return {
        type: 'text',
        text: result
    };
}
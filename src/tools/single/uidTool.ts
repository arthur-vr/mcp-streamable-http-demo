import { z } from "zod"
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { v4 as uuidv4 } from 'uuid';

export const uidInputSchema = z.object({
    prefix: z.string().optional(),
    length: z.number().min(1).max(36).optional()
})

export const uidTool: Tool = {
    name: 'uid',
    description: 'UID generator tool 🆔✨',
    inputSchema: zodToJsonSchema(uidInputSchema) as Tool['inputSchema'],
}

export const executeUidTool = (args: unknown) => {
    
    const parsed = uidInputSchema.safeParse(args);
    if (!parsed.success) {
        throw new Error('Invalid input 💔', { cause: parsed.error });
    }

    const { prefix, length } = parsed.data;

    const uuid = uuidv4();
    let result = prefix ? `${prefix}-${uuid}` : uuid;
    
    if (length) {
        result = result.substring(0, length);
    }

    return {
        type: 'text',
        text: `👑 ${result}`
    };
}
import { z } from "zod"
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";

export const calculatorInputSchema = z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number(),
    b: z.number(),
})

export const calculatorTool: Tool = {
    name: 'calculator',
    description: 'Calculator tool 🧮',
    inputSchema: zodToJsonSchema(calculatorInputSchema) as Tool['inputSchema'],
}

export const executeCalculatorTool = (args: unknown) => {

    const parsed = calculatorInputSchema.safeParse(args);
    if (!parsed.success) {
        throw new Error('Invalid input', { cause: parsed.error });
    }

    const { operation, a, b } = parsed.data;

    let result;
    switch (operation) {
        case 'add':
            result = a + b;
            break;
        case 'subtract':
            result = a - b;
            break;
        case 'multiply':
            result = a * b;
            break;
        case 'divide':
            result = a / b;
            break;
    }

    return {
        type: 'text',
        text: `The result is ${result}!`
    };
}
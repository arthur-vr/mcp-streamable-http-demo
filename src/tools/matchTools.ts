import { executeCalculatorTool } from "./calculatorTool.js";
import { executeSmileyTool } from "./smileyTool.js";

export const matchTools = (toolName: string, args: unknown) => {
    if (toolName === 'calculator') {
        return executeCalculatorTool(args);
    }
    if (toolName === 'smiley') {
        return executeSmileyTool(args);
    }
    throw new Error(`Unknown tool: ${toolName}`);
}
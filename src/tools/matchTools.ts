import { executeCalculatorTool } from "./single/calculatorTool.js";
import { executeSmileyTool } from "./single/smileyTool.js";
import { executeUidTool } from "./single/uidTool.js";

export const matchTools = (toolName: string, args: unknown) => {
    if (toolName === 'calculator') {
        return executeCalculatorTool(args);
    }
    if (toolName === 'smiley') {
        return executeSmileyTool(args);
    }
    if (toolName === 'uid') {
        return executeUidTool(args);
    }
    throw new Error(`Moidfy matchTools.ts to add new tool: ${toolName}`);
}
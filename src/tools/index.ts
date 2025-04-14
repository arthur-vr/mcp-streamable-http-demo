import { Tool } from "@modelcontextprotocol/sdk/types.js"
import { calculatorTool } from "./calculatorTool.js"
import { smileyTool } from "./smileyTool.js"

export const tools: Tool[] = [
    calculatorTool,
    smileyTool
]
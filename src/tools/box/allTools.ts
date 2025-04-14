import { Tool } from "@modelcontextprotocol/sdk/types.js"
import { calculatorTool } from "../single/calculatorTool.js"
import { smileyTool } from "../single/smileyTool.js"

export const allTools: Tool[] = [
    calculatorTool,
    smileyTool
]
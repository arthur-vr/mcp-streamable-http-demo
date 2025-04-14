import { Tool } from "@modelcontextprotocol/sdk/types.js"
import { calculatorTool } from "../single/calculatorTool.js"
import { uidTool } from "../single/uidTool.js"

export const utilTools: Tool[] = [
    calculatorTool,
    uidTool
]
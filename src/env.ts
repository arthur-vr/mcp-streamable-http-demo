import { config } from 'dotenv';
config();

export const API_KEY = process.env.API_KEY || '';
export const IS_USE_API_KEY = process.env.IS_USE_API_KEY === 'false';
export const MCP_SERVER_URL = process.env.MCP_SERVER_URL || '';

if (!API_KEY && IS_USE_API_KEY) {
    throw new Error('API_KEY is not set, please set it in the .env file');
}

if (!MCP_SERVER_URL) {
    throw new Error('MCP_SERVER_URL is not set, please set it in the .env file');
}
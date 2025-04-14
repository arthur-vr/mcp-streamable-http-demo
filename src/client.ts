import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { z } from 'zod';
import { API_KEY, IS_USE_API_KEY, MCP_SERVER_URL } from './env.js';

const contentSchema = z.object({
  type: z.enum(['text', 'image']),
  text: z.string().optional()
})

//FIXME: This is a workaround to pass the API key to the server
const commonParams = {
  'x-api-key': API_KEY
}
const getArgs = (args: any) => {
  if (IS_USE_API_KEY) {
    return {
      ...args,
      commonParams
    }
  }
  return args;
}

const BASE_URL = `${MCP_SERVER_URL}/mcp`;
const TOOL_ENDPOINT = {
  all: '/all',
  util: '/util'
}

const contentsSchema = z.array(contentSchema)

async function getClient(serverBaseUrl: string) {
  console.log(`✨ Connecting to MCP server at: ${serverBaseUrl}`);

  const transport = new StreamableHTTPClientTransport(
    new URL(serverBaseUrl)
  );

  const client = new Client(
    {
      name: 'mcp-streamablehttp-sample-client',
      version: '1.0.0'
    }
  );
  console.log('🚀 Connecting to server...');
  await client.connect(transport);
  console.log('🎉 Connected to server...');
  return client;
}

async function runAllToolsClient() {
  const serverUrl = `${BASE_URL}${TOOL_ENDPOINT.all}`;
  try {
    const client = await getClient(serverUrl);
    console.log('🔍 Fetching available tools...');
    const toolsResult = await client.listTools();
    console.log('\n🧰 Available tools:');
    toolsResult.tools.forEach(tool => {
      console.log(`- ✅ ${tool.name}: ${tool.description}`);
    });
    await callCalculatorToolExample(client);
    await callSmileyToolExample(client);
    console.log('\n👋 Closing connection...');
    await client.close();
    console.log('✅ Connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

async function runOnlyUidToolClient() {
  const serverUrl = `${BASE_URL}${TOOL_ENDPOINT.util}`;
  try {
    const client = await getClient(serverUrl);
    console.log('🔍 Fetching available tools...');
    const toolsResult = await client.listTools();
    console.log('\n🧰 Available tools:');
    toolsResult.tools.forEach(tool => {
      console.log(`- ✅ ${tool.name}: ${tool.description}`);
    });
    await callUidToolExample(client);
    console.log('\n👋 Closing connection...');
    await client.close();
    console.log('✅ Connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

async function runAllClients() {
  await runAllToolsClient();
  await runOnlyUidToolClient();
}

const callUidToolExample = async (client: Client) => {
  console.log('\n📣 Calling uid tool...');
  const result = await client.callTool({
    name: 'uid',
    arguments: getArgs({
      prefix: 'prefix',
      length: 32,
    })
  });
  const content = contentsSchema.safeParse(result.content)
  if (content.success) {
    console.dir(content.data);
  } else {
    console.error('❌ Invalid content:', content.error);
  }
}

const callCalculatorToolExample = async (client: Client) => {
  console.log('\n📣 Calling calculator tool...');
  const calculatorResult = await client.callTool({
    name: 'calculator',
    arguments: getArgs({
      operation: 'add',
      a: 142,
      b: 857,
    })
  });

  const content = contentsSchema.safeParse(calculatorResult.content)
  if (content.success) {
    console.dir(content.data);
  } else {
    console.error('❌ Invalid content:', content.error);
  }
}

const callSmileyToolExample = async (client: Client) => {
  console.log('\n📣 Calling smiley tool...');
  const smileyResult = await client.callTool({
    name: 'smiley',
    arguments: getArgs({
      wayOfLaughing: 'lol',
      numberOfLaughing: 8,
    })
  });
  const content = contentsSchema.safeParse(smileyResult.content)
  if (content.success) {
    console.dir(content.data);
  } else {
    console.error('❌ Invalid content:', content.error);
  }
}

runAllClients().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});

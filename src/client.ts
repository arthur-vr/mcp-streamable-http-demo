import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { z } from 'zod';

const contentSchema = z.object({
  type: z.enum(['text', 'image']),
  text: z.string().optional()
})
const contentsSchema = z.array(contentSchema)

async function runClient() {

  const serverUrl = process.env.MCP_SERVER_URL || 'http://localhost:3000/mcp';
  
  console.log(`✨ Connecting to MCP server at: ${serverUrl}`);
  
  const transport = new StreamableHTTPClientTransport(
    new URL(serverUrl)
  );

  const client = new Client(
    {
      name: 'mcp-streamablehttp-sample-client',
      version: '1.0.0'
    }
  );

  try {
    console.log('🚀 Connecting to server...');
    await client.connect(transport);
    console.log('🎉 Connected to server...');

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

const callCalculatorToolExample = async (client: Client) => {
  console.log('\n📣 Calling calculator tool...');
  const calculatorResult = await client.callTool({
    name: 'calculator',
    arguments: { operation: 'add', a: 142, b: 857 }
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
    arguments: { wayOfLaughing: 'lol', numberOfLaughing: 8 }
  });
  const content = contentsSchema.safeParse(smileyResult.content)
  if (content.success) {
    console.dir(content.data);
  } else {
    console.error('❌ Invalid content:', content.error);
  }
}

runClient().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});

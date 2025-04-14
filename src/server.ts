import { Server } from './mcp/esm/server/index.js';
import { StreamableHTTPServerTransport } from './mcp/esm/server/streamableHttp.js';
import { Tool } from './mcp/esm/types.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from './mcp/esm/types.js';
import bodyParser from 'body-parser';
import express from 'express';
import { matchTools } from './tools/matchTools.js';
import { API_KEY, IS_USE_API_KEY } from './env.js';
import { allTools, utilTools } from './tools/box/index.js';

const app = express();
const PORT = 3000;
app.use(bodyParser.json());

app.get('/', async (req, res) => {
  res.send('Hello Mcp Http Remote Server!');
});

app.post('/mcp/all', async (req, res) => {
  console.log('🚀 Received POST request /mcp/all');
  await toolCallHandler(req, res, allTools);
});

app.post('/mcp/util', async (req, res) => {
  console.log('🚀 Received POST request /mcp/util');
  await toolCallHandler(req, res, utilTools);
});

function createStatelessServer(tools: Tool[]) {

  console.log('✨ Creating new stateless server instance');

  const server = new Server(
    {
      name: 'mcp-streamablehttp-server-sample',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools
    }
  });
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    console.log(`\n🔍 Received call tool request: ${name}\nwith args: ${JSON.stringify(args)}\n`);
    const result = matchTools(name, args);
    return {
      content: [result],
    };
  });

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => undefined,
    enableJsonResponse: true
  });

  server.connect(transport);

  return { server, transport };
}

const validateApiKey = async (req: express.Request, res: express.Response) => {
  if (!IS_USE_API_KEY) {
    return;
  }
  const body = req.body;
  const apiKey = body.params.arguments.commonParams['x-api-key'] as string;
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  console.log(`🔑 API key: ${apiKey} validated`);
}

const toolCallHandler = async (req: express.Request, res: express.Response, tools: Tool[]) => {
  try {

    const message = req.body;
    const isInitRequest = Array.isArray(message)
      ? message.some(msg => msg.method === 'initialize')
      : message.method === 'initialize';

    console.log('\n');
    console.log(message);
    console.log('\n');

    console.log(`🔍 Is initialization request: ${isInitRequest}`);

    const { transport } = createStatelessServer(tools);

    if (isInitRequest) {
      // @ts-expect-error - accessing private property
      transport._initialized = false;
    } else {
      // @ts-expect-error - accessing private property
      transport._initialized = true;
    }

    const isToolCall = message.method === 'tools/call';
    if (isToolCall) {
      await validateApiKey(req, res);
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('❌ Error processing request:', error);
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error',
        data: String(error)
      },
      id: null
    });
  }
}

process.on('SIGINT', async () => {
  console.log('👋 Shutting down...');
  process.exit(0);
});


app.listen(PORT, () => {
  console.log(`🌟 Server is running on port ${PORT}`);
  console.log(`🔗 MCP endpoint: http://localhost:${PORT}/mcp`);
});

export default app;
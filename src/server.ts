import { Server } from './mcp/esm/server/index.js';
import { StreamableHTTPServerTransport } from './mcp/esm/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from './mcp/esm/types.js';
import bodyParser from 'body-parser';
import express from 'express';
import { tools } from './tools/index.js';
import { matchTools } from './tools/matchTools.js';

const app = express();
app.use(express.static('dist'));
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());

app.get('/', async (req, res) => { 
  res.send('Hello Mcp Http Remote Server!');
});

function createStatelessServer() {

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

app.post('/mcp', async (req, res) => {
  console.log('🚀 Received POST request');

  try {
    const message = req.body;
    const isInitRequest = Array.isArray(message)
      ? message.some(msg => msg.method === 'initialize')
      : message.method === 'initialize';

    console.log(`🔍 Is initialization request: ${isInitRequest}`);

    const { transport } = createStatelessServer();

    if (isInitRequest) {
      // @ts-expect-error - accessing private property
      transport._initialized = false;
    } else {
      // @ts-expect-error - accessing private property
      transport._initialized = true;
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
});

app.get('/mcp', async (req, res) => {

  console.log('📥 Received GET request');

  try {
    const { transport } = createStatelessServer();

    // @ts-expect-error - accessing private property
    transport._initialized = true;

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
});

app.delete('/mcp', async (req, res) => {
  console.log('🗑️ Received DELETE request');

  try {
    const { transport } = createStatelessServer();

    // @ts-expect-error - accessing private property
    transport._initialized = true;

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
});

// process.on('SIGINT', async () => {
//   console.log('👋 Shutting down...');
//   process.exit(0);
// });


app.listen(PORT, () => {
  console.log(`🌟 Server is running on port ${PORT}`);
  console.log(`🔗 MCP endpoint: http://localhost:${PORT}/mcp`);
});

export default app;
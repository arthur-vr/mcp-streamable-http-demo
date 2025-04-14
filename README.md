# mcp-streamable-http-demo

## Setup

```
rename .env.example to .env

pnpm install
pnpm dev:server //localhost:3000
pnpm dev:client
```

## Deploy on vercel

```
pnpm vercel:login // choose root directory /
pnpm dev:vercel
pnpm deploy:vercel
```

Root Directory /

![Root Directory Setting](./docs/images/vercel-root-directory.png)


## Test remote endpoints

modify .env 

MCP_SERVER_URL=https://[YOUR_SERVER_ADDRESS]

then, `pnpm dev:client`


## Use in Sugoi Search

Set https://[your-remote-server or local]/mcp endpoint

![MCP Single URL](./docs/images/sugoi-search-registration.png)


## Client Example in Sugoi Search

![LOL](./docs/images/lol.png)
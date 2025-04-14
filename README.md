# mcp-streamable-http-demo

## setup

```
pnpm install
pnpm dev:server //localhost:3000
pnpm dev:client
```

## deploy on vercel

```
pnpm vercel:login // choose root directory /
pnpm vercel:dev
pnpm vercel:deploy
```

Root Directory /

![Root Directory Setting](./docs/images/vercel-root-directory.png)


## Use in Sugoi Search


Set https://[your-remote-server or local]/mcp endpoint

![MCP Single URL](./docs/images/sugoi-search-registration.png)


## Client Example in Sugoi Search

![LOL](./docs/images/lol.png)
# Winners SDK

The Winners SDK is the TypeScript client for the Winners Ecosystem API gateway.

## Install

This repository uses the SDK source directly from `sdk/WinnersSDK.ts`.

## Quick Start

```ts
import { createWinnersClient } from "../sdk/WinnersSDK";

const winners = createWinnersClient({
  baseUrl: "https://winners-empire-eco.up.railway.app",
  token: process.env.WINNERS_API_KEY,
  tenantId: "tenant_123",
});

const { data } = await winners.health();
```

## Core Helpers

- `createWinnersClient(config)`
- `new WinnersSDK(config)`
- `winners.request(method, path, body?)`
- `winners.stream(method, path, body?, onChunk?)`

`request()` is the raw escape hatch for every route in the gateway.

## Typed Resources

- `analytics`
- `community`
- `users`
- `billing`
- `gdpr`
- `ai`
- `academy`
- `market`
- `certificates`
- `webhooks`
- `plugins`
- `whitelabel`

## Example

```ts
const { data: feed } = await winners.community.getFeed(0, 20);
const { data: courses } = await winners.academy.listCourses({ level: "beginner" });
const { data: products } = await winners.market.listProducts({ category: "electronics" });
```

## Raw Route Access

Use `request()` whenever you need an endpoint that is not wrapped yet:

```ts
await winners.request("GET", "/users");
await winners.request("POST", "/auth/login", {
  email: "person@example.com",
  password: "secret",
});
```

## Streaming

```ts
await winners.stream("POST", "/ai/chat/stream", { message: "Build a summary" }, (chunk) => {
  console.log(chunk);
});
```

## Documentation

- API reference: [`docs/API_REFERENCE.md`](../docs/API_REFERENCE.md)
- Cloud OpenAPI spec: [`docs/CLOUD_API_OPENAPI_SPEC.json`](../docs/CLOUD_API_OPENAPI_SPEC.json)

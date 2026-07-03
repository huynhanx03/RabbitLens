# RabbitLens

RabbitLens is a modern, accessible, and responsive Single Page Application (SPA) designed to act as a frontend interface for the RabbitMQ Management backend. It provides 100% parity with the legacy UI while hardening the experience through modern React, TypeScript, and Vite.

## Production Deployment

Please see our comprehensive [Production Deployment Guide](../docs/deployment/rabbitlens-production.md) for information on:
- Serving the immutable static build
- Configuring Nginx/Caddy proxies
- Implementing security headers and Content Security Policies
- Handling OAuth deployment considerations

## Development

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Run all verification checks (lint, typecheck, unit, e2e, parity, secrets)
npm run check
```

# RabbitLens
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-Ready-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)

## Why RabbitLens?

The default RabbitMQ Management UI is functional but visually outdated. RabbitLens brings RabbitMQ observability into the modern era with:
- **Blazing Fast Performance**: Built with Vite, React 19, and optimized state management.
- **Modern Aesthetics**: Sleek, responsive, and thoughtfully designed UI (powered by Tailwind CSS & shadcn/ui).
- **Seamless Integration**: Zero extra backend required. It connects directly to your existing RabbitMQ Management API.
- **Deep Observability**: Real-time insights into nodes, queues, exchanges, and policies.

## Quick Start

Getting started is as simple as running a single command.

```bash
# Start the full integrated stack (RabbitMQ + RabbitLens)
make up
```

Access your beautiful new dashboard:
- **URL**: [http://127.0.0.1:8080](http://127.0.0.1:8080)
- **Username**: `admin`
- **Password**: `rabbitlens-demo`

## Development

Want to contribute or customize RabbitLens? We use a lightning-fast Hot Module Replacement (HMR) setup.

```bash
# 1. Keep the backend running
make up

# 2. Start the local frontend development server
make dev
```
Open `http://localhost:5173` to see your changes instantly.
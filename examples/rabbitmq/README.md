# RabbitLens Showcase

Welcome to the RabbitLens demo! This environment spins up a realistic RabbitMQ cluster (with exchanges, queues, and policies) alongside **RabbitLens** — a modern, beautiful, and ultra-fast UI replacement for the legacy RabbitMQ Management interface.

## Quick Start

1. **Start the stack** (RabbitMQ + RabbitLens):
   ```bash
   make up
   ```

2. **Access RabbitLens**:
   - **URL:** [http://127.0.0.1:8080](http://127.0.0.1:8080)
   - **Username:** `admin`
   - **Password:** `rabbitlens-demo`

3. **Make it lively**:
   Populate some dummy messages into the queues so the UI looks active and beautiful!
   ```bash
   make seed
   ```

## Development (Frontend HMR)

If you want to edit the RabbitLens source code and see changes instantly without rebuilding Docker images:

1. Keep the backend running (`make up`).
2. Start the local Vite server:
   ```bash
   make dev
   ```
3. Open **http://localhost:5173** to code with Hot Module Replacement (HMR).

## Other Commands

- `make down` - Stops the stack.
- `make reset` - Stops the stack and wipes all data (useful for a fresh start).
- `make logs` - Follows logs for all services.

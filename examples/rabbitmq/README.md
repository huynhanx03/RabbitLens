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

## Queue Configuration Scenario

The `/demo` virtual host includes a SecuWall-style topology for checking the
Queue Detail configuration and consumer-route views:

| Queue | Source exchange | Exchange type | Routing key | Durable |
| --- | --- | --- | --- | --- |
| `pentest.response` | `pentest.response` | topic | `scan.#` | yes |
| `activity-log` | `activity-log` | fanout | `activity.#` | yes |
| `pentest.logs` | `pentest.logs` | topic | empty string | yes |
| `pentest.tracking` | `pentest.tracking` | topic | `#` | yes |

Publisher exchanges `pentest.request` and `credit.request` are also declared as
durable direct exchanges. Run `make seed`, then open any queue above to inspect
its declaration, default system binding, explicit route, exchange metadata, and
message-count history.

Definitions are loaded by RabbitMQ only when its data directory is new. If the
demo was already running before this scenario was added, run `make reset` before
`make up` and `make seed`.

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

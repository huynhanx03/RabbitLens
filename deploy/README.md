# RabbitLens with an existing RabbitMQ

This Compose file runs only RabbitLens and proxies `/api` to an existing RabbitMQ Management API.

RabbitMQ must already have the `rabbitmq_management` plugin enabled.

## Quick start

```bash
cp deploy/.env.example deploy/.env
```

Edit `deploy/.env`:

```env
RABBITMQ_MANAGEMENT_SCHEME=http
RABBITMQ_MANAGEMENT_HOST=host.docker.internal
RABBITMQ_MANAGEMENT_PORT=15672
```

Start RabbitLens:

```bash
docker compose --env-file deploy/.env -f deploy/compose.yaml up -d --build
```

Open:

```text
http://127.0.0.1:8080
```

Log in with an existing RabbitMQ user.

## Common RabbitMQ targets

RabbitMQ on the Docker host:

```env
RABBITMQ_MANAGEMENT_HOST=host.docker.internal
```

RabbitMQ on another host:

```env
RABBITMQ_MANAGEMENT_HOST=rabbitmq.internal.example.com
```

RabbitMQ in a Docker network reachable by service name:

```env
RABBITMQ_MANAGEMENT_HOST=rabbitmq
```

## Security notes

- Expose RabbitLens, not RabbitMQ Management UI, to operators.
- Keep RabbitMQ Management port private when possible.
- Use HTTPS in front of RabbitLens for production.
- Do not put secrets in `.env`; RabbitLens users authenticate directly with RabbitMQ.

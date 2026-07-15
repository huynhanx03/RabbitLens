# RabbitLens with an existing RabbitMQ

This Compose file runs only RabbitLens and proxies `/api` to an existing RabbitMQ Management API.

RabbitMQ must already have the `rabbitmq_management` plugin enabled.

## Quick start

```bash
cp deploy/.env.example deploy/.env
```

Edit `deploy/.env`:

```env
RABBITLENS_IMAGE=ghcr.io/huynhanx03/rabbitlens:1.0.2
RABBITMQ_MANAGEMENT_SCHEME=http
RABBITMQ_MANAGEMENT_HOST=host.docker.internal
RABBITMQ_MANAGEMENT_PORT=15672
```

Pull and start the pinned RabbitLens image:

```bash
docker compose --env-file deploy/.env -f deploy/compose.yaml pull
docker compose --env-file deploy/.env -f deploy/compose.yaml up -d --no-build
```

Open:

```text
http://127.0.0.1:8080
```

Log in with an existing RabbitMQ user.

## Update or roll back

To update, change the pinned `RABBITLENS_IMAGE` tag in `deploy/.env`, then pull
and recreate only RabbitLens:

```bash
docker compose --env-file deploy/.env -f deploy/compose.yaml pull rabbitlens
docker compose --env-file deploy/.env -f deploy/compose.yaml up -d --no-build rabbitlens
```

To roll back, restore the prior image tag (for example `:1.0.1`) in
`deploy/.env` and run the same two commands:

```env
RABBITLENS_IMAGE=ghcr.io/huynhanx03/rabbitlens:1.0.1
```

```bash
docker compose --env-file deploy/.env -f deploy/compose.yaml pull rabbitlens
docker compose --env-file deploy/.env -f deploy/compose.yaml up -d --no-build rabbitlens
```

Pin a release tag in production. `:latest` is useful only for evaluation. If
the GHCR package is private, authenticate with `docker login ghcr.io` before
pulling.

## Local source build

The Compose file also supports local development. Set
`RABBITLENS_IMAGE=rabbitlens:local` (or remove the variable) and build from the
checked-out source:

```bash
docker compose --env-file deploy/.env -f deploy/compose.yaml up -d --build
```

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

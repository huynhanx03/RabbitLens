#!/usr/bin/env bash

set -euo pipefail

readonly MANAGEMENT_URL="${RABBITMQ_MANAGEMENT_URL:-http://127.0.0.1:${RABBITMQ_MANAGEMENT_PORT:-15672}}"
readonly API_USER="${RABBITMQ_ADMIN_USER:-admin}"
readonly API_PASSWORD="${RABBITMQ_ADMIN_PASSWORD:-rabbitlens-demo}"
readonly API_RETRIES="${RABBITMQ_API_RETRIES:-30}"
readonly RETRY_DELAY_SECONDS="${RABBITMQ_RETRY_DELAY_SECONDS:-1}"
readonly FORCE_SEED="${FORCE_SEED:-0}"

readonly DEMO_VHOST="%2Fdemo"
readonly UPSTREAM_VHOST="%2Fupstream"
readonly RESTRICTED_VHOST="%2Frestricted"
readonly IDEMPOTENCE_QUEUE="orders.created"

readonly DEFAULT_PROPERTIES='{"content_type":"application/json","delivery_mode":2}'
readonly HEADER_PROPERTIES='{"content_type":"application/json","delivery_mode":2,"headers":{"format":"json","priority":"high"}}'

fail() {
  printf 'Seed failed: %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"
}

api_request() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local response

  if [[ -n "$body" ]]; then
    response="$(curl --silent --show-error \
      --request "$method" \
      --user "${API_USER}:${API_PASSWORD}" \
      --header 'Content-Type: application/json' \
      --data "$body" \
      --write-out $'\n%{http_code}' \
      "${MANAGEMENT_URL}${path}")" || return 1
  else
    response="$(curl --silent --show-error \
      --request "$method" \
      --user "${API_USER}:${API_PASSWORD}" \
      --write-out $'\n%{http_code}' \
      "${MANAGEMENT_URL}${path}")" || return 1
  fi

  API_STATUS="${response##*$'\n'}"
  API_BODY="${response%$'\n'*}"
}

wait_for_api() {
  local attempt

  for ((attempt = 1; attempt <= API_RETRIES; attempt += 1)); do
    if api_request GET '/api/overview' && [[ "$API_STATUS" == "200" ]]; then
      return 0
    fi
    sleep "$RETRY_DELAY_SECONDS"
  done

  fail "Management API did not become ready at ${MANAGEMENT_URL}"
}

queue_has_messages() {
  local -r get_request='{"count":1,"ackmode":"ack_requeue_true","encoding":"auto","truncate":50000}'

  api_request POST "/api/queues/${DEMO_VHOST}/${IDEMPOTENCE_QUEUE}/get" "$get_request" \
    || return 2
  [[ "$API_STATUS" == "200" ]] || return 2
  printf '%s' "$API_BODY" | grep -q '"payload"'
}

publish() {
  local vhost="$1"
  local exchange="$2"
  local routing_key="$3"
  local payload="$4"
  local properties="${5:-$DEFAULT_PROPERTIES}"
  local request_body
  local attempt

  request_body="$(printf \
    '{"properties":%s,"routing_key":"%s","payload":"%s","payload_encoding":"string"}' \
    "$properties" "$routing_key" "$payload")"

  for ((attempt = 1; attempt <= API_RETRIES; attempt += 1)); do
    if api_request POST "/api/exchanges/${vhost}/${exchange}/publish" "$request_body" \
      && [[ "$API_STATUS" == "200" ]] \
      && printf '%s' "$API_BODY" | grep -Eq '"routed"[[:space:]]*:[[:space:]]*true'; then
      return 0
    fi
    sleep "$RETRY_DELAY_SECONDS"
  done

  fail "message was not routed: ${vhost}/${exchange} (${routing_key})"
}

seed_batch() {
  publish "$DEMO_VHOST" 'demo.events' 'order.created' \
    '{\"event\":\"order.created\",\"order_id\":\"ORD-1001\",\"amount\":149.95}'
  publish "$DEMO_VHOST" 'demo.events' 'order.cancelled' \
    '{\"event\":\"order.cancelled\",\"order_id\":\"ORD-1002\",\"reason\":\"customer_request\"}'
  publish "$DEMO_VHOST" 'demo.events' 'order.quorum' \
    '{\"event\":\"order.confirmed\",\"order_id\":\"ORD-1003\",\"consistency\":\"quorum\"}'
  publish "$DEMO_VHOST" 'demo.events' 'audit.recorded' \
    '{\"event\":\"audit.recorded\",\"actor\":\"rabbitlens-demo\",\"action\":\"seed\"}'
  publish "$DEMO_VHOST" 'demo.direct' 'email.send' \
    '{\"event\":\"notification.requested\",\"channel\":\"email\",\"template\":\"order-confirmed\"}'
  publish "$DEMO_VHOST" 'demo.broadcast' 'demo.broadcast' \
    '{\"event\":\"system.announcement\",\"message\":\"RabbitLens demo is ready\"}'
  publish "$DEMO_VHOST" 'demo.headers' 'ignored.for.headers' \
    '{\"event\":\"notification.priority\",\"format\":\"json\",\"priority\":\"high\"}' \
    "$HEADER_PROPERTIES"
  publish "$DEMO_VHOST" 'demo.dlx' 'order.dead' \
    '{\"event\":\"order.dead_lettered\",\"order_id\":\"ORD-0999\",\"reason\":\"demo\"}'
  publish "$UPSTREAM_VHOST" 'upstream.events' 'federated.notice' \
    '{\"event\":\"federated.notice\",\"source\":\"/upstream\",\"target\":\"/demo\"}'
  publish "$UPSTREAM_VHOST" 'upstream.events' 'shovel.demo' \
    '{\"event\":\"shovel.demo\",\"source\":\"shovel.source\",\"target\":\"shovel.received\"}'
  publish "$RESTRICTED_VHOST" 'restricted.events' 'restricted.demo' \
    '{\"event\":\"restricted.demo\",\"visibility\":\"restricted\"}'
}

main() {
  local guard_status

  require_command curl
  require_command grep
  wait_for_api

  if [[ "$FORCE_SEED" != "1" ]]; then
    if queue_has_messages; then
      printf 'RabbitMQ demo already seeded (messages found in %s).\n' \
        "$IDEMPOTENCE_QUEUE"
      return 0
    else
      guard_status="$?"
      [[ "$guard_status" == "1" ]] \
        || fail "could not inspect ${DEMO_VHOST}/${IDEMPOTENCE_QUEUE}"
    fi
  fi

  seed_batch
  printf 'RabbitMQ demo message batch seeded successfully.\n'
}

main "$@"

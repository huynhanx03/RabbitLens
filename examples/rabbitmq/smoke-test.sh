#!/usr/bin/env bash

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly COMPOSE_FILE="${RABBITMQ_COMPOSE_FILE:-${SCRIPT_DIR}/compose.yaml}"
readonly COMPOSE_PROJECT="${COMPOSE_PROJECT_NAME:-rabbitlens-demo}"
readonly MANAGEMENT_URL="${RABBITMQ_MANAGEMENT_URL:-http://127.0.0.1:${RABBITMQ_MANAGEMENT_PORT:-15672}}"
readonly PROMETHEUS_URL="${RABBITMQ_PROMETHEUS_URL:-http://127.0.0.1:${RABBITMQ_PROMETHEUS_PORT:-15692}}"
readonly ADMIN_USER="${RABBITMQ_ADMIN_USER:-admin}"
readonly ADMIN_PASSWORD="${RABBITMQ_ADMIN_PASSWORD:-rabbitlens-demo}"
readonly DEMO_PASSWORD="${RABBITMQ_DEMO_PASSWORD:-rabbitlens-demo}"
readonly API_RETRIES="${RABBITMQ_API_RETRIES:-30}"
readonly RETRY_DELAY_SECONDS="${RABBITMQ_RETRY_DELAY_SECONDS:-1}"

readonly DEMO_VHOST="%2Fdemo"
readonly RESTRICTED_VHOST="%2Frestricted"
readonly DENIED_QUEUE="rabbitlens.smoke.denied"
readonly MONITOR_DENIED_QUEUE="rabbitlens.smoke.monitor-denied"

PASS_COUNT=0

fail() {
  printf '[FAIL] %s\n' "$1" >&2
  exit 1
}

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf '[PASS] %s\n' "$1"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"
}

compose() {
  docker compose --project-name "$COMPOSE_PROJECT" --file "$COMPOSE_FILE" "$@"
}

api_request() {
  local user="$1"
  local password="$2"
  local method="$3"
  local path="$4"
  local body="${5:-}"
  local response

  if [[ -n "$body" ]]; then
    response="$(curl --silent --show-error \
      --request "$method" \
      --user "${user}:${password}" \
      --header 'Content-Type: application/json' \
      --data "$body" \
      --write-out $'\n%{http_code}' \
      "${MANAGEMENT_URL}${path}")" || return 1
  else
    response="$(curl --silent --show-error \
      --request "$method" \
      --user "${user}:${password}" \
      --write-out $'\n%{http_code}' \
      "${MANAGEMENT_URL}${path}")" || return 1
  fi

  API_STATUS="${response##*$'\n'}"
  API_BODY="${response%$'\n'*}"
}

wait_for_api() {
  local attempt

  for ((attempt = 1; attempt <= API_RETRIES; attempt += 1)); do
    if api_request "$ADMIN_USER" "$ADMIN_PASSWORD" GET '/api/overview' \
      && [[ "$API_STATUS" == "200" ]]; then
      pass 'Management API is ready'
      return 0
    fi
    sleep "$RETRY_DELAY_SECONDS"
  done

  fail "Management API did not become ready at ${MANAGEMENT_URL}"
}

assert_admin_endpoint() {
  local endpoint="$1"
  local label="$2"

  api_request "$ADMIN_USER" "$ADMIN_PASSWORD" GET "$endpoint" \
    || fail "request failed: ${endpoint}"
  [[ "$API_STATUS" == "200" ]] \
    || fail "${label} returned HTTP ${API_STATUS}: ${endpoint}"
  pass "$label"
}

assert_body_contains() {
  local body="$1"
  local fragment="$2"
  local label="$3"

  printf '%s' "$body" | grep -Fq "$fragment" \
    || fail "${label} is missing ${fragment}"
  pass "$label"
}

assert_body_excludes() {
  local body="$1"
  local fragment="$2"
  local label="$3"

  if printf '%s' "$body" | grep -Fq "$fragment"; then
    fail "${label} unexpectedly contains ${fragment}"
  fi
  pass "$label"
}

assert_denied_status() {
  local status="$1"
  local label="$2"

  [[ "$status" == "401" || "$status" == "403" ]] \
    || fail "${label} returned HTTP ${status}, expected 401 or 403"
  pass "$label"
}

assert_queue_declaration_denied() {
  local user="$1"
  local vhost="$2"
  local queue="$3"
  local label="$4"
  local -r declaration='{"durable":true,"auto_delete":false,"arguments":{}}'

  api_request "$user" "$DEMO_PASSWORD" PUT \
    "/api/queues/${vhost}/${queue}" "$declaration" \
    || fail "${label} request failed"
  if [[ "$API_STATUS" == "201" || "$API_STATUS" == "204" ]]; then
    api_request "$ADMIN_USER" "$ADMIN_PASSWORD" DELETE \
      "/api/queues/${vhost}/${queue}" || true
    fail "${label}: queue declaration unexpectedly succeeded"
  fi
  assert_denied_status "$API_STATUS" "$label"
}

wait_for_fragment() {
  local endpoint="$1"
  local fragment="$2"
  local label="$3"
  local attempt

  for ((attempt = 1; attempt <= API_RETRIES; attempt += 1)); do
    if api_request "$ADMIN_USER" "$ADMIN_PASSWORD" GET "$endpoint" \
      && [[ "$API_STATUS" == "200" ]] \
      && printf '%s' "$API_BODY" | grep -Fq "$fragment"; then
      pass "$label"
      return 0
    fi
    sleep "$RETRY_DELAY_SECONDS"
  done

  fail "${label} did not reach the expected state: ${endpoint}"
}

verify_core_endpoints() {
  local endpoint

  local -ar endpoints=(
    overview
    extensions
    vhosts
    exchanges
    queues
    bindings
    nodes
    connections
    channels
    consumers
    policies
    parameters
    users
    permissions
    federation-links
    shovels
  )

  for endpoint in "${endpoints[@]}"; do
    assert_admin_endpoint "/api/${endpoint}" "API capability: ${endpoint}"
  done
}

verify_plugins() {
  local metrics

  assert_admin_endpoint '/api/extensions' 'Management extensions are available'
  assert_body_contains "$API_BODY" 'federation.js' 'Federation management extension is enabled'
  assert_body_contains "$API_BODY" 'shovel.js' 'Shovel management extension is enabled'
  assert_body_contains "$API_BODY" 'stream.js' 'Stream management extension is enabled'
  assert_body_contains "$API_BODY" 'top.js' 'Top management extension is enabled'
  assert_body_contains "$API_BODY" 'tracing.js' 'Tracing management extension is enabled'

  metrics="$(curl --silent --show-error --fail "${PROMETHEUS_URL}/metrics")" \
    || fail "Prometheus endpoint is unavailable: ${PROMETHEUS_URL}/metrics"
  printf '%s' "$metrics" | grep -Fq 'rabbitmq_' \
    || fail 'Prometheus response contains no RabbitMQ metrics'
  pass 'Prometheus metrics are available'
}

verify_link_states() {
  wait_for_fragment '/api/federation-links' '"status":"running"' \
    'Federation link is running'
  assert_body_contains "$API_BODY" '"upstream":"demo-upstream"' \
    'Federation upstream identity is correct'

  wait_for_fragment '/api/shovels' '"state":"running"' \
    'Shovel is running'
  assert_body_contains "$API_BODY" '"name":"upstream-to-demo"' \
    'Shovel identity is correct'
}

verify_management_users() {
  local account
  local expected_tag
  local index

  local -ar accounts=(admin monitor policymaker operator readonly restricted)
  local -ar tags=(administrator monitoring policymaker management management management)

  for index in "${!accounts[@]}"; do
    account="${accounts[$index]}"
    expected_tag="${tags[$index]}"
    api_request "$account" "$DEMO_PASSWORD" GET '/api/whoami' \
      || fail "whoami request failed for ${account}"
    [[ "$API_STATUS" == "200" ]] \
      || fail "whoami returned HTTP ${API_STATUS} for ${account}"
    printf '%s' "$API_BODY" | grep -Fq "\"name\":\"${account}\"" \
      || fail "whoami returned the wrong identity for ${account}"
    printf '%s' "$API_BODY" | grep -Fq "\"${expected_tag}\"" \
      || fail "whoami returned the wrong tag for ${account}"
    pass "Management identity: ${account} (${expected_tag})"
  done

  api_request bridge "$DEMO_PASSWORD" GET '/api/whoami' \
    || fail 'bridge whoami request failed'
  assert_denied_status "$API_STATUS" 'Bridge account has no Management access'
}

verify_authorization() {
  api_request readonly "$DEMO_PASSWORD" GET "/api/queues/${DEMO_VHOST}/orders.created" \
    || fail 'readonly topology request failed'
  [[ "$API_STATUS" == "200" ]] \
    || fail "readonly cannot read /demo topology (HTTP ${API_STATUS})"
  pass 'Readonly account can inspect /demo'

  assert_queue_declaration_denied readonly "$DEMO_VHOST" "$DENIED_QUEUE" \
    'Readonly account cannot configure /demo'

  api_request monitor "$DEMO_PASSWORD" GET \
    "/api/queues/${RESTRICTED_VHOST}/restricted.queue" \
    || fail 'monitor topology request failed'
  [[ "$API_STATUS" == "200" ]] \
    || fail "monitor cannot read /restricted topology (HTTP ${API_STATUS})"
  pass 'Monitor account can inspect all demo vhosts'
  assert_queue_declaration_denied monitor "$RESTRICTED_VHOST" \
    "$MONITOR_DENIED_QUEUE" 'Monitor account cannot configure demo vhosts'

  api_request restricted "$DEMO_PASSWORD" GET '/api/vhosts' \
    || fail 'restricted vhost list request failed'
  [[ "$API_STATUS" == "200" ]] \
    || fail "restricted vhost list returned HTTP ${API_STATUS}"
  assert_body_contains "$API_BODY" '"name":"/restricted"' \
    'Restricted account can enumerate its own vhost'
  assert_body_excludes "$API_BODY" '"name":"/demo"' \
    'Restricted vhost list excludes /demo'

  api_request restricted "$DEMO_PASSWORD" GET \
    "/api/queues/${DEMO_VHOST}/orders.created" \
    || fail 'restricted cross-vhost request failed'
  assert_denied_status "$API_STATUS" 'Restricted account cannot read /demo'

  api_request restricted "$DEMO_PASSWORD" GET \
    "/api/queues/${RESTRICTED_VHOST}/restricted.queue" \
    || fail 'restricted own-vhost request failed'
  [[ "$API_STATUS" == "200" ]] \
    || fail "restricted cannot read its own queue (HTTP ${API_STATUS})"
  pass 'Restricted account can read /restricted'
}

verify_topology() {
  local queue_types
  local advertised_host
  local advertised_port

  assert_admin_endpoint "/api/queues/${DEMO_VHOST}" 'Demo queues are available'
  assert_body_contains "$API_BODY" '"name":"orders.created"' 'Classic queue is present'
  assert_body_contains "$API_BODY" '"name":"orders.quorum"' 'Quorum queue is present'
  assert_body_contains "$API_BODY" '"name":"audit.stream"' 'Stream queue is present'
  assert_body_contains "$API_BODY" '"name":"pentest.response"' 'Pentest response queue is present'
  assert_body_contains "$API_BODY" '"name":"activity-log"' 'Activity log queue is present'
  assert_body_contains "$API_BODY" '"name":"pentest.logs"' 'Pentest logs queue is present'
  assert_body_contains "$API_BODY" '"name":"pentest.tracking"' 'Pentest tracking queue is present'

  assert_admin_endpoint "/api/queues/${DEMO_VHOST}/pentest.response/bindings" \
    'Pentest response bindings are available'
  assert_body_contains "$API_BODY" '"source":"pentest.response"' \
    'Pentest response source exchange is correct'
  assert_body_contains "$API_BODY" '"routing_key":"scan.#"' \
    'Pentest response routing key is correct'

  assert_admin_endpoint "/api/queues/${DEMO_VHOST}/activity-log/bindings" \
    'Activity log bindings are available'
  assert_body_contains "$API_BODY" '"source":"activity-log"' \
    'Activity log source exchange is correct'
  assert_admin_endpoint "/api/exchanges/${DEMO_VHOST}/activity-log" \
    'Activity log exchange is available'
  assert_body_contains "$API_BODY" '"type":"fanout"' \
    'Activity log exchange is fanout'

  assert_admin_endpoint "/api/exchanges/${DEMO_VHOST}/pentest.request" \
    'Pentest request publisher exchange is available'
  assert_body_contains "$API_BODY" '"type":"direct"' \
    'Pentest request publisher exchange is direct'
  assert_body_contains "$API_BODY" '"durable":true' \
    'Pentest request publisher exchange is durable'

  assert_admin_endpoint "/api/exchanges/${DEMO_VHOST}/credit.request" \
    'Credit request publisher exchange is available'
  assert_body_contains "$API_BODY" '"type":"direct"' \
    'Credit request publisher exchange is direct'
  assert_body_contains "$API_BODY" '"durable":true' \
    'Credit request publisher exchange is durable'

  assert_admin_endpoint "/api/queues/${DEMO_VHOST}/pentest.logs/bindings" \
    'Pentest logs bindings are available'
  assert_body_contains "$API_BODY" '"source":"pentest.logs"' \
    'Pentest logs source exchange is correct'
  assert_body_contains "$API_BODY" '"routing_key":""' \
    'Pentest logs keeps an empty routing key'

  assert_admin_endpoint "/api/queues/${DEMO_VHOST}/pentest.tracking/bindings" \
    'Pentest tracking bindings are available'
  assert_body_contains "$API_BODY" '"source":"pentest.tracking"' \
    'Pentest tracking source exchange is correct'
  assert_body_contains "$API_BODY" '"routing_key":"#"' \
    'Pentest tracking wildcard routing key is correct'

  queue_types="$(compose exec -T rabbitmq \
    rabbitmqctl list_queues --quiet -p /demo name type)" \
    || fail 'could not inspect queue types with rabbitmqctl'
  printf '%s\n' "$queue_types" | grep -Fq $'orders.created\tclassic' \
    || fail 'orders.created is not a classic queue'
  printf '%s\n' "$queue_types" | grep -Fq $'orders.quorum\tquorum' \
    || fail 'orders.quorum is not a quorum queue'
  printf '%s\n' "$queue_types" | grep -Fq $'audit.stream\tstream' \
    || fail 'audit.stream is not a stream queue'
  pass 'Classic, quorum, and stream queue types are correct'

  advertised_host="$(compose exec -T rabbitmq \
    rabbitmqctl eval 'application:get_env(rabbitmq_stream, advertised_host).')" \
    || fail 'could not inspect the Stream advertised host'
  advertised_port="$(compose exec -T rabbitmq \
    rabbitmqctl eval 'application:get_env(rabbitmq_stream, advertised_port).')" \
    || fail 'could not inspect the Stream advertised port'
  if printf '%s' "$advertised_host" | grep -Fq 'undefined'; then
    fail 'Stream advertised host is not configured'
  fi
  if printf '%s' "$advertised_port" | grep -Fq 'undefined'; then
    fail 'Stream advertised port is not configured'
  fi
  pass 'Stream endpoint advertises a host-reachable address'
}

queue_message_count() {
  compose exec -T rabbitmq \
    rabbitmqctl list_queues --quiet -p /demo name messages \
    | awk -F $'\t' '$1 == "orders.created" {print $2}'
}

verify_seed_idempotence() {
  local after_first_seed
  local after_second_seed
  local seed_attempt

  for seed_attempt in first second; do
    RABBITMQ_MANAGEMENT_URL="$MANAGEMENT_URL" \
      RABBITMQ_ADMIN_USER="$ADMIN_USER" \
      RABBITMQ_ADMIN_PASSWORD="$ADMIN_PASSWORD" \
      "${SCRIPT_DIR}/seed-messages.sh" >/dev/null

    if [[ "$seed_attempt" == "first" ]]; then
      after_first_seed="$(queue_message_count)"
      [[ -n "$after_first_seed" ]] \
        || fail 'could not read the queue count after the first seed'
    fi
  done

  after_second_seed="$(queue_message_count)"
  [[ "$after_first_seed" == "$after_second_seed" ]] \
    || fail "second seed changed orders.created from ${after_first_seed} to ${after_second_seed}"
  pass 'Normal message seeding is idempotent'
}

main() {
  require_command awk
  require_command curl
  require_command docker
  require_command grep

  wait_for_api
  verify_core_endpoints
  verify_plugins
  verify_link_states
  verify_management_users
  verify_authorization
  verify_topology
  verify_seed_idempotence

  printf 'RabbitMQ demo smoke test passed (%s checks).\n' "$PASS_COUNT"
}

main "$@"

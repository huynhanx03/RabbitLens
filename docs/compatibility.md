# RabbitMQ compatibility matrix

RabbitLens uses the RabbitMQ Management HTTP API. It is a replacement browser
interface, not a RabbitMQ server component. Compatibility means a workflow was
exercised against the stated server version; it does not imply support for every
plugin or custom proxy configuration.

| RabbitMQ version | Management UI/API | Core monitoring and topology | Administration | Optional extensions | Status |
| --- | --- | --- | --- | --- | --- |
| 4.3.2 | `rabbitmq_management` | Verified in the included demo stack | Verified in the included demo stack | Federation, Shovel, Stream, Top, and Tracing are capability-gated | Verified |
| 4.2.x | `rabbitmq_management` | Expected to work; needs a recorded smoke test | Expected to work; needs a recorded smoke test | Capability-gated; needs validation per plugin | Community validation wanted |
| 4.1.x and earlier | `rabbitmq_management` | Not currently verified | Not currently verified | Not currently verified | Unverified |

## Extension behaviour

RabbitLens hides or marks extension pages unavailable unless RabbitMQ advertises
the matching Management API capability. The following optional surfaces require
their corresponding RabbitMQ plugins:

- Federation status and upstreams: `rabbitmq_federation_management`
- Dynamic shovels and status: `rabbitmq_shovel_management`
- Stream connections and super streams: `rabbitmq_stream_management`
- Top processes and ETS tables: `rabbitmq_top`
- Tracing and trace files: `rabbitmq_tracing`

## How to add a verified row

1. Start a clean broker of the target version with `rabbitmq_management`.
2. Run `make smoke`, then exercise login, overview, queues, exchanges,
   connections, channels, users, vhosts, policies, and a deliberately safe
   destructive-action cancel flow.
3. For every enabled extension, verify that the page either works or is clearly
   capability-gated.
4. Open an issue using the bug template with the version, plugin list, results,
   and redacted logs. A maintainer will update this matrix after reproducing it.

Never use this matrix to infer that a production cluster is safe to modify;
test upgrades and recovery procedures in an environment representative of that
cluster.

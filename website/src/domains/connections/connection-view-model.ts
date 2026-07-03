import type { Connection } from "./connection-schema";

export type ConnectionStatus = "running" | "blocked" | "blocking" | "flow" | "closed" | "unknown";

export type ConnectionViewModel = {
  name: string;
  node: string;
  vhost: string;
  user: string;
  protocol: string;
  state: ConnectionStatus;
  ssl: boolean;
  endpoint: string;
  peerEndpoint: string;
  connectedAt: Date | null;
  channels: number;
  sendRate: number | null;
  recvRate: number | null;
  sendBytes: number | null;
  recvBytes: number | null;
};

function resolveState(raw?: string): ConnectionStatus {
  if (!raw) return "unknown";
  const lower = raw.toLowerCase();
  if (lower === "blocked") return "blocked";
  if (lower === "blocking") return "blocking";
  if (lower === "flow") return "flow";
  if (lower === "closed") return "closed";
  if (lower === "running") return "running";
  return "unknown";
}

function formatEndpoint(host?: string, port?: number): string {
  if (!host) return "";
  // IPv6 addresses
  if (host.includes(":")) {
    return port !== undefined ? `[${host}]:${port}` : `[${host}]`;
  }
  return port !== undefined ? `${host}:${port}` : host;
}

export function createConnectionViewModel(raw: Connection): ConnectionViewModel {
  return {
    name: raw.name,
    node: raw.node ?? "",
    vhost: raw.vhost ?? "/",
    user: raw.user ?? "",
    protocol: raw.protocol ?? "AMQP 0-9-1",
    state: resolveState(raw.state),
    ssl: raw.ssl ?? false,
    endpoint: formatEndpoint(raw.host, raw.port),
    peerEndpoint: formatEndpoint(raw.peer_host, raw.peer_port),
    connectedAt: raw.connected_at ? new Date(raw.connected_at) : null,
    channels: raw.channels ?? 0,
    sendRate: raw.send_oct_details?.rate ?? null,
    recvRate: raw.recv_oct_details?.rate ?? null,
    sendBytes: raw.send_oct ?? null,
    recvBytes: raw.recv_oct ?? null,
  };
}

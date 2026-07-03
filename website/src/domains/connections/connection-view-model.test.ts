import { describe, expect, it } from "vitest";
import { createConnectionViewModel } from "./connection-view-model";
import type { Connection } from "./connection-schema";

const BASE: Connection = {
  name: "127.0.0.1:5672 -> 192.168.1.10:42356",
  node: "rabbit@localhost",
  vhost: "/",
  user: "guest",
  protocol: "AMQP 0-9-1",
  state: "running",
  ssl: false,
  peer_host: "192.168.1.10",
  peer_port: 42356,
  host: "127.0.0.1",
  port: 5672,
  connected_at: 1719504000000,
  channels: 3,
  send_oct: 2048,
  recv_oct: 4096,
  send_oct_details: { rate: 100.5 },
  recv_oct_details: { rate: 200.3 },
};

describe("createConnectionViewModel", () => {
  it("maps a typical AMQP connection", () => {
    const vm = createConnectionViewModel(BASE);
    expect(vm.name).toBe("127.0.0.1:5672 -> 192.168.1.10:42356");
    expect(vm.state).toBe("running");
    expect(vm.protocol).toBe("AMQP 0-9-1");
    expect(vm.ssl).toBe(false);
    expect(vm.endpoint).toBe("127.0.0.1:5672");
    expect(vm.peerEndpoint).toBe("192.168.1.10:42356");
    expect(vm.channels).toBe(3);
    expect(vm.sendRate).toBe(100.5);
    expect(vm.recvRate).toBe(200.3);
  });

  it("resolves connection state priority", () => {
    expect(createConnectionViewModel({ ...BASE, state: "blocked" }).state).toBe("blocked");
    expect(createConnectionViewModel({ ...BASE, state: "blocking" }).state).toBe("blocking");
    expect(createConnectionViewModel({ ...BASE, state: "flow" }).state).toBe("flow");
    expect(createConnectionViewModel({ ...BASE, state: undefined }).state).toBe("unknown");
  });

  it("formats IPv6 endpoints correctly", () => {
    const vm = createConnectionViewModel({
      ...BASE,
      host: "::1",
      port: 5672,
      peer_host: "fe80::1",
      peer_port: 9999,
    });
    expect(vm.endpoint).toBe("[::1]:5672");
    expect(vm.peerEndpoint).toBe("[fe80::1]:9999");
  });

  it("handles missing rate details when statistics are disabled", () => {
    const vm = createConnectionViewModel({
      ...BASE,
      send_oct_details: undefined,
      recv_oct_details: undefined,
      send_oct: undefined,
      recv_oct: undefined,
    });
    expect(vm.sendRate).toBeNull();
    expect(vm.recvRate).toBeNull();
    expect(vm.sendBytes).toBeNull();
    expect(vm.recvBytes).toBeNull();
  });

  it("defaults to AMQP 0-9-1 when protocol is missing", () => {
    const vm = createConnectionViewModel({ ...BASE, protocol: undefined });
    expect(vm.protocol).toBe("AMQP 0-9-1");
  });
});

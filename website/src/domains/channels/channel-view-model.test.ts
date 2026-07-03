import { describe, expect, it } from "vitest";
import { createChannelViewModel } from "./channel-view-model";
import { mockChannel } from "@/test/fixtures/channels";

describe("createChannelViewModel", () => {
  it("maps a typical channel", () => {
    const vm = createChannelViewModel(mockChannel);
    expect(vm.name).toBe("127.0.0.1:5672 -> 192.168.1.10:42356 (1)");
    expect(vm.state).toBe("running");
    expect(vm.number).toBe(1);
    expect(vm.consumerCount).toBe(2);
    expect(vm.publishRate).toBe(10.5);
    expect(vm.deliverRate).toBe(8.2);
    expect(vm.ackRate).toBe(7.9);
  });

  it("handles missing rate details gracefully", () => {
    const vm = createChannelViewModel({
      ...mockChannel,
      message_stats: undefined,
    });
    expect(vm.publishRate).toBeNull();
    expect(vm.deliverRate).toBeNull();
    expect(vm.ackRate).toBeNull();
  });

  it("handles missing optional fields", () => {
    const vm = createChannelViewModel({ name: "minimal" });
    expect(vm.name).toBe("minimal");
    expect(vm.state).toBe("unknown");
    expect(vm.number).toBe(0);
    expect(vm.consumerCount).toBe(0);
    expect(vm.publishRate).toBeNull();
  });
});

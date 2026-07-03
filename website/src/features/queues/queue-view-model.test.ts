import { describe, expect, it } from "vitest";
import { createQueueViewModel } from "./queue-view-model";
import { mockQueue, mockQuorumQueue } from "@/test/fixtures/queues";

describe("createQueueViewModel", () => {
  it("maps a typical queue", () => {
    const vm = createQueueViewModel(mockQueue);
    expect(vm.name).toBe("my-queue");
    expect(vm.type).toBe("classic");
    expect(vm.features).toEqual(["D"]);
    expect(vm.publishRate).toBe(5.0);
    expect(vm.deliverRate).toBe(4.5);
  });

  it("collects features for non-durable, auto-delete, exclusive queues", () => {
    const vm = createQueueViewModel({
      ...mockQueue,
      durable: false,
      auto_delete: true,
      exclusive: true,
    });
    expect(vm.features).toEqual(["AD", "Excl"]);
  });

  it("handles quorum queues", () => {
    const vm = createQueueViewModel(mockQuorumQueue);
    expect(vm.type).toBe("quorum");
  });

  it("handles missing optional fields", () => {
    const vm = createQueueViewModel({ name: "minimal" });
    expect(vm.name).toBe("minimal");
    expect(vm.features).toEqual([]);
    expect(vm.publishRate).toBeNull();
  });
});

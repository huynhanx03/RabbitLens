import { describe, expect, it } from "vitest";
import { createNodeViewModel } from "./node-view-model";

describe("createNodeViewModel", () => {
  it.each([
    [{ running: false, mem_alarm: true }, "stopped"],
    [{ running: true, partitions: ["rabbit@two"] }, "partitioned"],
    [{ running: true, mem_alarm: true }, "alarm"],
    [{ running: true, disk_free_alarm: true }, "alarm"],
    [{ running: true }, "healthy"],
  ] as const)("resolves node status priority for %j", (input, expected) => {
    expect(
      createNodeViewModel({ name: "rabbit@one", ...(input as any) }).status,
    ).toBe(expected);
  });

  it("clamps utilization while preserving raw values", () => {
    const viewModel = createNodeViewModel({
      name: "rabbit@one",
      running: true,
      mem_used: 120,
      mem_limit: 100,
      proc_used: 5,
      proc_total: 0,
    });

    expect(viewModel.memory).toEqual({ used: 120, limit: 100, percent: 100 });
    expect(viewModel.processes).toEqual({ used: 5, limit: 0, percent: null });
  });
});

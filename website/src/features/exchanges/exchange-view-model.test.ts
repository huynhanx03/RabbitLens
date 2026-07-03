import { describe, expect, it } from "vitest";
import { createExchangeViewModel } from "./exchange-view-model";
import { mockExchange, mockDefaultExchange, mockCustomExchange } from "@/test/fixtures/exchanges";

describe("createExchangeViewModel", () => {
  it("maps a typical exchange", () => {
    const vm = createExchangeViewModel(mockExchange);
    expect(vm.name).toBe("amq.direct");
    expect(vm.type).toBe("direct");
    expect(vm.features).toEqual(["D"]);
    expect(vm.publishInRate).toBe(2.5);
  });

  it("handles the default exchange empty name", () => {
    const vm = createExchangeViewModel(mockDefaultExchange);
    expect(vm.name).toBe("(AMQP default)");
    expect(vm.features).toEqual(["D"]);
  });

  it("collects features for non-durable, auto-delete, internal exchanges", () => {
    const vm = createExchangeViewModel(mockCustomExchange);
    expect(vm.features).toEqual(["AD", "I"]);
  });

  it("handles missing optional fields", () => {
    const vm = createExchangeViewModel({ name: "minimal" });
    expect(vm.name).toBe("minimal");
    expect(vm.features).toEqual([]);
    expect(vm.publishInRate).toBeNull();
  });
});

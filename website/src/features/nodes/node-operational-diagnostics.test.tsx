import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { NodeOperationalDiagnostics } from "./node-operational-diagnostics";

describe("NodeOperationalDiagnostics", () => {
  it("renders only available operator metrics", () => {
    renderWithProviders(<NodeOperationalDiagnostics node={{
      name: "rabbit@one",
      mnesia_ram_tx_count: 10,
      msg_store_write_count: 20,
      io_read_count: 30,
      io_read_avg_time: 0.5,
      connection_created: 40,
      queue_deleted: 50,
    }} />);
    expect(screen.getByText("Persistence")).toBeVisible();
    expect(screen.getByText("I/O")).toBeVisible();
    expect(screen.getByText("Churn")).toBeVisible();
    expect(screen.queryByText("Schema disk transactions")).not.toBeInTheDocument();
  });
});

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { SuperStreamPage } from "./super-stream-page";

const mutate = vi.fn();

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return { ...actual, useRouteContext: () => ({ apiClient: {} }) };
});

vi.mock("@/domains/admin/vhosts/vhost-query", () => ({
  useVhosts: () => ({ data: [{ name: "/" }, { name: "analytics" }] }),
}));

vi.mock("@/domains/extensions/streams/stream-query", () => ({
  useCreateSuperStream: () => ({ mutate, error: null, isPending: false }),
}));

describe("SuperStreamPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a partitioned super stream with validated JSON arguments", async () => {
    renderWithProviders(<SuperStreamPage />);

    await userEvent.type(screen.getByLabelText("Name"), "orders");
    await userEvent.clear(screen.getByLabelText("Arguments (JSON)"));
    await userEvent.click(screen.getByLabelText("Arguments (JSON)"));
    await userEvent.paste('{"x-max-length":100}');
    await userEvent.click(screen.getByRole("button", { name: "Create super stream" }));

    expect(mutate).toHaveBeenCalledWith(
      {
        vhost: "/",
        name: "orders",
        body: { partitions: 3, arguments: { "x-max-length": 100 } },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("does not submit malformed arguments JSON", async () => {
    renderWithProviders(<SuperStreamPage />);

    await userEvent.type(screen.getByLabelText("Name"), "orders");
    await userEvent.clear(screen.getByLabelText("Arguments (JSON)"));
    await userEvent.type(screen.getByLabelText("Arguments (JSON)"), "invalid");
    await userEvent.click(screen.getByRole("button", { name: "Create super stream" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a valid JSON object.");
    expect(mutate).not.toHaveBeenCalled();
  });

  it("creates a binding-key super stream", async () => {
    renderWithProviders(<SuperStreamPage />);

    await userEvent.type(screen.getByLabelText("Name"), "events");
    await userEvent.click(screen.getByRole("combobox", { name: "Partition strategy" }));
    await userEvent.click(screen.getByRole("option", { name: "Binding keys" }));
    await userEvent.type(screen.getByLabelText("Binding keys"), "created,updated");
    await userEvent.click(screen.getByRole("button", { name: "Create super stream" }));

    expect(mutate).toHaveBeenCalledWith(
      {
        vhost: "/",
        name: "events",
        body: { "binding-keys": "created,updated", arguments: {} },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});

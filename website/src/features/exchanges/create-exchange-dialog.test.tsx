import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { CreateExchangeDialog } from "./create-exchange-dialog";

const mutate = vi.fn();
const onOpenChange = vi.fn();

function getSubmitButton() {
  const submit = screen
    .getByRole("dialog")
    .querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!submit) throw new Error("Create Exchange submit button is missing");
  return submit;
}

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return { ...actual, useRouteContext: () => ({ apiClient: {} }) };
});

vi.mock("@/domains/exchanges/exchange-query", () => ({
  useCreateExchangeMutation: () => ({ mutate, error: null, isPending: false }),
}));

describe("CreateExchangeDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an internal topic exchange with explicit durability settings", async () => {
    renderWithProviders(<CreateExchangeDialog vhost="/" open onOpenChange={onOpenChange} />);

    await userEvent.type(screen.getByLabelText("Name"), "events");
    await userEvent.click(screen.getByLabelText("Type", { selector: "#type" }));
    await userEvent.click(screen.getByRole("option", { name: "topic" }));
    await userEvent.click(screen.getByRole("combobox", { name: "Internal" }));
    await userEvent.click(screen.getByRole("option", { name: "Yes" }));
    await userEvent.click(getSubmitButton());

    expect(mutate).toHaveBeenCalledWith(
      {
        vhost: "/",
        name: "events",
        request: {
          type: "topic",
          durable: true,
          auto_delete: false,
          internal: true,
          arguments: {},
        },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("shows validation before an unnamed exchange can be created", async () => {
    renderWithProviders(<CreateExchangeDialog vhost="/" open onOpenChange={onOpenChange} />);

    await userEvent.click(getSubmitButton());

    expect(await screen.findByText("Name is required")).toBeVisible();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("clears a draft when its controlled dialog closes externally", async () => {
    const view = renderWithProviders(
      <CreateExchangeDialog vhost="/" open onOpenChange={onOpenChange} />,
    );

    await userEvent.type(screen.getByLabelText("Name"), "temporary-events");
    view.rerender(<CreateExchangeDialog vhost="/" open={false} onOpenChange={onOpenChange} />);
    view.rerender(<CreateExchangeDialog vhost="/" open onOpenChange={onOpenChange} />);

    expect(screen.getByLabelText("Name")).toHaveValue("");
  });
});

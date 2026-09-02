import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/api-error";
import { renderWithProviders } from "@/test/render";
import { ShovelManagementPage } from "./shovel-management-page";

const removeMutate = vi.fn();
const saveMutate = vi.fn();
const refetch = vi.fn();
let queryError = false;

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: () => ({
      data: [
        {
          vhost: "/",
          name: "move-orders",
          value: {
            "src-uri": "amqp://alice:source-secret@source.example/vhost",
            "dest-uri": "amqps://bob:destination-secret@dest.example/vhost",
          },
        },
      ],
      isPending: false,
      isError: queryError,
      error: queryError ? new ApiError("network", undefined, true, "shovels unavailable") : null,
      refetch,
    }),
  };
});

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouteContext: () => ({ apiClient: {} }),
    Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
  };
});

vi.mock("@/domains/admin/vhosts/vhost-query", () => ({
  useVhosts: () => ({ data: [{ name: "/" }] }),
}));

vi.mock("@/domains/extensions/shovels/shovel-parameter-query", () => ({
  shovelParameterListQueryOptions: vi.fn(),
  useSaveShovel: () => ({ mutate: saveMutate, error: null, isPending: false }),
  useDeleteShovel: () => ({ mutate: removeMutate, error: null, isPending: false }),
}));

describe("ShovelManagementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryError = false;
  });

  it("redacts URI credentials and deletes the selected shovel after confirmation", async () => {
    renderWithProviders(<ShovelManagementPage />);

    expect(screen.getByText("move-orders")).toBeVisible();
    expect(screen.getByText(/alice:\*\*\*@source\.example/)).toBeVisible();
    expect(screen.queryByText("source-secret")).not.toBeInTheDocument();
    expect(screen.queryByText("destination-secret")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Delete move-orders" }));
    expect(screen.getByText("Delete move-orders? Message transfer will stop.")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(removeMutate).toHaveBeenCalledWith(
      expect.objectContaining({ vhost: "/", name: "move-orders" }),
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("creates a shovel from the shared parameter form and closes after success", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShovelManagementPage />);

    await user.click(screen.getByRole("button", { name: "Add shovel" }));
    await user.type(screen.getByLabelText("Name"), "archive-orders");
    await user.clear(screen.getByLabelText("Value (JSON)"));
    await user.click(screen.getByLabelText("Value (JSON)"));
    await user.paste('{"src-uri":"amqp://source","dest-uri":"amqp://destination"}');
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(saveMutate).toHaveBeenCalledWith(
      {
        vhost: "/",
        name: "archive-orders",
        value: { "src-uri": "amqp://source", "dest-uri": "amqp://destination" },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );

    const callbacks = saveMutate.mock.calls[0]?.[1] as { onSuccess: () => void };
    await act(async () => callbacks.onSuccess());
    expect(screen.queryByRole("form", { name: "JSON parameter form" })).not.toBeInTheDocument();
  });

  it("retries the shovel query after a recoverable load failure", async () => {
    queryError = true;
    renderWithProviders(<ShovelManagementPage />);

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});

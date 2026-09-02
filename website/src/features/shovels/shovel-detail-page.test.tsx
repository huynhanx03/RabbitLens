import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ShovelDetailPage } from "./shovel-detail-page";

const mutate = vi.fn();
const navigate = vi.fn();

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: () => ({
      data: {
        vhost: "/",
        name: "move-orders",
        value: { "src-uri": "amqp://source", "dest-uri": "amqp://destination" },
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    }),
  };
});

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouteContext: () => ({ apiClient: {} }),
    useNavigate: () => navigate,
  };
});

vi.mock("@/domains/extensions/shovels/shovel-parameter-query", () => ({
  shovelParameterDetailQueryOptions: vi.fn(),
  useSaveShovel: () => ({ mutate, error: null, isPending: false }),
}));

describe("ShovelDetailPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("edits the loaded dynamic shovel and returns to management after success", async () => {
    renderWithProviders(<ShovelDetailPage vhost="/" name="move-orders" />);

    expect(screen.getByRole("heading", { name: "move-orders" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(mutate).toHaveBeenCalledWith(
      {
        vhost: "/",
        name: "move-orders",
        value: { "src-uri": "amqp://source", "dest-uri": "amqp://destination" },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );

    const callbacks = mutate.mock.calls[0]?.[1] as { onSuccess?: () => void } | undefined;
    callbacks?.onSuccess?.();
    expect(navigate).toHaveBeenCalledWith({ to: "/extensions/shovels/management" });
  });
});

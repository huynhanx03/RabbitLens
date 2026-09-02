import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/api-error";
import { renderWithProviders } from "@/test/render";
import { FederationUpstreamListPage } from "./federation-upstream-list-page";

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
          name: "remote",
          value: { uri: "amqps://alice:secret@remote.example/vhost" },
        },
      ],
      isPending: false,
      isError: queryError,
      error: queryError ? new ApiError("network", undefined, true, "upstreams unavailable") : null,
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

vi.mock("@/domains/extensions/federation/federation-upstream-query", () => ({
  federationUpstreamListQueryOptions: vi.fn(),
  useSaveFederationUpstream: () => ({ mutate: saveMutate, error: null, isPending: false }),
  useDeleteFederationUpstream: () => ({ mutate: removeMutate, error: null, isPending: false }),
}));

describe("FederationUpstreamListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryError = false;
  });

  it("redacts a remote URI and confirms the selected upstream deletion", async () => {
    renderWithProviders(<FederationUpstreamListPage />);

    expect(screen.getByText("remote")).toBeVisible();
    expect(screen.getByText(/alice:\*\*\*@remote\.example/)).toBeVisible();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Delete remote" }));
    expect(screen.getByText("Are you sure you want to delete this upstream?")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(removeMutate).toHaveBeenCalledWith(
      expect.objectContaining({ vhost: "/", name: "remote" }),
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("saves a new upstream through the shared parameter form", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FederationUpstreamListPage />);

    await user.click(screen.getByRole("button", { name: "Add a new upstream" }));
    await user.type(screen.getByLabelText("Name"), "standby");
    await user.clear(screen.getByLabelText("Value (JSON)"));
    await user.click(screen.getByLabelText("Value (JSON)"));
    await user.paste('{"uri":"amqp://standby.example"}');
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(saveMutate).toHaveBeenCalledWith(
      {
        vhost: "/",
        name: "standby",
        value: { uri: "amqp://standby.example" },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("retries the upstream query after a recoverable load failure", async () => {
    queryError = true;
    renderWithProviders(<FederationUpstreamListPage />);

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});

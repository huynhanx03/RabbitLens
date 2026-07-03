import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppErrorBoundary } from "./app-error-boundary";
import { resolveListPath } from "./resolve-list-path";
import { ApiError } from "@/api/api-error";
import { renderWithProviders } from "@/test/render";

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouter: vi.fn().mockReturnValue({
      history: { back: vi.fn() },
    }),
    useRouterState: vi.fn().mockReturnValue({
      location: { pathname: "/" },
    }),
    Link: ({ to, children }: any) => <a href={to}>{children}</a>,
  };
});

describe("AppErrorBoundary", () => {
  it("resolves nested detail routes to their real list", () => {
    expect(resolveListPath("/queues/vhost.queue")).toBe("/queues");
    expect(resolveListPath("/admin/users/guest")).toBe("/admin/users");
    expect(resolveListPath("/channels/client-1")).toBe("/channels");
    expect(resolveListPath("/extensions/federation/link-1")).toBe(
      "/extensions/federation/status",
    );
    expect(resolveListPath("/extensions/tracing/trace-1")).toBe(
      "/extensions/tracing",
    );
  });
  it("renders unexpected error by default", () => {
    renderWithProviders(
      <AppErrorBoundary error={new Error("boom")} reset={vi.fn()} />
    );
    expect(screen.getByText("RabbitMQ request failed")).toBeInTheDocument();
  });

  it("renders specific ApiError translation", () => {
    const error = new ApiError("timeout", undefined, true, "timed out");
    renderWithProviders(<AppErrorBoundary error={error} reset={vi.fn()} />);
    expect(screen.getByText("RabbitMQ did not respond in time.")).toBeInTheDocument();
  });

  it("calls reset when retry is clicked", async () => {
    const reset = vi.fn();
    const error = new ApiError("network", undefined, true, "network failed");
    renderWithProviders(<AppErrorBoundary error={error} reset={reset} />);
    
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalled();
  });

  it("hides retry button for non-retryable errors", () => {
    const error = new ApiError("validation", 400, false, "bad request");
    renderWithProviders(<AppErrorBoundary error={error} reset={vi.fn()} />);
    
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("offers return to list for 404 on a detail page", async () => {
    const { useRouterState, useRouter } = await import("@tanstack/react-router");
    const mockBack = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      history: { back: mockBack },
    } as any);
    vi.mocked(useRouterState).mockReturnValue({
      location: { pathname: "/queues/vhost/my-queue" },
    } as any);

    const error = new ApiError("not-found", 404, false, "not found");
    renderWithProviders(<AppErrorBoundary error={error} reset={vi.fn()} />);
    
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(screen.getByText("This resource no longer exists.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to list" })).toHaveAttribute("href", "/queues");

    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(mockBack).toHaveBeenCalled();
  });
});

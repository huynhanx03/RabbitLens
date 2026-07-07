import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/api-error";
import { createAppI18n } from "@/i18n/i18n";
import { I18nextProvider } from "react-i18next";
import { AsyncState } from "./async-state";

async function renderState(
  props: Partial<React.ComponentProps<typeof AsyncState>> = {},
) {
  const i18n = await createAppI18n("en");
  render(
    <I18nextProvider i18n={i18n}>
      <AsyncState {...props}>
        <div>Loaded content</div>
      </AsyncState>
    </I18nextProvider>,
  );
}

describe("AsyncState", () => {
  it("renders initial loading and background refresh separately", async () => {
    await renderState({ isPending: true });
    expect(screen.getByRole("status")).toHaveTextContent("Loading");

    await renderState({ isFetching: true });
    expect(screen.getByText("Refreshing data")).toBeInTheDocument();
    expect(screen.getByText("Loaded content")).toBeInTheDocument();
  });

  it("renders a safe permission error without retry", async () => {
    await renderState({
      isError: true,
      error: new ApiError("forbidden", 403, false, "server detail"),
      onRetry: vi.fn(),
    });

    expect(screen.getByText("You do not have permission to view this data.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    expect(screen.queryByText("server detail")).not.toBeInTheDocument();
  });

  it("offers retry for retryable connection errors", async () => {
    const onRetry = vi.fn();
    await renderState({
      isError: true,
      error: new ApiError("network", undefined, true, "private detail"),
      onRetry,
    });

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("preserves stale content when a background refresh fails", async () => {
    await renderState({
      hasData: true,
      isError: true,
      error: new ApiError("server", 503, true, "temporary failure"),
      onRetry: vi.fn(),
    });

    expect(screen.getByText("Loaded content")).toBeVisible();
    expect(screen.getByText("Showing previously loaded data.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  it("renders the localized empty state", async () => {
    await renderState({ isEmpty: true });
    expect(screen.getByText("No results.")).toBeInTheDocument();
  });

  it("offers a typed recovery action for a deleted resource", async () => {
    await renderState({
      isError: true,
      error: new ApiError("not-found", 404, false, "private detail"),
      notFoundAction: <a href="/queues">Return to queues</a>,
    });

    expect(screen.getByText("This resource no longer exists.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Return to queues" })).toHaveAttribute("href", "/queues");
  });

  it("renders contextual empty copy and action", async () => {
    await renderState({
      isEmpty: true,
      emptyTitle: "No queues",
      emptyDescription: "Create a queue to get started.",
      emptyAction: <button type="button">Create queue</button>,
    });
    expect(screen.getByText("No queues")).toBeVisible();
    expect(screen.getByText("Create a queue to get started.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Create queue" })).toBeVisible();
  });
});

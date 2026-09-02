import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/api-error";
import { renderWithProviders } from "@/test/render";
import { TracingPage } from "./tracing-page";

const client = { request: vi.fn(), requestVoid: vi.fn(), requestBlob: vi.fn() };
let traceFiles: Array<{ name: string; size: number; mtime: string }> = [];

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual("@tanstack/react-router")),
  Link: ({ children }: { children: React.ReactNode }) => <a href="/test">{children}</a>,
  useRouteContext: () => ({ apiClient: client }),
}));

describe("TracingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    traceFiles = [];
    client.request.mockImplementation((path: string) => {
      if (path === "/nodes") return Promise.resolve([{ name: "rabbit@node" }]);
      if (path === "/vhosts") return Promise.resolve([{ name: "/" }]);
      if (path === "/traces/node/rabbit%40node") {
        return Promise.resolve([{ vhost: "/", name: "audit", format: "json", pattern: "#" }]);
      }
      if (path === "/trace-files/node/rabbit%40node") return Promise.resolve(traceFiles);
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
    client.requestVoid.mockResolvedValue(undefined);
  });

  it("confirms before stopping a node-scoped trace", async () => {
    renderWithProviders(<TracingPage />);
    await waitFor(() => expect(screen.getByText("audit")).toBeVisible());

    await userEvent.click(screen.getByRole("button", { name: "Stop trace audit" }));
    expect(client.requestVoid).not.toHaveBeenCalled();

    const dialog = screen.getByRole("alertdialog", { name: "Stop trace" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Stop trace" }));

    await waitFor(() =>
      expect(client.requestVoid).toHaveBeenCalledWith("/traces/node/rabbit%40node/%2F/audit", {
        method: "DELETE",
      }),
    );
  });

  it("confirms before deleting a node-scoped trace file", async () => {
    traceFiles = [{ name: "audit.log", size: 512, mtime: "2026-09-01T00:00:00.000Z" }];
    renderWithProviders(<TracingPage />);

    await userEvent.click(screen.getByRole("tab", { name: "Trace log files" }));
    await waitFor(() => expect(screen.getByText("audit.log")).toBeVisible());
    await userEvent.click(screen.getByRole("button", { name: "Delete trace file audit.log" }));

    const dialog = screen.getByRole("alertdialog", { name: "Delete trace file" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete trace file" }));

    await waitFor(() =>
      expect(client.requestVoid).toHaveBeenCalledWith("/trace-files/node/rabbit%40node/audit.log", {
        method: "DELETE",
      }),
    );
  });

  it("downloads the selected node-scoped trace file and releases its object URL", async () => {
    traceFiles = [{ name: "audit.log", size: 512, mtime: "2026-09-01T00:00:00.000Z" }];
    const createObjectUrl = vi.fn(() => "blob:audit-log");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.stubGlobal("URL", { createObjectURL: createObjectUrl, revokeObjectURL: revokeObjectUrl });
    client.requestBlob.mockResolvedValue(new Blob(["trace content"], { type: "text/plain" }));

    renderWithProviders(<TracingPage />);
    await userEvent.click(screen.getByRole("tab", { name: "Trace log files" }));
    await waitFor(() => expect(screen.getByText("audit.log")).toBeVisible());
    await userEvent.click(screen.getByRole("button", { name: "Download trace file audit.log" }));

    await waitFor(() =>
      expect(client.requestBlob).toHaveBeenCalledWith("/trace-files/node/rabbit%40node/audit.log"),
    );
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:audit-log");

    click.mockRestore();
    vi.unstubAllGlobals();
  });

  it("retries both node and trace queries after a retryable RabbitMQ failure", async () => {
    const retryableFailure = new ApiError("network", undefined, true, "RabbitMQ is unreachable");
    client.request.mockImplementation((path: string) => {
      if (path === "/nodes") return Promise.resolve([{ name: "rabbit@node" }]);
      if (path === "/vhosts") return Promise.resolve([{ name: "/" }]);
      if (path === "/traces/node/rabbit%40node") return Promise.reject(retryableFailure);
      if (path === "/trace-files/node/rabbit%40node") return Promise.resolve([]);
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
    renderWithProviders(<TracingPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Try again" }));

    await waitFor(() =>
      expect(
        client.request.mock.calls.filter(([path]) => path === "/traces/node/rabbit%40node"),
      ).toHaveLength(2),
    );
  });
});

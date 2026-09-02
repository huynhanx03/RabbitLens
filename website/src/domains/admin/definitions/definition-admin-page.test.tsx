import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { definitionApi } from "./definition-api";
import { DefinitionAdminPage } from "./definition-admin-page";

const client = { request: vi.fn(), requestVoid: vi.fn() };
let permission = "allow";

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return { ...actual, useRouteContext: () => ({ apiClient: client }) };
});

vi.mock("@/auth/permissions/permission-gate", () => ({
  usePermissionDecision: () => ({ kind: permission }),
}));

vi.mock("./definition-api", () => ({
  definitionApi: { exportDefinitions: vi.fn(), importDefinitions: vi.fn() },
}));

describe("DefinitionAdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permission = "allow";
    client.request.mockResolvedValue([{ name: "/" }]);
    vi.mocked(definitionApi.exportDefinitions).mockResolvedValue({ version: "3.13.0" });
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:definitions"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("exports all definitions and preserves labelled vhost controls", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderWithProviders(<DefinitionAdminPage />);

    expect(screen.getAllByRole("combobox", { name: "Virtual Host" })).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Download definitions" }));

    await waitFor(() =>
      expect(definitionApi.exportDefinitions).toHaveBeenCalledWith(client, undefined),
    );
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:definitions");
    expect(click).toHaveBeenCalledOnce();
    click.mockRestore();
  });

  it("does not expose backup or restore controls without administrator permission", () => {
    permission = "deny";
    renderWithProviders(<DefinitionAdminPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Permission denied");
    expect(screen.queryByRole("button", { name: "Download definitions" })).not.toBeInTheDocument();
  });

  it("rejects a JSON array before it can be imported as definitions", async () => {
    renderWithProviders(<DefinitionAdminPage />);
    const invalidDefinitions = new File(["[]"], "definitions.json", {
      type: "application/json",
    });

    await userEvent.upload(screen.getByLabelText("Definitions File"), invalidDefinitions);
    await userEvent.click(screen.getByRole("button", { name: "Upload definitions" }));

    await waitFor(() =>
      expect(screen.getByText("Select a valid RabbitMQ definitions JSON file.")).toBeVisible(),
    );
    expect(definitionApi.importDefinitions).not.toHaveBeenCalled();
  });
});

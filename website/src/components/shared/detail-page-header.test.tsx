import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { DetailPageHeader } from "./detail-page-header";

describe("DetailPageHeader", () => {
  it("keeps identity, context, status and actions in one responsive header", () => {
    renderWithProviders(
      <DetailPageHeader
        backAction={<a href="/connections">Back</a>}
        title="client-1"
        description="Connection details"
        status={<span>Running</span>}
        metadata={["admin", "/demo"]}
        actions={<button type="button">Close</button>}
      />,
    );

    expect(screen.getByRole("heading", { name: "client-1" })).toBeVisible();
    expect(screen.getByText("Running")).toBeVisible();
    expect(screen.getByText("admin")).toBeVisible();
    expect(screen.getByRole("button", { name: "Close" })).toBeVisible();
  });
});

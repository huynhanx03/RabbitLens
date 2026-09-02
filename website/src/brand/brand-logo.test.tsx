import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";
import { BrandLogo } from "./brand-logo";

describe("BrandLogo", () => {
  it("gives the complete lockup an accessible RabbitLens name", () => {
    renderWithProviders(<BrandLogo variant="lockup" />);

    expect(screen.getByRole("img", { name: "RabbitLens" })).toBeInTheDocument();
    expect(screen.getByText("RabbitLens")).toBeVisible();
  });

  it("keeps the compact mark accessible without duplicating wordmark text", () => {
    renderWithProviders(<BrandLogo variant="mark" />);

    expect(screen.getByRole("img", { name: "RabbitLens" })).toBeInTheDocument();
    expect(screen.queryByText("RabbitLens")).not.toBeInTheDocument();
  });
});

import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ConfigurationErrorPage } from "./configuration-error-page";

const originalUrl = window.location.href;

afterEach(() => {
  window.history.replaceState({}, "", originalUrl);
});

describe("ConfigurationErrorPage", () => {
  it("preserves the current operator route when offering a return to login", () => {
    window.history.replaceState({}, "", "/queues?name=orders");
    renderWithProviders(<ConfigurationErrorPage />);

    expect(screen.getByRole("heading", { name: "RabbitLens is not configured" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Back to login" })).toHaveAttribute(
      "href",
      "/login?redirect=%2Fqueues%3Fname%3Dorders",
    );
  });

  it("offers a visible reload action for a broken runtime configuration", () => {
    renderWithProviders(<ConfigurationErrorPage />);

    expect(screen.getByRole("button", { name: "Reload page" })).toBeVisible();
  });
});

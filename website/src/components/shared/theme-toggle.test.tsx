import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ThemeContext,
  type ThemeContextValue,
} from "@/app/providers/theme-context";
import { ThemeToggle } from "./theme-toggle";

const setPreference = vi.fn();

function renderThemeToggle(
  overrides: Partial<ThemeContextValue> = {},
) {
  const theme: ThemeContextValue = {
    preference: "dark",
    resolvedTheme: "dark",
    setPreference,
    ...overrides,
  };

  render(
    <ThemeContext.Provider value={theme}>
      <ThemeToggle />
    </ThemeContext.Provider>,
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => setPreference.mockClear());

  it("announces and changes the selected theme", async () => {
    const user = userEvent.setup();
    renderThemeToggle();

    await user.click(screen.getByRole("button", { name: "Theme" }));
    expect(screen.getByRole("menu")).toHaveClass("min-w-44");
    expect(screen.getByTestId("theme-option-light-icon")).toBeInTheDocument();
    expect(screen.getByTestId("theme-option-dark-icon")).toBeInTheDocument();
    expect(screen.getByTestId("theme-option-system-icon")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemradio", { name: "Dark" }),
    ).toHaveAttribute("aria-checked", "true");

    await user.click(
      screen.getByRole("menuitemradio", { name: "Light" }),
    );
    expect(setPreference).toHaveBeenCalledWith("light");
  });
});

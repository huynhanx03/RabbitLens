import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import { createAppI18n } from "@/i18n/i18n";
import { LanguageToggle } from "./language-toggle";

describe("LanguageToggle", () => {
  it("announces and changes the selected language", async () => {
    const user = userEvent.setup();
    const i18n = await createAppI18n("en");
    await i18n.changeLanguage("en");

    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>,
    );

    expect(screen.getByTestId("language-trigger-flag")).toHaveTextContent(
      "🇬🇧",
    );
    await user.click(screen.getByRole("button", { name: "Language" }));
    expect(screen.getByRole("menu")).toHaveClass("min-w-48");
    expect(screen.getByText("EN")).toBeInTheDocument();
    expect(screen.getByText("VI")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemradio", { name: "English" }),
    ).toHaveAttribute("aria-checked", "true");

    await user.click(
      screen.getByRole("menuitemradio", { name: "Tiếng Việt" }),
    );
    expect(i18n.language).toBe("vi");
  });
});

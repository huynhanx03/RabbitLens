import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { createApplication } from "./bootstrap";

const validConfig = {
  apiBaseUrl: "/api",
  auth: { basic: true, oauth: null },
  defaultLocale: "en",
  defaultTheme: "system",
} as const;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("createApplication", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light", "dark", "system");
  });

  it("mounts the app only after runtime configuration is valid", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(validConfig));

    render(await createApplication(fetcher));

    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("honors a stored locale over the deployment default", async () => {
    localStorage.setItem(PRODUCT_DEFAULTS.persistenceKeys.locale, "vi");
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(validConfig));

    render(await createApplication(fetcher));

    expect(document.documentElement.lang).toBe("vi");
  });

  it("applies the deployment theme preference", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        ...validConfig,
        defaultTheme: "dark",
      }),
    );

    render(await createApplication(fetcher));

    expect(document.documentElement).toHaveClass("dark");
  });

  it("renders a localized error without making API calls when config is invalid", async () => {
    localStorage.setItem(PRODUCT_DEFAULTS.persistenceKeys.locale, "vi");
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({}, 503));

    render(await createApplication(fetcher));

    expect(
      screen.getByRole("heading", { name: "RabbitLens chưa được cấu hình" }),
    ).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0]?.[0]).toEqual(
      new URL("/runtime-config.json", window.location.origin),
    );
    expect(screen.getByRole("link", { name: "Về đăng nhập" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("button", { name: "Tải lại trang" })).toBeInTheDocument();
  });
});

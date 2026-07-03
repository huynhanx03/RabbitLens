import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  getOAuthFailureTranslationKey,
  reportOAuthFailure,
} from "./oauth-error";

describe("OAuth failure boundary", () => {
  it("maps failures to fixed translation keys", () => {
    expect(getOAuthFailureTranslationKey("login")).toBe(
      "auth.oauth.loginFailedDescription",
    );
    expect(getOAuthFailureTranslationKey("logout")).toBe(
      "auth.oauth.logoutFailedDescription",
    );
  });

  it("never sends provider-controlled details to diagnostics", () => {
    const logger = vi.fn();
    const providerError = new Error(
      "code=secret-code state=secret-state token=secret-token",
    );

    reportOAuthFailure("login", providerError, logger);

    expect(logger).toHaveBeenCalledWith("OAuth login failed");
    expect(JSON.stringify(logger.mock.calls)).not.toContain("secret-");
  });

  it.each([
    "src/auth/oauth/oauth-resource-picker.tsx",
    "src/app/routes/oauth.callback.tsx",
    "src/app/routes/oauth.logout-callback.tsx",
    "src/app/routes/oauth.silent-callback.tsx",
  ])("keeps %s free of raw diagnostics and visible English", (file) => {
    const source = readFileSync(resolve(process.cwd(), file), "utf8");

    expect(source, file).not.toMatch(
      /console\.(?:error|warn)|Login Failed|Logout Error|Completing login|Completing logout|Redirecting\.\.\./,
    );
  });
});

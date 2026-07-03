import { beforeEach, describe, expect, it } from "vitest";
import { en } from "./locales/en";
import { vi } from "./locales/vi";
import { createAppI18n } from "./i18n";

function flattenKeys(value: object, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof nestedValue === "object" && nestedValue !== null
      ? flattenKeys(nestedValue, path)
      : [path];
  });
}

describe("createAppI18n", () => {
  beforeEach(() => localStorage.clear());

  it("uses English as fallback and can switch completely to Vietnamese", async () => {
    const instance = await createAppI18n("en");
    expect(instance.t("common.appName")).toBe("RabbitLens");

    await instance.changeLanguage("vi");
    expect(instance.t("auth.signIn")).toBe("Đăng nhập");
    expect(localStorage.getItem("rabbitlens.locale")).toBe("vi");
  });
});

it("keeps English and Vietnamese key sets identical", () => {
  expect(flattenKeys(vi).sort()).toEqual(flattenKeys(en).sort());
});

it("defines every application shell key in both locales", () => {
  const shellKeys = [
    "nav.groups.monitor",
    "nav.groups.topology",
    "nav.groups.administration",
    "nav.groups.extensions",
    "nav.openMenu",
    "nav.command",
    "nav.commandPlaceholder",
    "nav.noCommandResults",
    "account.menu",
    "deprecatedFeatures.title",
    "auth.oauth.loginWith",
    "auth.oauth.redirecting",
    "auth.oauth.loginFailedTitle",
    "auth.oauth.loginFailedDescription",
    "auth.oauth.logoutFailedTitle",
    "auth.oauth.logoutFailedDescription",
    "auth.oauth.returnToLogin",
    "auth.oauth.completingLogin",
    "auth.oauth.completingLogout",
  ];

  expect(flattenKeys(en)).toEqual(expect.arrayContaining(shellKeys));
  expect(flattenKeys(vi)).toEqual(expect.arrayContaining(shellKeys));
});

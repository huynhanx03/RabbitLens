import type { Page } from "@playwright/test";

export async function openAppNavigation(page: Page): Promise<void> {
  const navigation = page.getByRole("navigation", {
    name: "Primary navigation",
  });
  if (await navigation.isVisible()) return;

  await page.getByRole("button", { name: "Open navigation" }).click();
  await navigation.waitFor({ state: "visible" });
}

export async function navigateTo(
  page: Page,
  name: string,
  exact = true,
): Promise<void> {
  await openAppNavigation(page);
  await page.getByRole("link", { name, exact }).click();
}

import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "로그인이 필요합니다." }),
    }),
  );
});

test("320px 화면에서 가로로 넘치지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("넓은 화면에서 앱 열은 448px로 고정되어 가운데 놓인다", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const box = await page.locator(".auth-page").boundingBox();

  expect(box).not.toBeNull();
  expect(box!.width).toBe(448);
  expect(Math.round(box!.x)).toBe(416);
  expect(box!.height).toBeGreaterThanOrEqual(800);
});

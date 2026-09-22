import { test, expect } from "@playwright/test";

/**
 * Desk v2 smoke: pages render, depth control persists, unfolds respond,
 * terms explain, figures show provenance, walkthrough steps.
 */
const PAGES = ["/", "/tracker", "/costs", "/industries", "/engage", "/compute", "/brief", "/letter"];

for (const path of PAGES) {
  test(`${path} renders without page errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    const res = await page.goto(path);
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator("main.desk-page")).toBeVisible();
    await expect(page.locator("h1.desk-h1")).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("depth control opens and closes every unfold and persists via ?v=", async ({ page, isMobile }) => {
  await page.goto("/costs");
  const scope = isMobile ? ".desk-strip" : ".desk-rail";
  const depth = (d: string) => page.locator(`${scope} [aria-label="Reading depth"] button[data-depth="${d}"]`);
  await depth("technical").click();
  const total = await page.locator(".unfold").count();
  await expect(page.locator('.unfold[data-open="true"]')).toHaveCount(total);
  expect(new URL(page.url()).searchParams.get("v")).toBe("tech");
  await depth("plain").click();
  await expect(page.locator('.unfold[data-open="true"]')).toHaveCount(0);
  await page.goto("/tracker?v=guided");
  await expect(page.locator(`${scope} button[data-depth="guided"]`)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".unfold-teaser").first()).toBeVisible();
});

test("a term opens an explainer and a figure shows its source", async ({ page }) => {
  await page.goto("/costs");
  await page.locator("button.term").first().click();
  await expect(page.locator(".term-pop")).toBeVisible();
  await expect(page.locator(".term-pop dt").first()).toHaveText("What it is");
  await page.keyboard.press("Escape");
  await expect(page.locator(".term-pop")).toHaveCount(0);
  await page.locator(".figure-btn").first().click();
  await expect(page.locator(".figure-prov")).toBeVisible();
  await expect(page.locator(".figure-prov .desk-chip")).toBeVisible();
});

test("walkthrough steps through the home page", async ({ page, isMobile }) => {
  await page.goto("/");
  const scope = isMobile ? ".desk-strip" : ".desk-rail";
  await page.locator(`${scope} button.walk-launch`).click();
  await expect(page.locator(".walk-bar")).toBeVisible();
  await expect(page.locator(".walk-step")).toHaveText("Step 1 of 5");
  await page.locator(".walk-actions button", { hasText: "Next" }).click();
  await expect(page.locator(".walk-step")).toHaveText("Step 2 of 5");
  await page.keyboard.press("Escape");
  await expect(page.locator(".walk-bar")).toHaveCount(0);
});

test("the unknown board counts the tracker's not-published rows", async ({ page }) => {
  await page.goto("/tracker");
  const slots = await page.locator(".unknown-slot").count();
  const rows = await page.locator('.desk-board-col[aria-label="Not published"] article').count();
  expect(slots).toBe(rows);
  expect(slots).toBeGreaterThanOrEqual(3);
});

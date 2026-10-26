import { test, expect } from "@playwright/test";

/**
 * Desk v2 smoke: pages render, depth control persists, unfolds respond,
 * terms explain, figures show provenance, walkthrough steps.
 */
const PAGES = [
  "/",
  "/build",
  "/capital",
  "/consent",
  "/power",
  "/tracker",
  "/costs",
  "/industries",
  "/engage",
  "/compute",
  "/brief",
  "/letter",
  "/about",
  "/ask",
  "/privacy",
  "/terms",
];

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

test("home names the company and offers a way into each track", async ({ page, isMobile }) => {
  await page.goto("/");
  const main = page.locator("main.desk-page");
  const h1 = page.locator("h1.desk-h1");
  await expect(h1).toContainText("An AI company.");
  await expect(h1).toContainText("A proposed Labrador AI campus.");
  await expect(h1).not.toContainText("Churchill");
  await expect(main).toContainText("Open People is a Newfoundland and Labrador company.");
  await expect(main).toContainText("Open People leads a proposed 500 MW Labrador AI campus, in feasibility.");
  await expect(main).toContainText("Ottawa is looking for projects like this");
  await expect(main).not.toContainText("Ottawa is already paying");
  for (const job of [
    "The campus and the research campus.",
    "The money for the project.",
    "Indigenous partnership.",
    "Power for the campus.",
  ]) {
    await expect(main).toContainText(job);
  }
  const subjects = ["Build", "Capital", "Consent", "Power"];
  for (const subject of subjects) {
    const link = page.locator("main").getByRole("link", { name: "Work this track" }).nth(subjects.indexOf(subject));
    await expect(link).toHaveAttribute("href", new RegExp(encodeURIComponent(`Open People — ${subject}`)));
  }
  const navLabels = ["About", ...subjects];
  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
    const sheet = page.locator(".desk-nav-sheet");
    for (const label of navLabels) {
      await expect(sheet.getByRole("link", { name: label })).toBeVisible();
    }
  } else {
    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const label of navLabels) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
  }
  await expect(page.locator('a[href="/coalition"]')).toHaveCount(0);
});

test("the unknown board counts the tracker's not-published rows", async ({ page }) => {
  await page.goto("/tracker");
  const slots = await page.locator(".unknown-slot").count();
  const rows = await page.locator('.desk-board-col[aria-label="Not published"] article').count();
  expect(slots).toBe(rows);
  expect(slots).toBeGreaterThanOrEqual(3);
});

test("/about keeps Tom’s close and /vision and /approach land there", async ({ page, isMobile }) => {
  await page.goto("/vision");
  await expect(page).toHaveURL(/\/about$/);
  await page.goto("/approach");
  await expect(page).toHaveURL(/\/about$/);
  const main = page.locator("main.desk-page");
  await expect(main).toContainText("People who care for this land should");
  await expect(main).toContainText("prosper from it");
  await expect(main).toContainText("People working toward a shared goal should share in what it yields.");
  await expect(main).toContainText("Big goals raise hard questions");
  await expect(main).toContainText("Explorers bring us together.");
  await expect(main).toContainText("Tom Lane");
  await expect(main).toContainText("tom@openpeople.ai");
  await expect(main).toContainText("The power record is the public evidence on the power.");
  const scope = isMobile ? ".desk-strip" : ".desk-rail";
  await expect(page.locator(`${scope} [aria-label="Reading depth"]`)).toBeVisible();
});

test("/ask states the locked intro and the follow-up form", async ({ page }) => {
  await page.goto("/ask");
  const main = page.locator("main.desk-page");
  await expect(main).toContainText(
    "Ask anything about Open People's preliminary proposal. Answers are honest and labelled. If we don't know yet, we'll find out and email you.",
  );
  await expect(main).toContainText("Email Tom a follow-up");
  await expect(main).toContainText("Privacy:");
  await expect(main).toContainText("Vercel Web Analytics");
  await expect(main).not.toContainText("no analytics trackers");
});

test("power track links into the Churchill record", async ({ page }) => {
  await page.goto("/power");
  const main = page.locator("main.desk-page");
  await expect(main.locator('a[href="/tracker"]')).toBeVisible();
  await expect(main.locator('a[href="/brief"]')).toBeVisible();
  await expect(main.locator('a[href="/engage"]')).toBeVisible();
  await expect(main.getByRole("link", { name: "Work this track" })).toBeVisible();
});

test("a power-record page links to /power", async ({ page }) => {
  await page.goto("/brief");
  const parent = page.locator(".desk-kicker a[href='/power']");
  await expect(parent).toBeVisible();
  await expect(parent).toHaveText("Power");
});

test("/compute links to /build", async ({ page }) => {
  await page.goto("/compute");
  const parent = page.locator(".desk-kicker a[href='/build']");
  await expect(parent).toBeVisible();
  await expect(parent).toHaveText("Build");
  await expect(page.locator("main.desk-page")).toContainText("This page is the campus, and only that.");
});

for (const path of ["/privacy", "/terms"]) {
  test(`${path} uses the desk nav`, async ({ page, isMobile }) => {
    await page.goto(path);
    await expect(page.locator("main.desk-page")).toBeVisible();
    const labels = ["Build", "Capital", "Consent", "Power"];
    if (isMobile) {
      await page.getByRole("button", { name: "Open menu" }).click();
      const sheet = page.locator(".desk-nav-sheet");
      for (const label of labels) {
        await expect(sheet.getByRole("link", { name: label })).toBeVisible();
      }
    } else {
      const nav = page.getByRole("navigation", { name: "Primary" });
      for (const label of labels) {
        await expect(nav.getByRole("link", { name: label })).toBeVisible();
      }
    }
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Pricing" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Get started" })).toHaveCount(0);
    if (path === "/privacy") {
      await expect(page.locator("main.desk-page")).toContainText("Vercel Web Analytics");
      await expect(page.locator("main.desk-page")).toContainText("cookieless");
      await expect(page.locator("main.desk-page")).toContainText("not personal identity");
    }
  });
}

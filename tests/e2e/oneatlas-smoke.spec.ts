import { expect, test, type Page } from "@playwright/test";

type ModelFixture = {
  slug: string;
  name: string;
  type: string;
};

function isModelFixture(value: unknown): value is ModelFixture {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.slug === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.type === "string"
  );
}

async function loadSeededModels(page: Page, minimum: number): Promise<ModelFixture[]> {
  const response = await page.request.get("/api/models?limit=24");
  expect(
    response.ok(),
    "GET /api/models must succeed. Configure Neon, run migrations and seed the database before Playwright tests.",
  ).toBeTruthy();

  const payload: unknown = await response.json();
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    throw new Error("The model API did not return the expected { data: [...] } envelope.");
  }

  const rawModels = (payload as { data: unknown }).data;
  const models = Array.isArray(rawModels) ? rawModels.filter(isModelFixture) : [];
  if (models.length < minimum) {
    throw new Error(
      `Playwright smoke tests need at least ${minimum} seeded models; the API returned ${models.length}. Run npm run seed.`,
    );
  }
  return models;
}

test.describe("OneAtlas seeded-database smoke tests", () => {
  test("search, filter and open a model detail page", async ({ page }) => {
    const [model] = await loadSeededModels(page, 1);

    await page.goto("/models");
    await expect(page.getByRole("heading", { name: "Explore AI models" })).toBeVisible();

    const search = page.getByRole("searchbox", { name: "Search models" });
    await search.fill(model.name);
    await page.locator("#type-desktop").selectOption(model.type);

    const modelHref = `/models/${encodeURIComponent(model.slug)}`;
    const modelLink = page.locator(
      `section[aria-label="Model search results"] a[href="${modelHref}"]`,
    ).first();
    await expect(modelLink).toBeVisible();
    await modelLink.click();

    await expect(page.getByRole("heading", { name: model.name, exact: true })).toBeVisible();
    const addToCompare = page.getByRole("button", {
      name: `Add ${model.name} to comparison`,
      exact: true,
    });
    await expect(addToCompare).toBeVisible();
    await addToCompare.click();
    await expect(page.getByRole("complementary", { name: "Model comparison tray" })).toBeVisible();
  });

  test("add two models and render the shareable comparison page", async ({ page }) => {
    const models = await loadSeededModels(page, 2);

    await page.goto("/models");
    await expect(page.getByRole("heading", { name: "Explore AI models" })).toBeVisible();

    for (const model of models.slice(0, 2)) {
      const modelHref = `/models/${encodeURIComponent(model.slug)}`;
      const modelCard = page.locator(
        `article.model-card:has(a[href="${modelHref}"])`,
      );
      const addToCompare = modelCard.getByRole("button", {
        name: `Add ${model.name} to comparison`,
        exact: true,
      });
      await expect(addToCompare).toBeVisible();
      await addToCompare.click();
    }

    await expect(page.getByRole("complementary", { name: "Model comparison tray" })).toBeVisible();
    await page.getByRole("link", { name: "Compare models", exact: true }).click();

    await expect(page).toHaveURL(/\/compare\?models=/);
    await expect(page.getByRole("heading", { name: "Compare AI models" })).toBeVisible();
    await expect(page.getByText(/Comparing\s+2\s+models/)).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });
});

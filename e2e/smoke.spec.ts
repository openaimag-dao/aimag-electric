import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

test.describe("Публичные страницы", () => {
  test("главная загружается и содержит бренд", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AIMAG ELECTRIC/i);
  });

  test("каталог открывается", async ({ page }) => {
    await page.goto("/catalog");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("страница входа доступна", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
    await expect(page.getByLabel(/пароль/i)).toBeVisible();
  });
});

test("заявка на электромонтаж сохраняется с адресом страницы", async ({ page }) => {
  const company = `Тест электромонтаж ${crypto.randomUUID()}`;
  await page.goto("/?utm_source=google&utm_medium=cpc&utm_campaign=installation_test");
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem("aimag-campaign-v1")))
    .not.toBeNull();
  await page.getByRole("link", { name: "Электромонтаж", exact: true }).first().click();
  await expect(page).toHaveURL(/\/elektromontazh$/);
  await page.getByLabel("Компания").fill(company);
  await page.getByLabel("Контактное лицо").fill("Тестовый клиент");
  await page.getByLabel("Телефон").fill("+7 700 000 00 00");
  await page.getByLabel("Что нужно").fill("Тестовая заявка: монтаж освещения на объекте");
  await page.getByRole("button", { name: "Отправить заявку" }).click();
  await expect(page.getByText("Заявка отправлена")).toBeVisible();

  const prisma = new PrismaClient();
  try {
    await expect
      .poll(async () => {
        const quote = await prisma.quote.findFirst({
          where: { company },
          select: { sourcePath: true },
        });
        return quote?.sourcePath;
      })
      .toBe("/elektromontazh");
    const quote = await prisma.quote.findFirstOrThrow({ where: { company } });
    expect(quote.utmSource).toBe("google");
    expect(quote.utmMedium).toBe("cpc");
    expect(quote.utmCampaign).toBe("installation_test");
    const notification = await prisma.notification.findFirst({
      where: { type: "quote.created", link: `/admin/quotes?quote=${quote.id}` },
    });
    expect(notification).not.toBeNull();
  } finally {
    await prisma.$disconnect();
  }
});

test("ошибка связи при отправке сохраняет заполненную форму", async ({ page }) => {
  await page.goto("/elektromontazh");
  await page.getByLabel("Компания").fill("Тест связи");
  await page.getByLabel("Контактное лицо").fill("Тестовый клиент");
  await page.getByLabel("Телефон").fill("+7 700 000 00 00");
  await page.getByLabel("Что нужно").fill("Проверка сохранения формы при обрыве связи");
  await page.route("**/elektromontazh", (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue()
  );
  await page.getByRole("button", { name: "Отправить заявку" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "Не удалось получить подтверждение"
  );
  await expect(page.getByLabel("Компания")).toHaveValue("Тест связи");
  await expect(page.getByText("Заявка отправлена")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Отправить заявку" })).toBeEnabled();
});

test.describe("Защита маршрутов", () => {
  test("админка редиректит неавторизованного на логин", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("кабинет редиректит неавторизованного на логин", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login/);
  });
});

test("выбранное количество передаётся в корзину, КП и WhatsApp на телефоне", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const prisma = new PrismaClient();
  const company = `Тест количества ${crypto.randomUUID()}`;
  try {
    const template = await prisma.product.findFirstOrThrow({
      where: { published: true },
      select: { categoryId: true, brandId: true },
    });
    const fixtureId = crypto.randomUUID();
    const product = await prisma.product.create({
      data: {
        ...template,
        slug: `quantity-test-${fixtureId}`,
        sku: `TEST-${fixtureId}`,
        title: "Тест расчёта количества",
        unit: "м",
        prices: { create: { kind: "BASE", amount: 123400, validFrom: new Date(0) } },
      },
    });
    await page.goto(`/catalog/${product.slug}`);
    const actions = page.getByRole("group", { name: "Заказать товар" });
    await actions
      .getByRole("textbox", { name: `Количество, ${product.unit}`, exact: true })
      .fill("37");
    // Clicking the action itself must commit the typed quantity; no extra blur in the test.
    await actions.getByRole("button", { name: "Добавить в корзину", exact: true }).click();
    const total = 1234 * 37;
    await expect(actions.getByRole("status", { name: "Расчёт стоимости" })).toContainText(
      `${new Intl.NumberFormat("ru-RU").format(total)} ₸`
    );
    await expect(
      page
        .getByRole("navigation", { name: "Условия покупки" })
        .getByRole("link", { name: "Доставка и самовывоз" })
    ).toHaveAttribute("href", "/dostavka");
    const whatsapp = await actions
      .getByRole("link", { name: "Написать в WhatsApp" })
      .getAttribute("href");
    expect(new URL(whatsapp!).searchParams.get("text")).toContain(`количество: 37 ${product.unit}`);
    await actions.getByRole("button", { name: "Получить КП", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(`× 37 ${product.unit}`);
    await dialog.getByLabel("Компания").fill(company);
    await dialog.getByLabel("Контактное лицо").fill("Тестовый клиент");
    await dialog.getByLabel("Телефон").fill("+7 700 000 00 00");
    await dialog.getByRole("button", { name: "Отправить заявку" }).click();
    await expect(dialog.getByText("Заявка отправлена")).toBeVisible();
    const quote = await prisma.quote.findFirstOrThrow({
      where: { company },
      include: { items: true },
    });
    expect(quote.items).toHaveLength(1);
    expect(quote.items[0].productId).toBe(product.id);
    expect(quote.items[0].qty).toBe(37);
    expect(quote.utmSource).toBeNull();
    expect(quote.utmMedium).toBeNull();
    expect(quote.utmCampaign).toBeNull();
    await page.goto("/cart");
    await expect(
      page.getByRole("textbox", { name: `Количество, ${product.unit}`, exact: true })
    ).toHaveValue("37");
  } finally {
    await prisma.$disconnect();
  }
});

test("заполнение товара из списка сохраняет выбранный товар и фильтры", async ({ page }) => {
  const prisma = new PrismaClient();
  const suffix = crypto.randomUUID();
  const email = `quality-${suffix}@example.test`;
  const password = crypto.randomUUID();
  const { hash } = await import("bcryptjs");
  try {
    await prisma.user.create({
      data: { email, passwordHash: await hash(password, 10), role: "ADMIN" },
    });
    const template = await prisma.product.findFirstOrThrow({
      select: { categoryId: true, brandId: true },
    });
    const product = await prisma.product.create({
      data: {
        ...template,
        title: `Тест заполнения ${suffix}`,
        sku: `QUALITY-${suffix}`,
        slug: `quality-${suffix}`,
      },
    });
    await page.goto("/login?callbackUrl=/admin/products");
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Войти", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/products/);
    await page.goto(`/admin/products?quality=no-description&q=${product.sku}`);
    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(1);
    await expect(rows).toContainText(product.sku);
    await rows.getByRole("button", { name: "Добавить фото", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("Товар", { exact: true })).toHaveValue(product.id);
    await dialog.getByLabel("Фото", { exact: true }).fill("https://example.test/product.png");
    await dialog.getByRole("button", { name: "Добавить", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(rows.getByRole("button", { name: "Добавить фото", exact: true })).toHaveCount(0);
    expect(await prisma.productImage.count({ where: { productId: product.id } })).toBe(1);
    await rows.getByRole("button", { name: "Добавить характеристики", exact: true }).click();
    await expect(dialog.getByLabel("Товар", { exact: true })).toHaveValue(product.id);
    await dialog.getByRole("button", { name: "Отмена", exact: true }).click();
    await rows.getByRole("button", { name: "Добавить описание", exact: true }).click();
    await expect(dialog).toContainText("Редактировать товар");
  } finally {
    await prisma.$disconnect();
  }
});

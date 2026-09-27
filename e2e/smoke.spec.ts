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
        images: {
          create: [
            { url: null, order: 0 },
            { url: "", order: 1 },
            { url: "/icon.svg", order: 2 },
          ],
        },
        prices: {
          create: [
            { kind: "BASE", amount: 123400, minQty: 1, validFrom: new Date(0) },
            { kind: "WHOLESALE", amount: 10000, minQty: 100, validFrom: new Date(0) },
          ],
        },
      },
    });
    await page.goto(`/catalog?q=${product.sku}&pmin=1200&pmax=1300`);
    await expect(
      page.getByRole("link", { name: product.title, exact: true }).first()
    ).toBeVisible();
    await expect(page.getByRole("img", { name: product.title, exact: true })).toHaveAttribute(
      "src",
      "/icon.svg"
    );
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
    const cartCompany = `${company} корзина`;
    await page.getByLabel("Компания", { exact: true }).fill(cartCompany);
    await page.getByLabel("Контактное лицо", { exact: true }).fill("Тест корзины");
    await page.getByLabel("Телефон", { exact: true }).fill("+7 700 000 00 00");
    await page.getByRole("button", { name: "Отправить заявку", exact: true }).click();
    await expect(page.getByText("Заявка отправлена", { exact: true })).toBeVisible();
    const cartQuote = await prisma.quote.findFirstOrThrow({
      where: { company: cartCompany },
      include: { items: true },
    });
    expect(cartQuote.sourcePath).toBe("/cart");
    expect(cartQuote.items).toHaveLength(1);
    expect(cartQuote.items[0]).toMatchObject({
      productId: product.id,
      qty: 37,
      amountTiyn: 123400,
    });
    expect(
      await prisma.notification.count({
        where: { type: "quote.created", link: `/admin/quotes?quote=${cartQuote.id}` },
      })
    ).toBe(1);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("aimag-cart-v1"))).toBe("[]");
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
    await expect(page).toHaveURL((url) => url.pathname === "/admin/products");
    const searchEvents = ["suggestion", "search", "search_filtered", "search_submitted"];
    await prisma.searchLog.createMany({
      data: searchEvents.map((kind) => ({
        query: `${suffix}-${kind}`,
        kind,
        resultCount: 0,
      })),
    });
    await page.goto("/admin");
    await expect(page.getByText(`${suffix}-suggestion`, { exact: true })).toHaveCount(0);
    await expect(page.getByText(`${suffix}-search`, { exact: true })).toHaveCount(0);
    await expect(page.getByText(`${suffix}-search_filtered`, { exact: true })).toHaveCount(1);
    await expect(page.getByText(`${suffix}-search_submitted`, { exact: true })).toHaveCount(2);
    await expect(
      page.getByRole("link", { name: `${suffix}-search_submitted`, exact: true })
    ).toHaveAttribute("href", `/catalog?q=${suffix}-search_submitted`);
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

test("корзина восстанавливает корректные позиции и не показывает нулевой итог для цены по запросу", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "aimag-cart-v1",
      JSON.stringify([
        { broken: true },
        {
          productId: "cart-recovery-test",
          slug: "cart-recovery-test",
          sku: "RECOVERY",
          title: "Товар по запросу",
          unit: "шт",
          priceTenge: null,
          qty: 2,
        },
      ])
    );
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "aimag-cart-v1") throw new DOMException("Storage full", "QuotaExceededError");
      originalSetItem.call(this, key, value);
    };
  });
  await page.goto("/cart");
  await expect(page.getByRole("link", { name: "Товар по запросу", exact: true })).toBeVisible();
  const summary = page.getByRole("status", { name: "Итог корзины" });
  await expect(summary).toContainText("Стоимость по запросу");
  await expect(summary).not.toContainText("0 ₸");
  const quantity = page.getByRole("textbox", { name: "Количество, шт", exact: true });
  await expect(quantity).toHaveValue("2");
  await page.getByRole("button", { name: "Увеличить количество", exact: true }).click();
  await expect(quantity).toHaveValue("3");
  await expect(summary).toContainText("Стоимость по запросу");
});

test("пустой поиск сохраняет запрос при снятии фильтров и переносит его в заявку", async ({
  page,
}) => {
  const query = `НетТакогоАртикула-${crypto.randomUUID()}`;
  const prisma = new PrismaClient();
  try {
    await page.goto(`/catalog?q=${encodeURIComponent(query)}&stock=1`);
    await expect
      .poll(() =>
        prisma.searchLog.count({ where: { query, kind: "search_filtered", resultCount: 0 } })
      )
      .toBe(1);
    await page
      .getByRole("button", { name: "Убрать фильтры, оставить запрос", exact: true })
      .click();
    await expect(page).toHaveURL(
      (url) => url.searchParams.get("q") === query && !url.searchParams.has("stock")
    );
    await expect(
      page.getByRole("heading", { name: "Ничего не найдено", exact: true })
    ).toBeVisible();
    await page.getByRole("button", { name: "Запросить подбор", exact: true }).click();
    await expect(page.getByRole("dialog").getByLabel("Что нужно", { exact: true })).toHaveValue(
      `Не нашёл в каталоге: «${query}». Прошу уточнить возможность поставки или подобрать аналог.`
    );
    await expect
      .poll(() =>
        prisma.searchLog.count({ where: { query, kind: "search_submitted", resultCount: 0 } })
      )
      .toBe(1);
  } finally {
    await prisma.$disconnect();
  }
});

test("ошибки состава корзины видны, а открытая форма имеет собственные подписи полей", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "aimag-cart-v1",
      JSON.stringify([
        {
          productId: "validation-test",
          slug: "validation-test",
          sku: "VALIDATION",
          title: "Тест лимита количества",
          unit: "шт",
          priceTenge: null,
          qty: 1_000_001,
        },
      ])
    );
  });
  await page.goto("/cart");
  await page.getByLabel("Компания", { exact: true }).fill("Тест проверки");
  await page.getByLabel("Контактное лицо", { exact: true }).fill("Покупатель");
  await page.getByLabel("Телефон", { exact: true }).fill("+7 700 000 00 00");
  const title = page.getByLabel("Название проекта (необязательно)", { exact: true });
  await title.fill("а".repeat(161));
  await page.getByRole("button", { name: "Отправить заявку", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Проверьте состав заявки" })
  ).toBeVisible();
  await expect(title).toHaveAttribute("aria-invalid", "true");
  await expect(
    page.getByText("Название проекта — не более 160 символов", { exact: true })
  ).toBeVisible();
  const cartCompanyId = await page.getByLabel("Компания", { exact: true }).getAttribute("id");
  await page.getByRole("banner").getByRole("button", { name: "Получить КП", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const dialogCompany = dialog.getByLabel("Компания", { exact: true });
  await dialogCompany.fill("Отдельная заявка");
  expect(await dialogCompany.getAttribute("id")).not.toBe(cartCompanyId);
  await expect(dialogCompany).toHaveValue("Отдельная заявка");
});

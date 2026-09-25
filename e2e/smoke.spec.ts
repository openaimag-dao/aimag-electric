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
  await page.goto("/elektromontazh");
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
    const quote = await prisma.quote.findFirstOrThrow({ where: { company }, select: { id: true } });
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
    const product = await prisma.product.findFirstOrThrow({
      where: { published: true },
      select: { id: true, slug: true, unit: true },
    });
    await page.goto(`/catalog/${product.slug}`);
    const actions = page.getByRole("group", { name: "Заказать товар" });
    await actions
      .getByRole("textbox", { name: `Количество, ${product.unit}`, exact: true })
      .fill("37");
    // Clicking the action itself must commit the typed quantity; no extra blur in the test.
    await actions.getByRole("button", { name: "Добавить в корзину", exact: true }).click();
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
    await page.goto("/cart");
    await expect(
      page.getByRole("textbox", { name: `Количество, ${product.unit}`, exact: true })
    ).toHaveValue("37");
  } finally {
    await prisma.$disconnect();
  }
});

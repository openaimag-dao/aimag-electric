import "server-only";

import { siteConfig } from "@/config/site";
import { formatTiyn } from "@/lib/money";
import { ROBOTO_REGULAR_BASE64, ROBOTO_BOLD_BASE64 } from "@/lib/pdf/fonts-base64";

export interface QuotePdfItem {
  title: string;
  sku: string | null;
  qty: number;
  unit: string;
  amountTiyn: number | null;
}

export interface QuotePdfData {
  id: string;
  title: string | null;
  company: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  createdAt: Date;
  items: QuotePdfItem[];
}

function formatDate(d: Date) {
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

/** Minimal HTML-escaping — every value rendered here is our own stored data, but never trust it blindly in a document that becomes a PDF. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * HTML document for a Quote, rendered to PDF by render-pdf.ts (headless
 * Chromium) — only fields we actually store, plus the real bank requisites
 * already published on /oplata (siteConfig.requisites), so the buyer's
 * accounting can pay straight from this document. No invented VAT numbers
 * or discounts: those live on paper/in a real accounting system this
 * project doesn't have yet.
 */
export function renderQuoteHtml(quote: QuotePdfData): string {
  const priced = quote.items.filter((i) => i.amountTiyn !== null);
  const totalTiyn = priced.reduce((sum, i) => sum + (i.amountTiyn as number) * i.qty, 0);
  const hasUnpriced = quote.items.some((i) => i.amountTiyn === null);
  const docNumber = quote.id.slice(-8).toUpperCase();
  const r = siteConfig.requisites;

  const itemsRows = quote.items
    .map(
      (item, i) => `
      <tr>
        <td class="n">${i + 1}</td>
        <td class="title">${esc(item.title)}${item.sku ? ` (арт. ${esc(item.sku)})` : ""}</td>
        <td class="qty">${item.qty} ${esc(item.unit)}</td>
        <td class="price">${item.amountTiyn !== null ? esc(formatTiyn(item.amountTiyn)) : "по запросу"}</td>
        <td class="sum">${item.amountTiyn !== null ? esc(formatTiyn(item.amountTiyn * item.qty)) : "—"}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<title>КП ${docNumber}</title>
<style>
  @font-face {
    font-family: "Roboto";
    font-weight: normal;
    src: url(data:font/woff;base64,${ROBOTO_REGULAR_BASE64}) format("woff");
  }
  @font-face {
    font-family: "Roboto";
    font-weight: bold;
    src: url(data:font/woff;base64,${ROBOTO_BOLD_BASE64}) format("woff");
  }
  * { box-sizing: border-box; }
  body { font-family: "Roboto", Arial, sans-serif; font-size: 10pt; color: #1a1a1a; margin: 0; padding: 36px; }
  .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
  .brand { font-size: 16pt; font-weight: bold; }
  .brand-sub { font-size: 9pt; color: #555; margin-top: 2px; }
  .doc-title { font-size: 13pt; font-weight: bold; text-align: right; }
  .doc-meta { font-size: 9pt; color: #555; text-align: right; margin-top: 2px; }
  .section { margin-bottom: 14px; }
  .section-title { font-size: 9pt; font-weight: bold; color: #888; text-transform: uppercase; margin-bottom: 4px; }
  .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
  .label { color: #555; }
  .value { font-weight: bold; }
  table { width: 100%; margin-top: 6px; border-collapse: collapse; border: 1px solid #ddd; }
  thead tr { background: #f2f2f2; border-bottom: 1px solid #ddd; }
  thead th { font-size: 9pt; font-weight: bold; color: #555; text-align: left; padding: 5px; }
  tbody tr { border-bottom: 1px solid #eee; }
  tbody td { padding: 5px; }
  .n { width: 6%; }
  .title { width: 44%; }
  .qty { width: 16%; text-align: right; }
  .price { width: 17%; text-align: right; }
  .sum { width: 17%; text-align: right; }
  .total-row { display: flex; justify-content: flex-end; margin-top: 8px; padding-right: 5px; }
  .total-label { font-size: 11pt; color: #555; margin-right: 10px; }
  .total-value { font-size: 13pt; font-weight: bold; }
  .footer { margin-top: 24px; font-size: 8.5pt; color: #888; line-height: 1.4; }
</style>
</head>
<body>
  <div class="header-row">
    <div>
      <div class="brand">${esc(siteConfig.name)}</div>
      <div class="brand-sub">${esc(siteConfig.description)}</div>
      <div class="brand-sub">${esc(siteConfig.contacts.phone)} · ${esc(siteConfig.contacts.email)}</div>
      <div class="brand-sub">${esc(siteConfig.contacts.city)}</div>
    </div>
    <div>
      <div class="doc-title">Коммерческое предложение</div>
      <div class="doc-meta">№ ${docNumber}</div>
      <div class="doc-meta">от ${formatDate(quote.createdAt)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Клиент</div>
    ${
      quote.title
        ? `<div class="row"><span class="label">Проект</span><span class="value">${esc(quote.title)}</span></div>`
        : ""
    }
    <div class="row"><span class="label">Компания</span><span class="value">${esc(quote.company)}</span></div>
    <div class="row"><span class="label">Контактное лицо</span><span class="value">${esc(quote.name)}</span></div>
    <div class="row"><span class="label">Телефон</span><span class="value">${esc(quote.phone)}</span></div>
    ${
      quote.email
        ? `<div class="row"><span class="label">E-mail</span><span class="value">${esc(quote.email)}</span></div>`
        : ""
    }
  </div>

  ${
    quote.items.length > 0
      ? `<div class="section">
    <div class="section-title">Позиции (${quote.items.length})</div>
    <table>
      <thead>
        <tr><th class="n">№</th><th class="title">Наименование</th><th class="qty">Кол-во</th><th class="price">Цена</th><th class="sum">Сумма</th></tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <div class="total-row">
      <span class="total-label">Итого${hasUnpriced ? " (по позициям с ценой)" : ""}, без НДС</span>
      <span class="total-value">${esc(formatTiyn(totalTiyn))}</span>
    </div>
  </div>`
      : ""
  }

  ${
    quote.message
      ? `<div class="section">
    <div class="section-title">Комментарий</div>
    <div>${esc(quote.message)}</div>
  </div>`
      : ""
  }

  <div class="section">
    <div class="section-title">Реквизиты поставщика</div>
    <div class="row"><span class="label">Наименование</span><span class="value">${esc(r.legalName)}</span></div>
    <div class="row"><span class="label">ИИН</span><span class="value">${esc(r.iin)}</span></div>
    <div class="row"><span class="label">Банк</span><span class="value">${esc(r.bank)}</span></div>
    <div class="row"><span class="label">БИК</span><span class="value">${esc(r.bik)}</span></div>
    <div class="row"><span class="label">ИИК</span><span class="value">${esc(r.iik)}</span></div>
  </div>

  <div class="footer">
    Цены указаны без НДС и подлежат уточнению менеджером с учётом объёма и условий поставки.
    Настоящий документ носит информационный характер и не является публичной офертой. По
    вопросам — ${esc(siteConfig.contacts.phone)}, ${esc(siteConfig.contacts.email)}.
  </div>
</body>
</html>`;
}

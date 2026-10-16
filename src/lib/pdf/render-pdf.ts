import "server-only";

import puppeteer, { type Browser } from "puppeteer-core";

import { renderQuoteHtml, type QuotePdfData } from "@/lib/pdf/quote-html";

/**
 * CHROME_PATH (set locally/in dev sandboxes to a pre-installed Chromium) uses
 * that binary directly. In production (Vercel) it's unset, so this falls
 * back to @sparticuz/chromium — a Chromium build packaged specifically to
 * fit inside a serverless function.
 */
/**
 * A minimal, explicit env for the spawned Chromium process — not the full
 * `process.env`. Next's standalone server embeds its whole resolved config
 * (1200+ redirects included) in its own environment, which is large enough
 * on its own to blow past this sandbox's effective spawn() argv+env limit
 * (Error: spawn E2BIG). Chromium only ever needs PATH/HOME/TMPDIR/LANG to
 * run — this also avoids handing it DATABASE_URL and other app secrets it
 * has no reason to see.
 */
function minimalChildEnv(): Record<string, string | undefined> {
  const { PATH, HOME, TMPDIR, LANG } = process.env;
  return { PATH, HOME, TMPDIR, LANG: LANG ?? "en_US.UTF-8" };
}

async function launchBrowser(): Promise<Browser> {
  if (process.env.CHROME_PATH) {
    return puppeteer.launch({
      executablePath: process.env.CHROME_PATH,
      headless: true,
      args: ["--no-sandbox", "--disable-gpu"],
      env: minimalChildEnv(),
    });
  }
  const chromium = (await import("@sparticuz/chromium")).default;
  return puppeteer.launch({
    executablePath: await chromium.executablePath(),
    headless: true,
    args: chromium.args,
    env: minimalChildEnv(),
  });
}

/** Renders a Quote to a PDF buffer via headless Chromium — see quote-html.ts for the document itself. */
export async function renderQuotePdf(quote: QuotePdfData): Promise<Buffer> {
  const html = renderQuoteHtml(quote);
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "a4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export type { QuotePdfData, QuotePdfItem } from "@/lib/pdf/quote-html";

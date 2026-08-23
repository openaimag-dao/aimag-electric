import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { quoteRepository } from "@/server/repositories";
import { rateLimit } from "@/lib/security/rate-limit";
import { QuotePdfDocument } from "@/lib/pdf/quote-pdf";

// react-pdf renders with Node's font/canvas stack — not available on Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public, token-gated PDF download for /kp/[token] — same access control
 * (the token itself) and rate limiting as getPublicQuote in
 * quote-response-actions.ts. Reuses the admin's QuotePdfDocument rather than
 * a second PDF layout.
 */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length > 100) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const limit = rateLimit(`kp-pdf:${ip}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const quote = await quoteRepository.findByToken(token);
  // Only a manager-prepared КП (SENT/WON/LOST) has anything worth downloading.
  if (!quote || !["SENT", "WON", "LOST"].includes(quote.status)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    QuotePdfDocument({
      quote: {
        id: quote.id,
        title: quote.title,
        company: quote.company,
        name: quote.name,
        phone: quote.phone,
        email: quote.email,
        message: quote.message,
        createdAt: quote.createdAt,
        items: quote.items.map((i) => ({
          title: i.title,
          sku: i.sku,
          qty: i.qty,
          unit: i.unit,
          amountTiyn: i.amountTiyn,
        })),
      },
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="kp-${quote.id.slice(-8)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

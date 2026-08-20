import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { requireStaff, AuthenticationError, AuthorizationError } from "@/lib/security/rbac";
import { quoteAdminRepository } from "@/server/repositories/admin";
import { QuotePdfDocument } from "@/lib/pdf/quote-pdf";

// react-pdf renders with Node's font/canvas stack — not available on Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaff();
  } catch (e) {
    if (e instanceof AuthenticationError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (e instanceof AuthorizationError)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const { id } = await params;
  const quote = await quoteAdminRepository.byId(id);
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

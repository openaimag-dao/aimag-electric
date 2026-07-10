import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

/**
 * WhatsApp CTA. Pre-fills a message with the product name + SKU so the sales
 * chat starts with full context. Server-safe (plain link, no client JS).
 */
export function WhatsAppButton({
  title,
  sku,
  className,
}: {
  title: string;
  sku: string;
  className?: string;
}) {
  const text = encodeURIComponent(
    `Здравствуйте! Интересует «${title}» (арт. ${sku}). Подскажите цену, наличие и срок поставки.`
  );
  const href = `https://wa.me/${siteConfig.contacts.whatsapp}?text=${text}`;

  return (
    <Button
      asChild
      size="lg"
      className={`bg-[#25D366] text-white hover:bg-[#1FB855] ${className ?? ""}`}
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        <MessageCircle />
        Написать в WhatsApp
      </a>
    </Button>
  );
}

"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";

import { siteConfig } from "@/config/site";

const HIDDEN_PREFIXES = ["/admin", "/account", "/login", "/register", "/kp/"];

/**
 * Site-wide floating CTA. Separate from WhatsAppButton (product/cart pages),
 * which pre-fills a product-specific message — this one is a generic entry
 * point for visitors browsing content pages (blog, category, home) that
 * don't have a product-scoped CTA in view.
 */
export function FloatingWhatsApp() {
  const pathname = usePathname();
  if (HIDDEN_PREFIXES.some((prefix) => pathname?.startsWith(prefix))) return null;

  const text = encodeURIComponent(
    "Здравствуйте! Подскажите, пожалуйста, по подбору и наличию товара."
  );
  const href = `https://wa.me/${siteConfig.contacts.whatsapp}?text=${text}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Написать в WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#1FB855] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1FB855] md:bottom-6 md:right-6"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}

import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { Logo } from "@/components/common/logo";
import { QuoteDialog } from "@/components/common/quote-dialog";
import { footerNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";

export function Footer() {
  const year = new Date().getFullYear();
  const tel = siteConfig.contacts.phone.replace(/[\s()-]/g, "");

  return (
    <footer className="bg-steel-950 text-steel-300">
      {/* Quote strip */}
      <div className="border-b border-steel-800">
        <div className="container flex flex-col items-center justify-between gap-5 py-10 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
              Готовы посчитать ваш проект?
            </h2>
            <p className="mt-1 text-sm text-steel-400">
              Пришлите спецификацию — подготовим КП за 15 минут.
            </p>
          </div>
          <QuoteDialog size="lg" />
        </div>
      </div>

      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo variant="light" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-steel-400">
            {siteConfig.description}
          </p>
          <ul className="mt-6 space-y-2.5 text-sm">
            <li className="flex items-center gap-2.5">
              <Phone className="size-4 text-signal" />
              <a href={`tel:${tel}`} className="hover:text-white">
                {siteConfig.contacts.phone}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="size-4 text-signal" />
              <a href={`mailto:${siteConfig.contacts.email}`} className="hover:text-white">
                {siteConfig.contacts.email}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin className="size-4 text-signal" />
              {siteConfig.contacts.city}
            </li>
          </ul>
        </div>

        {footerNav.map((group) => (
          <div key={group.title}>
            <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-steel-500">
              {group.title}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-steel-300 transition-colors hover:text-signal"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-steel-800">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-steel-500 sm:flex-row">
          <p>© {year} {siteConfig.name}. Все права защищены.</p>
          <p className="font-mono uppercase tracking-wider">
            Электротехника для бизнеса и промышленности
          </p>
        </div>
      </div>
    </footer>
  );
}

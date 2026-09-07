import type { SVGProps } from "react";

/**
 * Hand-drawn pictograms for the homepage category grid — one per high-volume
 * category, keyed by Category.slug. Own line-art style (matches the site's
 * steel/signal palette), not photos: real product photos hotlinked from
 * suppliers kept surfacing other stores' watermarks or stray phone numbers
 * baked into the image (see the PR that replaced them), which is a risk a
 * drawn icon simply doesn't have. Falls back to the generic Package icon
 * (resolveCategoryIcon) for any category without an entry here.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Кабель и провод — insulated cable ending in splayed bare strands. */
export function CableIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 46 L34 24" />
      <path d="M34 24 L46 12" />
      <path d="M34 24 L44 20" />
      <path d="M34 24 L40 30" />
      <circle cx="46" cy="12" r="2" fill="currentColor" stroke="none" className="text-signal" />
      <circle cx="44" cy="20" r="2" fill="currentColor" stroke="none" className="text-signal" />
      <circle cx="40" cy="30" r="2" fill="currentColor" stroke="none" className="text-signal" />
    </Base>
  );
}

/** Изоляторы и линейная арматура — stacked bell-shaped discs on a pin. */
export function InsulatorIcon(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="32" y1="6" x2="32" y2="50" />
      <path d="M24 12 L40 12 L44 18 L20 18 Z" />
      <path d="M22 26 L42 26 L46 32 L18 32 Z" />
      <path d="M20 40 L44 40 L48 46 L16 46 Z" />
      <line x1="14" y1="52" x2="50" y2="52" strokeWidth={3} />
    </Base>
  );
}

/** Кабельная арматура — ring terminal (lug) crimped onto a barrel. */
export function CableLugIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="18" cy="32" r="10" />
      <circle cx="18" cy="32" r="4" />
      <path d="M27 26 L40 22 L40 42 L27 38 Z" />
      <rect x="40" y="24" width="14" height="16" rx="2" />
      <line
        x1="44"
        y1="27"
        x2="44"
        y2="37"
        strokeWidth={2.2}
        className="text-signal"
        stroke="currentColor"
      />
      <line
        x1="49"
        y1="27"
        x2="49"
        y2="37"
        strokeWidth={2.2}
        className="text-signal"
        stroke="currentColor"
      />
    </Base>
  );
}

/** Автоматические выключатели — DIN-rail breaker module with a toggle. */
export function BreakerIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="20" y="10" width="24" height="44" rx="3" />
      <circle cx="32" cy="16" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="32" cy="48" r="1.8" fill="currentColor" stroke="none" />
      <rect x="27" y="23" width="10" height="16" rx="3" />
      <rect
        x="28.5"
        y="25"
        width="7"
        height="7"
        rx="1.5"
        fill="currentColor"
        stroke="none"
        className="text-signal"
      />
    </Base>
  );
}

/** Коммутационная аппаратура — open switch contact in an enclosure. */
export function SwitchgearIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="14" y="12" width="36" height="40" rx="4" />
      <circle cx="22" cy="38" r="2.6" fill="currentColor" stroke="none" />
      <circle cx="42" cy="38" r="2.6" fill="currentColor" stroke="none" />
      <path d="M22 38 L38 21" />
      <rect
        x="24"
        y="44"
        width="16"
        height="3"
        fill="currentColor"
        stroke="none"
        className="text-signal"
      />
    </Base>
  );
}

/** Инструмент и расходники — open-end wrench. */
export function ToolIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M20 44 L38 26" strokeWidth={5.5} />
      <circle cx="14" cy="50" r="9" />
      <path d="M8 50 a6 6 0 0 1 12 0" stroke="white" strokeWidth={5} />
      <circle cx="44" cy="20" r="9" />
      <path d="M38 20 a6 6 0 0 1 12 0" stroke="white" strokeWidth={5} />
      <circle cx="14" cy="50" r="3.2" fill="currentColor" stroke="none" className="text-signal" />
      <circle cx="44" cy="20" r="3.2" fill="currentColor" stroke="none" className="text-signal" />
    </Base>
  );
}

/** Крепёж — hex nut with a hole. */
export function FastenerIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M32 10 L46 18 L46 34 L32 42 L18 34 L18 18 Z" />
      <circle cx="32" cy="26" r="7" />
    </Base>
  );
}

/** Щиты и корпуса — wall cabinet with an inset door. */
export function EnclosureIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="14" y="9" width="36" height="46" rx="2" />
      <rect x="19" y="14" width="26" height="36" rx="1" strokeWidth={1.6} />
      <circle cx="40" cy="32" r="1.8" fill="currentColor" stroke="none" className="text-signal" />
      <line x1="23" y1="20" x2="33" y2="20" strokeWidth={1.6} />
      <line x1="23" y1="24" x2="33" y2="24" strokeWidth={1.6} />
    </Base>
  );
}

const categoryIllustrations: Record<string, (props: IconProps) => React.JSX.Element> = {
  "kabel-provod": CableIcon,
  kabeli: CableIcon,
  provoda: CableIcon,
  "izolyatory-armatura": InsulatorIcon,
  izolyatory: InsulatorIcon,
  "kabelnaya-armatura": CableLugIcon,
  mufty: CableLugIcon,
  avtomaty: BreakerIcon,
  kommutatsiya: SwitchgearIcon,
  instrument: ToolIcon,
  krepezh: FastenerIcon,
  "shchity-korpusa": EnclosureIcon,
};

/** Resolves a category slug to its hand-drawn pictogram, or null if none exists. */
export function resolveCategoryIllustration(slug: string) {
  return categoryIllustrations[slug] ?? null;
}

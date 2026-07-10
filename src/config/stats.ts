export interface Stat {
  value: string;
  label: string;
}

/** Trust signals surfaced in the hero — the "надёжность" cue at a glance. */
export const heroStats: Stat[] = [
  { value: "12+", label: "лет на рынке электротехники" },
  { value: "8 500+", label: "позиций в каталоге" },
  { value: "17", label: "регионов поставки по РК" },
  { value: "15 мин", label: "на подготовку КП" },
];

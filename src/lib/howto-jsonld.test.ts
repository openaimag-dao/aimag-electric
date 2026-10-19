import { describe, expect, it } from "vitest";
import { buildHowToJsonLd } from "@/lib/howto-jsonld";

describe("buildHowToJsonLd", () => {
  it("numbers steps in order starting from 1", () => {
    const howTo = buildHowToJsonLd({
      name: "Как рассчитать сечение кабеля",
      description: "Пошаговый расчёт сечения по нагрузке.",
      steps: [
        { name: "Укажите нагрузку", text: "Введите мощность в кВт или ток в А." },
        { name: "Выберите материал жилы", text: "Медь или алюминий." },
      ],
    });

    expect(howTo["@type"]).toBe("HowTo");
    expect(howTo.step).toEqual([
      {
        "@type": "HowToStep",
        position: 1,
        name: "Укажите нагрузку",
        text: "Введите мощность в кВт или ток в А.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Выберите материал жилы",
        text: "Медь или алюминий.",
      },
    ]);
  });
});

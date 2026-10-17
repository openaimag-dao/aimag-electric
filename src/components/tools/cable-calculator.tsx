"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATALOG_CROSS_SECTIONS,
  currentFromPower,
  recommendCrossSection,
  type CableMaterial,
  type NetworkPhase,
} from "@/lib/cable-calc";

type LoadMode = "power" | "current";

/** Nearest catalog-filterable cross-section at or above the recommended one, so the CTA link never lands on an empty filtered page. */
function nearestCatalogCrossSection(value: number): number {
  return CATALOG_CROSS_SECTIONS.find((cs) => cs >= value) ?? CATALOG_CROSS_SECTIONS.at(-1)!;
}

export function CableCalculator() {
  const [mode, setMode] = useState<LoadMode>("power");
  const [power, setPower] = useState("5");
  const [current, setCurrent] = useState("20");
  const [phase, setPhase] = useState<NetworkPhase>("single");
  const [material, setMaterial] = useState<CableMaterial>("copper");
  const [length, setLength] = useState("20");

  const result = useMemo(() => {
    const loadCurrent =
      mode === "current" ? Number(current) : currentFromPower(Number(power) || 0, phase);
    if (!Number.isFinite(loadCurrent) || loadCurrent <= 0) return null;
    return { loadCurrent, ...recommendCrossSection(loadCurrent, material) };
  }, [mode, power, current, phase, material]);

  const lengthMeters = Number(length) || 0;
  const longRun = lengthMeters > 50;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-primary">Нагрузка задаю через</label>
          <Tabs value={mode} onValueChange={(v) => setMode(v as LoadMode)} className="mt-2">
            <TabsList>
              <TabsTrigger value="power">Мощность, кВт</TabsTrigger>
              <TabsTrigger value="current">Ток, А</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {mode === "power" ? (
          <>
            <div>
              <label className="text-sm font-medium text-primary">Мощность нагрузки, кВт</label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={power}
                onChange={(e) => setPower(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-primary">Сеть</label>
              <Select value={phase} onValueChange={(v) => setPhase(v as NetworkPhase)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Однофазная, 220В</SelectItem>
                  <SelectItem value="three">Трёхфазная, 380В</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <div>
            <label className="text-sm font-medium text-primary">Расчётный ток, А</label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="mt-2"
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-primary">Материал жилы</label>
          <Select value={material} onValueChange={(v) => setMaterial(v as CableMaterial)}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="copper">Медь (ВВГ)</SelectItem>
              <SelectItem value="aluminum">Алюминий (АВВГ)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-primary">Длина линии, м</label>
          <Input
            type="number"
            min="0"
            step="1"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            className="mt-2"
          />
        </div>
      </div>

      {result && (
        <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-5">
          <p className="text-sm text-muted-foreground">
            Расчётный ток нагрузки:{" "}
            <span className="font-medium text-primary">{result.loadCurrent.toFixed(1)} А</span>
          </p>

          {result.row ? (
            <>
              <p className="mt-1 text-lg font-semibold text-primary">
                Рекомендуемое сечение: {result.row.crossSectionMm2} мм²
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Допустимый длительный ток для этого сечения: {result.row.currentA} А (прокладка в
                воздухе)
              </p>
              {longRun && (
                <p className="mt-2 text-sm text-amber-700">
                  Длина линии больше 50 м — на такой длине заметна просадка напряжения. Для
                  протяжённых линий рекомендуем взять сечение на шаг больше и проверить расчёт в
                  проекте.
                </p>
              )}
              <Button asChild className="mt-4">
                <Link
                  href={`/catalog?cat=kabel-provod&cs=${nearestCatalogCrossSection(result.row.crossSectionMm2)}`}
                >
                  Смотреть кабель {nearestCatalogCrossSection(result.row.crossSectionMm2)} мм² в
                  каталоге
                </Link>
              </Button>
            </>
          ) : (
            <p className="text-destructive mt-1 font-medium">
              Расчётный ток выходит за пределы справочной таблицы — для такой нагрузки нужен
              индивидуальный проектный расчёт.
            </p>
          )}
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Расчёт ориентировочный, по справочным значениям допустимого тока для прокладки в воздухе
        (аналог таблиц ПУЭ 1.3.4–1.3.5). Он не учитывает групповую прокладку, температуру окружающей
        среды, защитные аппараты и другие условия проекта. Для окончательного выбора сечения
        проверьте расчёт в проектной документации или уточните у электромонтажника.
      </p>
    </div>
  );
}

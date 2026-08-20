import path from "node:path";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

import { siteConfig } from "@/config/site";
import { formatTiyn } from "@/lib/money";

let fontsRegistered = false;

/** react-pdf's built-in fonts (Helvetica etc.) have no Cyrillic glyphs — register Roboto once per process. */
function registerFonts() {
  if (fontsRegistered) return;
  const dir = path.join(process.cwd(), "src/lib/pdf/fonts");
  Font.register({
    family: "Roboto",
    fonts: [
      { src: path.join(dir, "Roboto-Regular.woff"), fontWeight: "normal" },
      { src: path.join(dir, "Roboto-Bold.woff"), fontWeight: "bold" },
    ],
  });
  fontsRegistered = true;
}

const styles = StyleSheet.create({
  page: { fontFamily: "Roboto", fontSize: 10, padding: 36, color: "#1a1a1a" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  brand: { fontSize: 16, fontWeight: "bold" },
  brandSub: { fontSize: 9, color: "#555", marginTop: 2 },
  docTitle: { fontSize: 13, fontWeight: "bold", textAlign: "right" },
  docMeta: { fontSize: 9, color: "#555", textAlign: "right", marginTop: 2 },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#888",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  label: { color: "#555" },
  value: { fontWeight: "bold" },
  table: { marginTop: 6, borderWidth: 1, borderColor: "#ddd" },
  tHeadRow: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  tRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#eee" },
  tCellN: { width: "6%", padding: 5 },
  tCellTitle: { width: "44%", padding: 5 },
  tCellQty: { width: "16%", padding: 5, textAlign: "right" },
  tCellPrice: { width: "17%", padding: 5, textAlign: "right" },
  tCellSum: { width: "17%", padding: 5, textAlign: "right" },
  tHeadText: { fontSize: 9, fontWeight: "bold", color: "#555" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    paddingRight: 5,
  },
  totalLabel: { fontSize: 11, color: "#555", marginRight: 10 },
  totalValue: { fontSize: 13, fontWeight: "bold" },
  footer: { marginTop: 24, fontSize: 8.5, color: "#888", lineHeight: 1.4 },
});

export interface QuotePdfItem {
  title: string;
  sku: string | null;
  qty: number;
  unit: string;
  amountTiyn: number | null;
}

export interface QuotePdfData {
  id: string;
  title: string | null;
  company: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  createdAt: Date;
  items: QuotePdfItem[];
}

function formatDate(d: Date) {
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * PDF export of a Quote — only fields we actually store are rendered. No
 * invented bank details, VAT numbers, or discounts: those live on paper/
 * in a real accounting system this project doesn't have yet.
 */
export function QuotePdfDocument({ quote }: { quote: QuotePdfData }) {
  registerFonts();
  const priced = quote.items.filter((i) => i.amountTiyn !== null);
  const totalTiyn = priced.reduce((sum, i) => sum + (i.amountTiyn as number) * i.qty, 0);
  const hasUnpriced = quote.items.some((i) => i.amountTiyn === null);
  const docNumber = quote.id.slice(-8).toUpperCase();

  return (
    <Document title={`КП ${docNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>{siteConfig.name}</Text>
            <Text style={styles.brandSub}>{siteConfig.description}</Text>
            <Text style={styles.brandSub}>
              {siteConfig.contacts.phone} · {siteConfig.contacts.email}
            </Text>
            <Text style={styles.brandSub}>{siteConfig.contacts.city}</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Коммерческое предложение</Text>
            <Text style={styles.docMeta}>№ {docNumber}</Text>
            <Text style={styles.docMeta}>от {formatDate(quote.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Клиент</Text>
          {quote.title && (
            <View style={styles.row}>
              <Text style={styles.label}>Проект</Text>
              <Text style={styles.value}>{quote.title}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Компания</Text>
            <Text style={styles.value}>{quote.company}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Контактное лицо</Text>
            <Text style={styles.value}>{quote.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Телефон</Text>
            <Text style={styles.value}>{quote.phone}</Text>
          </View>
          {quote.email && (
            <View style={styles.row}>
              <Text style={styles.label}>E-mail</Text>
              <Text style={styles.value}>{quote.email}</Text>
            </View>
          )}
        </View>

        {quote.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Позиции ({quote.items.length})</Text>
            <View style={styles.table}>
              <View style={styles.tHeadRow}>
                <Text style={[styles.tCellN, styles.tHeadText]}>№</Text>
                <Text style={[styles.tCellTitle, styles.tHeadText]}>Наименование</Text>
                <Text style={[styles.tCellQty, styles.tHeadText]}>Кол-во</Text>
                <Text style={[styles.tCellPrice, styles.tHeadText]}>Цена</Text>
                <Text style={[styles.tCellSum, styles.tHeadText]}>Сумма</Text>
              </View>
              {quote.items.map((item, i) => (
                <View style={styles.tRow} key={i}>
                  <Text style={styles.tCellN}>{i + 1}</Text>
                  <Text style={styles.tCellTitle}>
                    {item.title}
                    {item.sku ? ` (арт. ${item.sku})` : ""}
                  </Text>
                  <Text style={styles.tCellQty}>
                    {item.qty} {item.unit}
                  </Text>
                  <Text style={styles.tCellPrice}>
                    {item.amountTiyn !== null ? formatTiyn(item.amountTiyn) : "по запросу"}
                  </Text>
                  <Text style={styles.tCellSum}>
                    {item.amountTiyn !== null ? formatTiyn(item.amountTiyn * item.qty) : "—"}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Итого{hasUnpriced ? " (по позициям с ценой)" : ""}, без НДС
              </Text>
              <Text style={styles.totalValue}>{formatTiyn(totalTiyn)}</Text>
            </View>
          </View>
        )}

        {quote.message && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Комментарий</Text>
            <Text>{quote.message}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Цены указаны без НДС и подлежат уточнению менеджером с учётом объёма и условий поставки.
          Настоящий документ носит информационный характер и не является публичной офертой. По
          вопросам — {siteConfig.contacts.phone}, {siteConfig.contacts.email}.
        </Text>
      </Page>
    </Document>
  );
}

import path from "node:path";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

import { siteConfig } from "@/config/site";
import { companyRequisites } from "@/config/company-requisites";
import { formatTenge } from "@/lib/money";

let fontsRegistered = false;

/** Same registration as quote-pdf.tsx — react-pdf's built-in fonts have no Cyrillic glyphs. */
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
  table: { marginTop: 6, borderWidth: 1, borderColor: "#ddd" },
  tHeadRow: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  tRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#eee" },
  tCellN: { width: "6%", padding: 5 },
  tCellTitle: { width: "39%", padding: 5 },
  tCellSku: { width: "15%", padding: 5 },
  tCellQty: { width: "13%", padding: 5, textAlign: "right" },
  tCellPrice: { width: "13%", padding: 5, textAlign: "right" },
  tCellSum: { width: "14%", padding: 5, textAlign: "right" },
  tHeadText: { fontSize: 9, fontWeight: "bold", color: "#555" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    paddingRight: 5,
  },
  totalLabel: { fontSize: 11, color: "#555", marginRight: 10 },
  totalValue: { fontSize: 13, fontWeight: "bold" },
  requisites: {
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingTop: 10,
  },
  reqRow: { flexDirection: "row", marginBottom: 2 },
  reqLabel: { width: "22%", color: "#555" },
  reqValue: { width: "78%" },
  footer: { marginTop: 14, fontSize: 8.5, color: "#888", lineHeight: 1.4 },
});

export interface CartSpecPdfItem {
  title: string;
  sku: string;
  qty: number;
  unit: string;
  priceTenge: number | null;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Self-service "Спецификация" export of a cart — not a КП letter (no
 * client contact section, since none is known at this point) and not an
 * invoice (no signature/stamp block: this project has no e-signing or
 * accounting integration to back one). Real AIMAG requisites in the footer,
 * same source as the "Оплата"/"Контакты" pages.
 */
export function CartSpecPdfDocument({ items }: { items: CartSpecPdfItem[] }) {
  registerFonts();
  const priced = items.filter((i) => i.priceTenge !== null);
  const totalTenge = priced.reduce((sum, i) => sum + (i.priceTenge as number) * i.qty, 0);
  const hasUnpriced = items.some((i) => i.priceTenge === null);
  const docNumber = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  return (
    <Document title="Спецификация">
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>{siteConfig.name}</Text>
            <Text style={styles.brandSub}>{siteConfig.description}</Text>
            <Text style={styles.brandSub}>
              {siteConfig.contacts.phone} · {siteConfig.contacts.email}
            </Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Спецификация</Text>
            <Text style={styles.docMeta}>№ {docNumber}</Text>
            <Text style={styles.docMeta}>от {formatDate(new Date())}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Позиции ({items.length})</Text>
          <View style={styles.table}>
            <View style={styles.tHeadRow}>
              <Text style={[styles.tCellN, styles.tHeadText]}>№</Text>
              <Text style={[styles.tCellTitle, styles.tHeadText]}>Наименование</Text>
              <Text style={[styles.tCellSku, styles.tHeadText]}>Артикул</Text>
              <Text style={[styles.tCellQty, styles.tHeadText]}>Кол-во</Text>
              <Text style={[styles.tCellPrice, styles.tHeadText]}>Цена</Text>
              <Text style={[styles.tCellSum, styles.tHeadText]}>Сумма</Text>
            </View>
            {items.map((item, i) => (
              <View style={styles.tRow} key={i}>
                <Text style={styles.tCellN}>{i + 1}</Text>
                <Text style={styles.tCellTitle}>{item.title}</Text>
                <Text style={styles.tCellSku}>{item.sku}</Text>
                <Text style={styles.tCellQty}>
                  {item.qty} {item.unit}
                </Text>
                <Text style={styles.tCellPrice}>
                  {item.priceTenge !== null ? formatTenge(item.priceTenge) : "по запросу"}
                </Text>
                <Text style={styles.tCellSum}>
                  {item.priceTenge !== null ? formatTenge(item.priceTenge * item.qty) : "—"}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Итого{hasUnpriced ? " (по позициям с ценой)" : ""}, без НДС
            </Text>
            <Text style={styles.totalValue}>{formatTenge(totalTenge)}</Text>
          </View>
        </View>

        <View style={styles.requisites}>
          <Text style={styles.sectionTitle}>Реквизиты поставщика</Text>
          <View style={styles.reqRow}>
            <Text style={styles.reqLabel}>Наименование</Text>
            <Text style={styles.reqValue}>{companyRequisites.legalName}</Text>
          </View>
          <View style={styles.reqRow}>
            <Text style={styles.reqLabel}>ИИН</Text>
            <Text style={styles.reqValue}>{companyRequisites.iin}</Text>
          </View>
          <View style={styles.reqRow}>
            <Text style={styles.reqLabel}>Адрес</Text>
            <Text style={styles.reqValue}>{companyRequisites.address}</Text>
          </View>
          <View style={styles.reqRow}>
            <Text style={styles.reqLabel}>Банк</Text>
            <Text style={styles.reqValue}>{companyRequisites.bank}</Text>
          </View>
          <View style={styles.reqRow}>
            <Text style={styles.reqLabel}>БИК</Text>
            <Text style={styles.reqValue}>{companyRequisites.bik}</Text>
          </View>
          <View style={styles.reqRow}>
            <Text style={styles.reqLabel}>ИИК</Text>
            <Text style={styles.reqValue}>{companyRequisites.iik}</Text>
          </View>
          <View style={styles.reqRow}>
            <Text style={styles.reqLabel}>Телефон</Text>
            <Text style={styles.reqValue}>{companyRequisites.phone}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Цены указаны без НДС и подлежат уточнению менеджером с учётом объёма и условий поставки.
          Настоящий документ носит информационный характер и не является публичной офертой. По
          вопросам — {siteConfig.contacts.phone}, {siteConfig.contacts.email}.
        </Text>
      </Page>
    </Document>
  );
}

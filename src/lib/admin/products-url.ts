import type { ProductQualityFilter } from "@/lib/admin/product-quality";

export const ADMIN_PRODUCTS_PAGE_SIZE = 30;

export interface AdminProductsQuery {
  q: string;
  category: string;
  brand: string;
  status: "" | "published" | "hidden";
  quality: "" | ProductQualityFilter;
  page: number;
}

export const emptyAdminProductsQuery: AdminProductsQuery = {
  q: "",
  category: "",
  brand: "",
  status: "",
  quality: "",
  page: 1,
};

export function parseAdminProductsQuery(params: URLSearchParams): AdminProductsQuery {
  const pageRaw = Number(params.get("page"));
  const status = params.get("status");
  const quality = params.get("quality");
  return {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    brand: params.get("brand") ?? "",
    status: status === "published" || status === "hidden" ? status : "",
    quality: (quality as ProductQualityFilter | null) ?? "",
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
  };
}

export function adminProductsQueryToParams(q: AdminProductsQuery): URLSearchParams {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.category) p.set("category", q.category);
  if (q.brand) p.set("brand", q.brand);
  if (q.status) p.set("status", q.status);
  if (q.quality) p.set("quality", q.quality);
  if (q.page > 1) p.set("page", String(q.page));
  return p;
}

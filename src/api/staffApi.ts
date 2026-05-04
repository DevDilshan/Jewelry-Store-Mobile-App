import { apiFetch, apiUpload } from "./client";
import type { Order, Product } from "../types/models";

function asArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

export async function staffFetchProducts(token: string): Promise<Product[]> {
  const data = await apiFetch("/api/product", { token });
  return asArray<Product>(data);
}

export async function staffCreateProduct(
  token: string,
  body: Record<string, unknown>
): Promise<Product> {
  const data = await apiFetch("/api/product/create", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  return data as Product;
}

export async function staffUpdateProduct(
  token: string,
  productId: string,
  body: Record<string, unknown>
): Promise<Product> {
  const data = await apiFetch(`/api/product/${productId}`, {
    method: "PUT",
    token,
    body: JSON.stringify(body),
  });
  return data as Product;
}

export async function staffDeleteProduct(token: string, productId: string): Promise<void> {
  await apiFetch(`/api/product/${productId}`, { method: "DELETE", token });
}

export type StaffDiscount = {
  _id: string;
  discountName: string;
  campaignTheme?: string;
  discountType: "percentage" | "fixed";
  discountAmount: number;
  promoScope: "coupon" | "site_wide";
  discountCoupon: string;
  startDate?: string;
  endDate?: string;
  timesApplied?: number;
  minSubtotal?: number | null;
  maxUses?: number | null;
};

export async function staffFetchDiscounts(token: string): Promise<StaffDiscount[]> {
  const data = await apiFetch("/api/discount/", { token });
  return asArray<StaffDiscount>(data);
}

export async function staffCreateDiscount(token: string, body: Record<string, unknown>): Promise<StaffDiscount> {
  const data = await apiFetch("/api/discount/create", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  return data as StaffDiscount;
}

export async function staffUpdateDiscount(
  token: string,
  id: string,
  body: Record<string, unknown>
): Promise<StaffDiscount> {
  const data = await apiFetch(`/api/discount/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(body),
  });
  return data as StaffDiscount;
}

export async function staffDeleteDiscount(token: string, id: string): Promise<void> {
  await apiFetch(`/api/discount/${id}`, { method: "DELETE", token });
}

export type PortfolioImage = {
  _id: string;
  relPath: string;
  caption?: string;
};

export type StaffPortfolioRow = {
  _id: string;
  displayName: string;
  headline?: string;
  bio?: string;
  specialties?: string[];
  yearsOfExperience?: number;
  completedProjects?: number;
  isPublished: boolean;
  images?: PortfolioImage[];
  staff?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
    jobTitle?: string;
    role?: string;
  };
};

/** Full portfolio returned from GET/PATCH (includes images). */
export type DesignerPortfolioFull = StaffPortfolioRow & {
  images: PortfolioImage[];
};

export async function staffFetchPortfolios(token: string): Promise<StaffPortfolioRow[]> {
  const res = await apiFetch("/api/designer-portfolios/admin?limit=100", { token });
  const o = res as { data?: StaffPortfolioRow[] };
  return o.data ?? [];
}

export async function staffFetchPortfolio(token: string, id: string): Promise<DesignerPortfolioFull> {
  const res = await apiFetch(`/api/designer-portfolios/admin/${id}`, { token });
  const o = res as { data?: DesignerPortfolioFull };
  if (!o.data) throw new Error("Portfolio not found");
  return o.data;
}

export async function staffPatchPortfolio(
  token: string,
  id: string,
  body: Record<string, unknown>
): Promise<DesignerPortfolioFull> {
  const res = await apiFetch(`/api/designer-portfolios/admin/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
  const o = res as { data?: DesignerPortfolioFull };
  if (!o.data) throw new Error("Update failed");
  return o.data;
}

/** Designer role — own portfolio (GET /me). */
export async function designerFetchMyPortfolio(token: string): Promise<DesignerPortfolioFull | null> {
  const res = await apiFetch("/api/designer-portfolios/me", { token });
  const o = res as { data?: DesignerPortfolioFull | null };
  return o.data ?? null;
}

export async function designerCreatePortfolio(
  token: string,
  body: {
    displayName: string;
    headline?: string;
    bio?: string;
    specialties?: string[];
    yearsOfExperience: number;
    completedProjects: number;
    isPublished?: boolean;
  }
): Promise<DesignerPortfolioFull> {
  const res = await apiFetch("/api/designer-portfolios/me", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  const o = res as { data?: DesignerPortfolioFull };
  if (!o.data) throw new Error("Could not create portfolio");
  return o.data;
}

export async function designerPatchMyPortfolio(
  token: string,
  body: Record<string, unknown>
): Promise<DesignerPortfolioFull> {
  const res = await apiFetch("/api/designer-portfolios/me", {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
  const o = res as { data?: DesignerPortfolioFull };
  if (!o.data) throw new Error("Update failed");
  return o.data;
}

/** Multipart: field `image`, optional `caption`. */
export async function designerUploadPortfolioImage(
  token: string,
  localUri: string,
  mimeType: string,
  caption: string
): Promise<DesignerPortfolioFull> {
  const form = new FormData();
  form.append("caption", caption.trim());
  const ext = mimeType.includes("png") ? "png" : "jpeg";
  form.append(
    "image",
    { uri: localUri, name: `portfolio.${ext}`, type: mimeType || "image/jpeg" } as unknown as Blob
  );
  const res = await apiUpload("/api/designer-portfolios/me/images", { token, formData: form });
  const o = res as { data?: DesignerPortfolioFull };
  if (!o.data) throw new Error("Upload failed");
  return o.data;
}

export async function designerDeletePortfolioImage(token: string, imageId: string): Promise<DesignerPortfolioFull> {
  const res = await apiFetch(`/api/designer-portfolios/me/images/${imageId}`, {
    method: "DELETE",
    token,
  });
  const o = res as { data?: DesignerPortfolioFull };
  if (!o.data) throw new Error("Could not delete image");
  return o.data;
}

/** Admin / product manager — create portfolio for a designer staff account */
export async function adminCreatePortfolio(
  token: string,
  body: {
    staffId: string;
    displayName: string;
    headline?: string;
    bio?: string;
    specialties?: string[];
    yearsOfExperience: number;
    completedProjects: number;
    isPublished?: boolean;
  }
): Promise<DesignerPortfolioFull> {
  const res = await apiFetch("/api/designer-portfolios/admin", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  const o = res as { data?: DesignerPortfolioFull };
  if (!o.data) throw new Error("Could not create portfolio");
  return o.data;
}

export async function adminUploadPortfolioImage(
  token: string,
  portfolioId: string,
  localUri: string,
  mimeType: string,
  caption: string
): Promise<DesignerPortfolioFull> {
  const form = new FormData();
  form.append("caption", caption.trim());
  const ext = mimeType.includes("png") ? "png" : "jpeg";
  form.append(
    "image",
    { uri: localUri, name: `portfolio.${ext}`, type: mimeType || "image/jpeg" } as unknown as Blob
  );
  const res = await apiUpload(`/api/designer-portfolios/admin/${portfolioId}/images`, { token, formData: form });
  const o = res as { data?: DesignerPortfolioFull };
  if (!o.data) throw new Error("Upload failed");
  return o.data;
}

export async function adminDeletePortfolioImage(
  token: string,
  portfolioId: string,
  imageId: string
): Promise<DesignerPortfolioFull> {
  const res = await apiFetch(`/api/designer-portfolios/admin/${portfolioId}/images/${imageId}`, {
    method: "DELETE",
    token,
  });
  const o = res as { data?: DesignerPortfolioFull };
  if (!o.data) throw new Error("Could not delete image");
  return o.data;
}

export type StaffMemberRow = {
  _id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
};

export async function staffFetchTeam(token: string): Promise<StaffMemberRow[]> {
  const data = await apiFetch("/api/staff/", { token });
  return asArray<StaffMemberRow>(data);
}

export async function staffRegisterMember(
  token: string,
  body: { username: string; email: string; role: string; password?: string }
): Promise<void> {
  await apiFetch("/api/staff/register", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export type StaffFeedbackRow = {
  _id: string;
  customerName?: string;
  title?: string;
  feedback?: string;
  rating?: number;
  staffReply?: string;
  createdAt?: string;
  customer?: { firstName?: string; lastName?: string; email?: string };
  order?: Order;
};

export async function staffFetchFeedback(token: string): Promise<StaffFeedbackRow[]> {
  const data = await apiFetch("/api/feedback?limit=100", { token });
  return asArray<StaffFeedbackRow>(data);
}

export async function staffReplyFeedback(token: string, id: string, staffReply: string): Promise<void> {
  await apiFetch(`/api/feedback/${id}/reply`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ staffReply }),
  });
}

export async function staffDeleteFeedback(token: string, id: string): Promise<void> {
  await apiFetch(`/api/feedback/${id}`, { method: "DELETE", token });
}

export async function staffFetchOrders(token: string): Promise<Order[]> {
  const res = await apiFetch("/api/order/admin/all?limit=200", { token });
  const o = res as { success?: boolean; data?: Order[] };
  return o.data ?? [];
}

export async function staffUpdateOrder(
  token: string,
  orderId: string,
  body: { orderStatus?: string; paymentStatus?: string }
): Promise<Order> {
  const res = await apiFetch(`/api/order/admin/${orderId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
  const o = res as { data?: Order };
  if (!o.data) throw new Error("Could not update order");
  return o.data;
}

export async function staffOrderStats(token: string): Promise<{ totalOrders: number; totalRevenue: number }> {
  const res = await apiFetch("/api/order/admin/stats", { token });
  const o = res as { data?: { totalOrders: number; totalRevenue: number } };
  return o.data ?? { totalOrders: 0, totalRevenue: 0 };
}

export type CustomDesignRequestRow = {
  _id: string;
  title?: string;
  description?: string;
  status?: string;
  staffNote?: string;
  sketchRelPath?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  budgetNote?: string;
  createdAt?: string;
  customer?: { firstName?: string; lastName?: string; email?: string; phone?: string } | null;
};

export async function staffListCustomDesignRequests(
  token: string,
  status?: string
): Promise<{ data: CustomDesignRequestRow[]; meta?: { total: number } }> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await apiFetch(`/api/custom-design-requests/admin${q}`, { token });
  const o = res as { data?: CustomDesignRequestRow[]; meta?: { total: number } };
  return { data: o.data ?? [], meta: o.meta };
}

export async function staffPatchCustomDesignRequest(
  token: string,
  id: string,
  body: { status?: string; staffNote?: string }
): Promise<CustomDesignRequestRow> {
  const res = await apiFetch(`/api/custom-design-requests/admin/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
  const o = res as { data?: CustomDesignRequestRow };
  if (!o.data) throw new Error("Could not save request");
  return o.data;
}

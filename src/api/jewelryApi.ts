import { apiFetch } from "./client";
import type {
  AuthUser,
  CustomerOrderFeedback,
  DesignerPortfolioPublic,
  Order,
  Product,
  ProductPageBundle,
  StaffUser,
} from "../types/models";

function asArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

export async function fetchProductsShop(token?: string | null): Promise<Product[]> {
  const data = await apiFetch("/api/product?forShop=1", { token });
  const list = asArray<Product>(data);
  return list.filter((p) => p.isActive);
}

export async function fetchProductBundle(
  productId: string,
  token?: string | null
): Promise<ProductPageBundle> {
  const data = await apiFetch(`/api/product-review/page/${productId}`, { token });
  return data as ProductPageBundle;
}

export async function loginStaff(email: string, password: string) {
  return apiFetch("/api/staff/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }) as Promise<{
    username: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    accesstoken: string;
  }>;
}

export async function fetchStaffMe(token: string): Promise<StaffUser> {
  const data = await apiFetch("/api/staff/me", { token });
  const o = data as Record<string, unknown>;
  return {
    id: String(o._id ?? o.id ?? ""),
    username: String(o.username ?? ""),
    email: String(o.email ?? ""),
    role: String(o.role ?? ""),
    firstName: o.firstName != null ? String(o.firstName) : "",
    lastName: o.lastName != null ? String(o.lastName) : "",
  };
}

export async function loginCustomer(email: string, password: string) {
  return apiFetch("/api/customer/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }) as Promise<{
    id: string;
    firstname?: string;
    lastname?: string;
    email: string;
    token: string;
    address?: string;
  }>;
}

export async function registerCustomer(body: {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  address?: string;
}) {
  return apiFetch("/api/customer/register", {
    method: "POST",
    body: JSON.stringify(body),
  }) as Promise<{
    id: string;
    firstname?: string;
    lastname?: string;
    email: string;
    token: string;
    address?: string;
  }>;
}

export async function fetchCustomerMe(token: string): Promise<AuthUser> {
  const data = await apiFetch("/api/customer/me", { token });
  const o = data as Record<string, unknown>;
  return {
    id: String(o.id ?? ""),
    firstName: String(o.firstName ?? ""),
    lastName: String(o.lastName ?? ""),
    email: String(o.email ?? ""),
    phone: o.phone != null ? String(o.phone) : undefined,
    address: o.address != null ? String(o.address) : undefined,
  };
}

export async function placeOrder(
  token: string,
  items: { productId: string; quantity: number }[],
  discountCoupon?: string
) {
  return apiFetch("/api/order/", {
    method: "POST",
    token,
    body: JSON.stringify({
      items,
      discountCoupon: discountCoupon?.trim() || undefined,
    }),
  }) as Promise<{ success: boolean; message?: string; data: Order }>;
}

export async function fetchMyOrders(token: string) {
  return apiFetch("/api/order/my", { token }) as Promise<{ success: boolean; data: Order[] }>;
}

export async function fetchOrder(token: string, orderId: string) {
  return apiFetch(`/api/order/${orderId}`, { token }) as Promise<{ success: boolean; data: Order }>;
}

export async function cancelOrder(token: string, orderId: string) {
  return apiFetch(`/api/order/${orderId}/cancel`, {
    method: "PATCH",
    token,
  }) as Promise<{ success: boolean; message?: string; data: Order }>;
}

export async function createProductReview(
  token: string,
  body: { productId: string; rating: number; title?: string; text: string }
) {
  return apiFetch("/api/product-review/", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export async function listDesignerPortfolios() {
  const res = await apiFetch("/api/designer-portfolios/public?limit=50");
  const o = res as { data?: DesignerPortfolioPublic[] };
  return o.data ?? [];
}

export async function getDesignerPortfolio(id: string) {
  const res = await apiFetch(`/api/designer-portfolios/public/${id}`);
  const o = res as { data?: DesignerPortfolioPublic };
  if (!o.data) throw new Error("Portfolio not found");
  return o.data;
}

/** Public guest inquiry (no customer login, no sketch). Backend: POST /api/custom-design-requests/inquiry */
export async function submitGuestCustomDesignInquiry(body: {
  name: string;
  email: string;
  phone?: string;
  title?: string;
  description: string;
  budget?: string;
}): Promise<{ success: boolean; message?: string }> {
  const title = body.title?.trim().slice(0, 200);
  const data = (await apiFetch("/api/custom-design-requests/inquiry", {
    method: "POST",
    body: JSON.stringify({
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim() || undefined,
      description: body.description.trim(),
      budget: body.budget?.trim() || undefined,
      ...(title ? { title } : {}),
    }),
  })) as { success?: boolean; message?: string };
  return { success: Boolean(data?.success), message: data?.message };
}

export async function validateCoupon(
  code: string,
  baseSubtotal: number,
  siteWideSavings: number
) {
  return apiFetch("/api/discount/validate", {
    method: "POST",
    body: JSON.stringify({ code, baseSubtotal, siteWideSavings }),
  }) as Promise<{
    valid: boolean;
    message?: string;
    discountAmount?: number;
    code?: string;
  }>;
}

export async function patchCustomerMe(
  token: string,
  body: { firstName?: string; lastName?: string; email?: string; phone?: string; address?: string }
) {
  return apiFetch("/api/customer/me", {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  }) as Promise<AuthUser & { message?: string }>;
}

export async function changeCustomerPassword(
  token: string,
  body: { currentPassword: string; newPassword: string }
) {
  return apiFetch("/api/customer/me/password", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  }) as Promise<{ message?: string }>;
}

export async function forgotCustomerPassword(email: string) {
  return apiFetch("/api/customer/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim() }),
  }) as Promise<{ message?: string }>;
}

export async function fetchMyFeedback(token: string): Promise<CustomerOrderFeedback[]> {
  const data = await apiFetch("/api/feedback/my", { token });
  return asArray<CustomerOrderFeedback>(data);
}

export async function createOrderFeedback(
  token: string,
  body: { orderId: string; title?: string; feedback: string; rating: number }
) {
  return apiFetch("/api/feedback/create", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export async function patchOrderFeedback(
  token: string,
  id: string,
  body: { title?: string; feedback?: string; rating?: number }
) {
  return apiFetch(`/api/feedback/my/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

export async function deleteOrderFeedback(token: string, id: string) {
  return apiFetch(`/api/feedback/my/${id}`, {
    method: "DELETE",
    token,
  });
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CartLine } from "../types/models";

/** Same key as web `shopCartStorage.js` for parity */
export const CART_STORAGE_KEY = "spark_shop_cart";

function normalizeLine(raw: unknown): CartLine | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const productId = String(o.productId ?? "");
  const quantity = Math.max(0, parseInt(String(o.quantity ?? 0), 10) || 0);
  if (!productId || quantity < 1) return null;

  const p = o.product;
  if (p && typeof p === "object" && p !== null && "_id" in p) {
    return {
      productId,
      quantity,
      selected: o.selected === false ? false : true,
      product: p as CartLine["product"],
    };
  }

  return {
    productId,
    quantity,
    selected: o.selected === false ? false : true,
    product: {
      _id: productId,
      productName: String(o.productName ?? "Item"),
      productCategory: "",
      productPrice: Number(o.unitPrice ?? 0),
      compareAtPrice: o.compareAtPrice != null ? Number(o.compareAtPrice) : undefined,
      stockQuantity: 9999,
      reorderLevel: 1,
      isActive: true,
      productImage: o.productImage != null ? String(o.productImage) : undefined,
    },
  };
}

export async function loadCartFromStorage(): Promise<CartLine[]> {
  try {
    const s = await AsyncStorage.getItem(CART_STORAGE_KEY);
    if (!s) return [];
    const raw = JSON.parse(s);
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeLine).filter((x): x is CartLine => x != null);
  } catch {
    return [];
  }
}

export async function saveCartToStorage(lines: CartLine[]): Promise<void> {
  await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
}

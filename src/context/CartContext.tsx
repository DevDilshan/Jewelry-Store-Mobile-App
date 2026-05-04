import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartLine, Product } from "../types/models";
import { loadCartFromStorage, saveCartToStorage } from "../utils/cartStorage";

function lineIncluded(line: CartLine): boolean {
  return line.selected !== false;
}

type CartTotals = {
  /** Sum of list/original prices × qty — matches web `useShopCheckout` baseSubtotal for coupon API */
  baseSubtotal: number;
  /** Savings from active site-wide pricing vs compare-at */
  siteWideSavings: number;
  /** Sum of current unit (sale) prices × qty */
  displaySubtotal: number;
  /** Either coupon savings or site-wide savings, not both (matches web UI) */
  activeDiscountAmount: number;
  /** Estimated total: baseSubtotal - activeDiscount */
  estimatedTotal: number;
};

export type PromoState = {
  valid: boolean;
  discountAmount?: number;
  code?: string;
  message?: string;
};

type CartContextValue = {
  lines: CartLine[];
  hydrated: boolean;
  addProduct: (product: Product, qty?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  toggleLineSelected: (productId: string) => void;
  removeLine: (productId: string) => void;
  clear: () => void;
  cartCount: number;
  selectedLines: CartLine[];
  totals: CartTotals;
  promo: PromoState | null;
  setPromo: (p: PromoState | null) => void;
  clearPromo: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function computeTotals(lines: CartLine[], promo: PromoState | null): CartTotals {
  let baseSubtotal = 0;
  let siteWideSavings = 0;
  let displaySubtotal = 0;

  for (const line of lines) {
    if (!lineIncluded(line)) continue;
    const p = line.product;
    const unit = Number(p.productPrice);
    const compare = p.compareAtPrice != null ? Number(p.compareAtPrice) : null;
    const originalPrice =
      compare != null && compare > unit ? compare : unit;
    baseSubtotal += originalPrice * line.quantity;
    displaySubtotal += unit * line.quantity;
    if (compare != null && compare > unit) {
      siteWideSavings += (compare - unit) * line.quantity;
    }
  }

  baseSubtotal = Math.round(baseSubtotal * 100) / 100;
  siteWideSavings = Math.round(siteWideSavings * 100) / 100;
  displaySubtotal = Math.round(displaySubtotal * 100) / 100;

  const activeDiscountAmount =
    promo?.valid && promo.discountAmount != null ? promo.discountAmount : siteWideSavings;

  const estimatedTotal = Math.max(
    0,
    Math.round((baseSubtotal - activeDiscountAmount) * 100) / 100
  );

  return {
    baseSubtotal,
    siteWideSavings,
    displaySubtotal,
    activeDiscountAmount,
    estimatedTotal,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [promo, setPromoState] = useState<PromoState | null>(null);

  const setPromo = useCallback((p: PromoState | null) => {
    setPromoState(p);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadCartFromStorage();
      if (!cancelled) {
        setLines(loaded);
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveCartToStorage(lines);
  }, [lines, hydrated]);

  const clearPromo = useCallback(() => setPromoState(null), []);

  const addProduct = useCallback((product: Product, qty = 1) => {
    if (!product.stockQuantity) return;
    setPromoState(null);
    const id = String(product._id);
    setLines((prev) => {
      const i = prev.findIndex((l) => l.productId === id);
      if (i >= 0) {
        const next = [...prev];
        const q = next[i].quantity + qty;
        if (q > product.stockQuantity) return prev;
        next[i] = {
          ...next[i],
          quantity: q,
          product,
        };
        return next;
      }
      return [
        ...prev,
        {
          productId: id,
          quantity: Math.min(qty, product.stockQuantity),
          product,
          selected: true,
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setPromoState(null);
    setLines((prev) => {
      const line = prev.find((l) => l.productId === productId);
      if (!line) return prev;
      const max = line.product.stockQuantity;
      const q = Math.max(0, Math.min(quantity, max));
      if (q === 0) return prev.filter((l) => l.productId !== productId);
      return prev.map((l) =>
        l.productId === productId ? { ...l, quantity: q } : l
      );
    });
  }, []);

  const toggleLineSelected = useCallback((productId: string) => {
    setPromoState(null);
    setLines((prev) =>
      prev.map((l) =>
        l.productId === productId
          ? { ...l, selected: l.selected === false ? true : false }
          : l
      )
    );
  }, []);

  const removeLine = useCallback((productId: string) => {
    setPromoState(null);
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => {
    setPromoState(null);
    setLines([]);
  }, []);

  const cartCount = useMemo(
    () => lines.reduce((n, line) => n + line.quantity, 0),
    [lines]
  );

  const selectedLines = useMemo(
    () => lines.filter((l) => lineIncluded(l)),
    [lines]
  );

  const totals = useMemo(() => computeTotals(lines, promo), [lines, promo]);

  const value = useMemo(
    () => ({
      lines,
      hydrated,
      addProduct,
      setQuantity,
      toggleLineSelected,
      removeLine,
      clear,
      cartCount,
      selectedLines,
      totals,
      promo,
      setPromo,
      clearPromo,
    }),
    [
      lines,
      hydrated,
      addProduct,
      setQuantity,
      toggleLineSelected,
      removeLine,
      clear,
      cartCount,
      selectedLines,
      totals,
      promo,
      clearPromo,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

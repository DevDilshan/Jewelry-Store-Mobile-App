import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, type NavigationProp } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { fetchProductsShop, listDesignerPortfolios } from "../api/jewelryApi";
import { apiFetch } from "../api/client";
import { mediaUrl, portfolioImageDisplayUri } from "../config";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList, RootTabParamList, ShopStackParamList } from "../navigation/types";
import type { DesignerPortfolioPublic, Product } from "../types/models";
import { colors, radius, spacing, touch } from "../theme";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeMain">;

type ActiveCoupon = {
  code: string;
  discountType: "percentage" | "fixed";
  discountAmount: number;
  minSubtotalLkr?: number;
};

const PRODUCT_PREVIEW = 4;
const DESIGNER_PREVIEW = 3;
const GRID_GAP = 12;
const PH = spacing.page;

/* ── Navigation helpers ── */
function goToShopTab(
  navigation: Props["navigation"],
  screen: keyof Pick<ShopStackParamList, "ProductList" | "DesignerList" | "CustomDesign">
) {
  const tab = navigation.getParent() as NavigationProp<RootTabParamList> | undefined;
  if (screen === "CustomDesign") {
    tab?.navigate("Shop", { screen: "CustomDesign", params: { fromHome: true } });
    return;
  }
  tab?.navigate("Shop", { screen });
}

function goToShopProduct(navigation: Props["navigation"], productId: string) {
  const tab = navigation.getParent() as NavigationProp<RootTabParamList> | undefined;
  tab?.navigate("Shop", { screen: "ProductDetail", params: { productId, fromHome: true } });
}

function goToShopDesigner(navigation: Props["navigation"], id: string) {
  const tab = navigation.getParent() as NavigationProp<RootTabParamList> | undefined;
  tab?.navigate("Shop", { screen: "DesignerDetail", params: { id, fromHome: true } });
}

/* ── Features ── */
const FEATURES = [
  { icon: "shield-checkmark-outline" as const, title: "Certified Authentic", desc: "Certificate of authenticity with every piece" },
  { icon: "car-outline" as const, title: "Insured Delivery", desc: "Free insured delivery across Sri Lanka" },
  { icon: "refresh-outline" as const, title: "30-Day Returns", desc: "Hassle-free returns within 30 days" },
  { icon: "chatbubble-ellipses-outline" as const, title: "Expert Support", desc: "Jewelry consultants when you need guidance" },
];

/* ── Contact ── */
const CONTACTS = [
  { icon: "location-outline" as const, label: "Address", value: "42 Galle Road, Colombo 03, Sri Lanka" },
  { icon: "call-outline" as const, label: "Phone", value: "+94 11 234 5678", action: "tel:+94112345678" },
  { icon: "mail-outline" as const, label: "Email", value: "hello@beceff.com", action: "mailto:hello@beceff.com" },
  { icon: "time-outline" as const, label: "Hours", value: "Mon – Sat: 10 AM – 8 PM" },
];

export function HomeScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [designers, setDesigners] = useState<DesignerPortfolioPublic[]>([]);
  const [coupons, setCoupons] = useState<ActiveCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstScreenFocus = useRef(true);

  const tileWidth = (width - PH * 2 - GRID_GAP) / 2;

  const load = useCallback(
    async (mode: "initial" | "refresh" | "focus" = "initial") => {
      if (mode === "refresh") setRefreshing(true);
      else if (mode === "initial") setLoading(true);
      setError(null);
      try {
        const [pRes, dRes, cRes] = await Promise.allSettled([
          fetchProductsShop(token),
          listDesignerPortfolios(),
          apiFetch("/api/discount/public/active-coupons") as Promise<ActiveCoupon[]>,
        ]);
        const plist = pRes.status === "fulfilled" ? pRes.value : [];
        const dlist = dRes.status === "fulfilled" ? dRes.value : [];
        const clist = cRes.status === "fulfilled" && Array.isArray(cRes.value) ? cRes.value : [];
        setProducts(plist.slice(0, PRODUCT_PREVIEW));
        setDesigners(dlist.slice(0, DESIGNER_PREVIEW));
        setCoupons(clist);

        const pFail = pRes.status === "rejected";
        const dFail = dRes.status === "rejected";
        if (pFail && dFail) setError("Could not load data.");
        else if (pFail) setError("Could not load products.");
        else if (dFail) setError("Could not load designers.");
        else setError(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useFocusEffect(
    useCallback(() => {
      const mode = isFirstScreenFocus.current ? "initial" : "focus";
      isFirstScreenFocus.current = false;
      load(mode);
    }, [load])
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load("refresh")} />}
    >
      {/* ═══ COUPON BANNER ═══ */}
      {coupons.length > 0 ? (
        <View style={styles.couponBanner}>
          <Text style={styles.couponLabel}>Limited time offer</Text>
          {coupons.map((c) => {
            const offer =
              c.discountType === "percentage"
                ? `Get ${c.discountAmount}% off`
                : `Save LKR ${c.discountAmount.toLocaleString()}`;
            return (
              <Text key={c.code} style={styles.couponText}>
                {offer} — use <Text style={styles.couponCode}>{c.code}</Text>
                {c.minSubtotalLkr != null && c.minSubtotalLkr > 0
                  ? ` (min. LKR ${c.minSubtotalLkr.toLocaleString()})`
                  : ""}
              </Text>
            );
          })}
        </View>
      ) : null}

      {/* ═══ HERO ═══ */}
      <View style={styles.hero}>
        <Text style={styles.kicker}>Jewelry boutique</Text>
        <Text style={styles.heroTitle}>Crafted to shine,{"\n"}made to last</Text>
        <Text style={styles.heroSub}>
          Handpicked pieces and the artisans behind them — all in one place.
        </Text>
      </View>

      {/* ═══ STATS ═══ */}
      <View style={styles.statsRow}>
        {[
          { num: "1,200+", label: "Pieces curated" },
          { num: "5,000+", label: "Clients served" },
          { num: "4.8 / 5", label: "Avg. rating" },
        ].map((s, i) => (
          <View key={s.label} style={[styles.stat, i > 0 && styles.statBorder]}>
            <Text style={styles.statNum}>{s.num}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      {/* ═══ FEATURED PRODUCTS ═══ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Products</Text>
          <Pressable onPress={() => goToShopTab(navigation, "ProductList")} hitSlop={touch.hitSlop}>
            <Text style={styles.sectionLink}>View all</Text>
          </Pressable>
        </View>
        {loading && products.length === 0 ? (
          <ActivityIndicator color={colors.accent} style={{ paddingVertical: 32 }} />
        ) : products.length === 0 ? (
          <Text style={styles.emptyHint}>No products yet. Pull to refresh.</Text>
        ) : (
          <View style={styles.productGrid}>
            {products.map((p) => {
              const img = mediaUrl(p.productImage);
              return (
                <Pressable
                  key={p._id}
                  style={({ pressed }) => [styles.productTile, { width: tileWidth }, pressed && { opacity: 0.92 }]}
                  onPress={() => goToShopProduct(navigation, p._id)}
                >
                  <View style={[styles.productImgWrap, { height: tileWidth }]}>
                    {img ? (
                      <Image source={{ uri: img }} style={styles.productImg} contentFit="cover" />
                    ) : (
                      <View style={styles.productImgPlaceholder}>
                        <Text style={{ fontSize: 28, color: colors.muted }}>◇</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.productName} numberOfLines={2}>{p.productName}</Text>
                  <View style={styles.priceRow}>
                    {p.compareAtPrice != null && p.compareAtPrice > p.productPrice ? (
                      <Text style={styles.priceCompare}>LKR {p.compareAtPrice.toLocaleString()}</Text>
                    ) : null}
                    <Text style={styles.price}>LKR {p.productPrice.toLocaleString()}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* ═══ DESIGNERS ═══ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Our Designers</Text>
          <Pressable onPress={() => goToShopTab(navigation, "DesignerList")} hitSlop={touch.hitSlop}>
            <Text style={styles.sectionLink}>See all</Text>
          </Pressable>
        </View>
        {loading && designers.length === 0 ? (
          <ActivityIndicator color={colors.accent} style={{ paddingVertical: 24 }} />
        ) : designers.length === 0 ? (
          <Text style={styles.emptyHint}>Portfolios coming soon.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {designers.map((d) => {
              const cover = portfolioImageDisplayUri(d.images?.[0] ?? {});
              return (
                <Pressable
                  key={d._id}
                  style={({ pressed }) => [styles.designerRow, pressed && { opacity: 0.92 }]}
                  onPress={() => goToShopDesigner(navigation, d._id)}
                >
                  <View style={styles.designerAvatar}>
                    {cover ? (
                      <Image source={{ uri: cover }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                    ) : (
                      <Text style={{ fontSize: 20, color: colors.accent }}>✦</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.designerName} numberOfLines={1}>{d.displayName}</Text>
                    {d.headline ? <Text style={styles.designerSub} numberOfLines={2}>{d.headline}</Text> : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* ═══ CUSTOM DESIGN ═══ */}
      <Pressable
        style={({ pressed }) => [styles.customCard, pressed && { opacity: 0.92 }]}
        onPress={() => goToShopTab(navigation, "CustomDesign")}
      >
        <Text style={{ fontSize: 26 }}>🎨</Text>
        <Text style={styles.customTitle}>Request a Custom Design</Text>
        <Text style={styles.customDesc}>Work with our team on a one-of-a-kind piece.</Text>
        <View style={styles.customCta}>
          <Text style={styles.customCtaText}>Get started →</Text>
        </View>
      </Pressable>

      {/* ═══ FEATURES ═══ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Beceff</Text>
        <View style={{ gap: 14, marginTop: 16 }}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View style={styles.featureIconBox}>
                <Ionicons name={f.icon} size={22} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ═══ ABOUT ═══ */}
      <View style={[styles.section, { alignItems: "center" }]}>
        <Text style={styles.aboutTitle}>Crafting dreams{"\n"}since 1995</Text>
        <Text style={styles.aboutText}>
          For nearly three decades, Beceff has been a destination for fine jewelry in Sri Lanka.
          Gemstones are ethically sourced. Settings are finished by hand.
        </Text>
        <View style={styles.valuesRow}>
          {[
            { num: "28+", label: "Years of craft" },
            { num: "150+", label: "Artisans" },
            { num: "100%", label: "Ethically sourced" },
          ].map((v, i) => (
            <View key={v.label} style={[styles.valueItem, i > 0 && styles.valueBorder]}>
              <Text style={styles.valueNum}>{v.num}</Text>
              <Text style={styles.valueLabel}>{v.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ═══ CONTACT ═══ */}
      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Visit Us</Text>
        <Text style={styles.contactSub}>See the collection at our Colombo salon.</Text>
        {CONTACTS.map((c) => (
          <Pressable
            key={c.label}
            style={styles.contactRow}
            onPress={c.action ? () => Linking.openURL(c.action!) : undefined}
            disabled={!c.action}
          >
            <View style={styles.contactIconBox}>
              <Ionicons name={c.icon} size={18} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>{c.label}</Text>
              <Text style={[styles.contactValue, c.action && { color: colors.accent }]}>{c.value}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* ═══ FOOTER ═══ */}
      <View style={styles.footer}>
        <Text style={styles.footerBrand}>Beceff</Text>
        <Text style={styles.footerTagline}>Handcrafted in Sri Lanka · Est. 1995</Text>
        <Text style={styles.footerCopy}>© {new Date().getFullYear()} Beceff. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingTop: 20, paddingBottom: 0 },

  /* ═ Coupon ═ */
  couponBanner: {
    backgroundColor: colors.accent,
    marginHorizontal: PH,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  couponLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  couponText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 22,
  },
  couponCode: {
    fontWeight: "800",
    color: "#fff",
    textDecorationLine: "underline",
  },

  /* ═ Hero ═ */
  hero: { paddingHorizontal: PH, marginBottom: 28 },
  kicker: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: colors.accentMuted,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 38,
    marginBottom: 12,
  },
  heroSub: {
    fontSize: 16,
    color: colors.muted,
    lineHeight: 24,
  },

  /* ═ Stats ═ */
  statsRow: {
    flexDirection: "row",
    marginHorizontal: PH,
    marginBottom: 36,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  stat: { flex: 1, alignItems: "center", paddingVertical: 20 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: colors.border },
  statNum: { fontSize: 20, fontWeight: "700", color: colors.text },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 4 },

  /* ═ Shared ═ */
  errorBanner: {
    marginHorizontal: PH,
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    color: colors.danger,
    fontSize: 15,
    textAlign: "center",
  },
  section: { paddingHorizontal: PH, marginBottom: 36 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 22, fontWeight: "700", color: colors.text },
  sectionLink: { fontSize: 15, fontWeight: "700", color: colors.accent },
  emptyHint: { fontSize: 15, color: colors.muted, lineHeight: 22 },

  /* ═ Products ═ */
  productGrid: { flexDirection: "row", flexWrap: "wrap", gap: GRID_GAP },
  productTile: {
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  productImgWrap: { width: "100%", backgroundColor: colors.border },
  productImg: { width: "100%", height: "100%" },
  productImgPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f5f0eb" },
  productName: {
    marginTop: 10,
    paddingHorizontal: 10,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    minHeight: 40,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 6,
    paddingHorizontal: 10,
    paddingBottom: 12,
  },
  priceCompare: { fontSize: 13, color: colors.muted, textDecorationLine: "line-through" },
  price: { fontSize: 16, fontWeight: "700", color: colors.accent },

  /* ═ Designers ═ */
  designerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 12,
  },
  designerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.bg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  designerName: { fontSize: 16, fontWeight: "700", color: colors.text },
  designerSub: { fontSize: 14, color: colors.muted, marginTop: 3, lineHeight: 19 },

  /* ═ Custom Design ═ */
  customCard: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: PH,
    marginBottom: 36,
  },
  customTitle: { fontSize: 20, fontWeight: "800", color: "#fff", marginTop: 10 },
  customDesc: { marginTop: 8, fontSize: 15, color: "rgba(255,255,255,0.85)", lineHeight: 22 },
  customCta: {
    marginTop: 16,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  customCtaText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  /* ═ Features ═ */
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 2 },
  featureDesc: { fontSize: 14, color: colors.muted, lineHeight: 20 },

  /* ═ About ═ */
  aboutTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 14,
  },
  aboutText: {
    fontSize: 15,
    color: colors.muted,
    lineHeight: 24,
    textAlign: "center",
  },
  valuesRow: {
    flexDirection: "row",
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    alignSelf: "stretch",
  },
  valueItem: { flex: 1, alignItems: "center", paddingVertical: 20 },
  valueBorder: { borderLeftWidth: 1, borderLeftColor: colors.border },
  valueNum: { fontSize: 26, fontWeight: "800", color: colors.accent },
  valueLabel: { fontSize: 11, color: colors.muted, marginTop: 4 },

  /* ═ Contact ═ */
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginHorizontal: PH,
    marginBottom: 36,
  },
  contactTitle: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 4 },
  contactSub: { fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 18 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  contactIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: { fontSize: 12, fontWeight: "700", color: colors.text, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  contactValue: { fontSize: 15, color: colors.muted, lineHeight: 20 },

  /* ═ Footer ═ */
  footer: {
    backgroundColor: colors.text,
    paddingTop: 32,
    paddingBottom: 64,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  footerBrand: {
    fontSize: 18,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 2,
    marginBottom: 6,
  },
  footerTagline: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 8,
  },
  footerCopy: {
    fontSize: 12,
    color: "rgba(255,255,255,0.25)",
  },
});

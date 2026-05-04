import { useFocusEffect, type NavigationProp } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { fetchProductsShop, listDesignerPortfolios } from "../api/jewelryApi";
import { MobileScrollScreen } from "../components/MobileSafeScreen";
import { mediaUrl, portfolioImageDisplayUri } from "../config";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList, RootTabParamList, ShopStackParamList } from "../navigation/types";
import type { DesignerPortfolioPublic, Product } from "../types/models";
import { colors, radius, spacing, touch } from "../theme";

type Props = NativeStackScreenProps<HomeStackParamList, "Home">;

const PRODUCT_PREVIEW = 4;
const DESIGNER_PREVIEW = 4;
const GRID_GAP = 12;

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

export function HomeScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [designers, setDesigners] = useState<DesignerPortfolioPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstScreenFocus = useRef(true);

  const innerWidth = width - spacing.page * 2;
  const tileWidth = (innerWidth - GRID_GAP) / 2;

  const load = useCallback(
    async (mode: "initial" | "refresh" | "focus" = "initial") => {
      if (mode === "refresh") setRefreshing(true);
      else if (mode === "initial") setLoading(true);
      setError(null);
      try {
        const [pRes, dRes] = await Promise.allSettled([
          fetchProductsShop(token),
          listDesignerPortfolios(),
        ]);
        const plist = pRes.status === "fulfilled" ? pRes.value : [];
        const dlist = dRes.status === "fulfilled" ? dRes.value : [];
        setProducts(plist.slice(0, PRODUCT_PREVIEW));
        setDesigners(dlist.slice(0, DESIGNER_PREVIEW));

        const pFail = pRes.status === "rejected";
        const dFail = dRes.status === "rejected";
        if (pFail && dFail) setError("Could not load products or designers.");
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
    <MobileScrollScreen
      contentContainerStyle={styles.scroll}
      scrollProps={{
        refreshControl: <RefreshControl refreshing={refreshing} onRefresh={() => load("refresh")} />,
      }}
    >
      <View style={styles.hero}>
        <Text style={styles.kicker}>Jewelry boutique</Text>
        <Text style={styles.heroTitle}>Crafted to shine,{"\n"}made to last</Text>
        <Text style={styles.heroSub}>
          Handpicked pieces and the artisans behind them — all in one place.
        </Text>
      </View>

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      {/* Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Products</Text>
          <Pressable onPress={() => goToShopTab(navigation, "ProductList")} hitSlop={touch.hitSlop}>
            <Text style={styles.sectionLink}>View all</Text>
          </Pressable>
        </View>
        {loading && products.length === 0 ? (
          <View style={styles.sectionLoading}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : products.length === 0 ? (
          <Text style={styles.emptyHint}>No products yet. Open Shop to browse the full catalogue when items are available.</Text>
        ) : (
          <View style={styles.productGrid}>
            {products.map((p) => {
              const img = mediaUrl(p.productImage);
              return (
                <Pressable
                  key={p._id}
                  style={({ pressed }) => [styles.productTile, { width: tileWidth }, pressed && { opacity: 0.92 }]}
                  onPress={() => goToShopProduct(navigation, p._id)}
                  hitSlop={touch.hitSlop}
                >
                  <View style={[styles.productImageWrap, { height: tileWidth }]}>
                    {img ? (
                      <Image source={{ uri: img }} style={styles.productImage} contentFit="cover" />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        <Text style={styles.placeholderGlyph}>◇</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.productName} numberOfLines={2}>
                    {p.productName}
                  </Text>
                  <Text style={styles.productPrice}>LKR {p.productPrice.toLocaleString()}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Designers */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Our designers</Text>
          <Pressable onPress={() => goToShopTab(navigation, "DesignerList")} hitSlop={touch.hitSlop}>
            <Text style={styles.sectionLink}>See more</Text>
          </Pressable>
        </View>
        {loading && designers.length === 0 ? (
          <View style={styles.sectionLoading}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : designers.length === 0 ? (
          <Text style={styles.emptyHint}>Portfolios coming soon.</Text>
        ) : (
          <View style={styles.designerList}>
            {designers.map((d) => {
              const cover = portfolioImageDisplayUri(d.images?.[0] ?? {});
              return (
                <Pressable
                  key={d._id}
                  style={({ pressed }) => [styles.designerRow, pressed && { opacity: 0.92 }]}
                  onPress={() => goToShopDesigner(navigation, d._id)}
                  hitSlop={touch.hitSlop}
                >
                  <View style={styles.designerAvatar}>
                    {cover ? (
                      <Image source={{ uri: cover }} style={styles.designerAvatarImg} contentFit="cover" />
                    ) : (
                      <Text style={styles.designerAvatarGlyph}>✦</Text>
                    )}
                  </View>
                  <View style={styles.designerText}>
                    <Text style={styles.designerName} numberOfLines={1}>
                      {d.displayName}
                    </Text>
                    {d.headline ? (
                      <Text style={styles.designerHeadline} numberOfLines={2}>
                        {d.headline}
                      </Text>
                    ) : null}
                    {(() => {
                      const parts: string[] = [];
                      if (d.yearsOfExperience != null) parts.push(`${d.yearsOfExperience}+ yrs`);
                      if (d.completedProjects != null) parts.push(`${d.completedProjects.toLocaleString()} projects`);
                      if (parts.length === 0) return null;
                      return (
                        <Text style={styles.designerStats} numberOfLines={1}>
                          {parts.join(" · ")}
                        </Text>
                      );
                    })()}
                  </View>
                  <Text style={styles.designerChev}>›</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Custom design */}
      <Pressable
        style={({ pressed }) => [styles.customCard, pressed && { opacity: 0.92 }]}
        onPress={() => goToShopTab(navigation, "CustomDesign")}
        hitSlop={touch.hitSlop}
      >
        <Text style={styles.customEmoji}>🎨</Text>
        <Text style={styles.customTitle}>Request a custom design</Text>
        <Text style={styles.customDesc}>Work with our team on a one-of-a-kind piece.</Text>
        <View style={styles.customCta}>
          <Text style={styles.customCtaText}>Get started →</Text>
        </View>
      </Pressable>

      <Text style={styles.tagline}>Handcrafted in Sri Lanka · Est. 2018</Text>
    </MobileScrollScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  hero: {
    marginBottom: spacing.lg,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: colors.accentMuted,
    textTransform: "uppercase",
  },
  heroTitle: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 34,
  },
  heroSub: {
    marginTop: 10,
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
  },
  errorBanner: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: "#fef2f2",
    color: colors.danger,
    fontSize: 14,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  sectionLink: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.accent,
  },
  sectionLoading: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyHint: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  productTile: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  productImageWrap: {
    width: "100%",
    backgroundColor: colors.border,
  },
  productImage: { width: "100%", height: "100%" },
  productImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f0eb",
  },
  placeholderGlyph: { fontSize: 28, color: colors.muted },
  productName: {
    marginTop: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    minHeight: 38,
  },
  productPrice: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    fontSize: 14,
    fontWeight: "700",
    color: colors.accentMuted,
  },
  designerList: {
    gap: spacing.sm,
  },
  designerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
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
  designerAvatarImg: { width: "100%", height: "100%" },
  designerAvatarGlyph: { fontSize: 22, color: colors.accent },
  designerText: { flex: 1, minWidth: 0 },
  designerName: { fontSize: 16, fontWeight: "700", color: colors.text },
  designerHeadline: { marginTop: 4, fontSize: 13, color: colors.muted, lineHeight: 18 },
  designerStats: { marginTop: 4, fontSize: 12, color: colors.accentMuted, fontWeight: "600" },
  designerChev: { fontSize: 22, color: colors.muted },
  customCard: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  customEmoji: { fontSize: 26, marginBottom: 6 },
  customTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  customDesc: { marginTop: 8, fontSize: 14, color: "rgba(255,255,255,0.88)", lineHeight: 20 },
  customCta: {
    marginTop: 14,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  customCtaText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  tagline: {
    textAlign: "center",
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 0.5,
  },
});

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { fetchProductsShop } from "../api/jewelryApi";
import { MobileSafeScreen } from "../components/MobileSafeScreen";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { mediaUrl } from "../config";
import type { ShopStackParamList } from "../navigation/types";
import type { Product } from "../types/models";
import { colors, spacing, touch } from "../theme";

type Props = NativeStackScreenProps<ShopStackParamList, "ProductList">;

export function ProductListScreen({ navigation }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const { token } = useAuth();
  const { addProduct } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  /** Slightly smaller thumb on narrow phones so title/price keep room */
  const thumbSize = windowWidth < 360 ? 96 : 108;
  const thumbBox = useMemo(() => ({ width: thumbSize, height: thumbSize }), [thumbSize]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await fetchProductsShop(token);
      setProducts(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load products");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && products.length === 0) {
    return (
      <MobileSafeScreen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </MobileSafeScreen>
    );
  }

  return (
    <MobileSafeScreen style={styles.container}>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={[styles.list, products.length === 0 && !error && styles.listEmpty]}
        ListEmptyComponent={
          !loading && !error ? (
            <Text style={styles.empty}>No products available yet. Pull to refresh.</Text>
          ) : null
        }
        renderItem={({ item }) => {
          const img = mediaUrl(item.productImage);
          const price = item.productPrice;
          const compare = item.compareAtPrice;
          return (
            <View style={styles.card}>
              <Pressable
                style={({ pressed }) => [styles.cardMain, pressed && styles.cardPressed]}
                onPress={() => navigation.navigate("ProductDetail", { productId: item._id })}
                hitSlop={touch.hitSlop}
                accessibilityRole="button"
                accessibilityLabel={`${item.productName}, view details`}
              >
                <View style={thumbBox}>
                  {img ? (
                    <Image source={{ uri: img }} style={thumbBox} contentFit="cover" />
                  ) : (
                    <View style={[thumbBox, styles.thumbPlaceholder]} />
                  )}
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.productName}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {item.productCategory}
                    {item.metalMaterial ? ` · ${item.metalMaterial}` : ""}
                  </Text>
                  <Text style={styles.stock}>{item.stockQuantity} in stock</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price} numberOfLines={1}>
                      LKR {price.toLocaleString()}
                    </Text>
                    {compare != null && compare > price ? (
                      <Text style={styles.compare} numberOfLines={1}>
                        LKR {compare.toLocaleString()}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.addDark,
                  { minHeight: touch.minHeight, justifyContent: "center" },
                  (!item.stockQuantity || pressed) && { opacity: 0.9 },
                ]}
                onPress={() => {
                  addProduct(item);
                }}
                disabled={!item.stockQuantity}
                hitSlop={touch.hitSlop}
                accessibilityRole="button"
                accessibilityLabel={item.stockQuantity ? `Add ${item.productName} to cart` : "Out of stock"}
              >
                <Text style={styles.addDarkText}>Add to cart</Text>
              </Pressable>
            </View>
          );
        }}
      />
    </MobileSafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  list: { padding: spacing.page, gap: spacing.sm, paddingBottom: spacing.xl },
  /** Lets empty list message sit vertically centered on small screens */
  listEmpty: { flexGrow: 1, justifyContent: "center" },
  empty: { textAlign: "center", color: colors.muted, paddingVertical: spacing.lg, lineHeight: 22 },
  error: { color: colors.danger, padding: spacing.page, textAlign: "center" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardMain: { flexDirection: "row", alignItems: "stretch" },
  cardPressed: { opacity: 0.92 },
  stock: { fontSize: 12, color: colors.muted, marginTop: 4 },
  addDark: {
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: colors.text,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addDarkText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  thumbPlaceholder: { backgroundColor: colors.border },
  cardBody: { flex: 1, minWidth: 0, padding: spacing.sm, justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "600", color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 4 },
  priceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  price: { fontSize: 16, fontWeight: "700", color: colors.accent, flexShrink: 1 },
  compare: {
    fontSize: 14,
    color: colors.muted,
    textDecorationLine: "line-through",
    flexShrink: 0,
  },
});

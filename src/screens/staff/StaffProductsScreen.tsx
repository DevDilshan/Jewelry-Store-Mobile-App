import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { staffDeleteProduct, staffFetchProducts, staffUpdateProduct } from "../../api/staffApi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import type { StaffStackParamList } from "../../navigation/types";
import type { Product } from "../../types/models";
import { colors, spacing, touch } from "../../theme";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffProducts">;

export function StaffProductsScreen({ navigation }: Props) {
  const { token } = useStaffAuth();
  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const list = await staffFetchProducts(token);
      setRows(list);
    } catch (e) {
      Alert.alert("Products", e instanceof Error ? e.message : "Could not load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  // ── Toggle active status directly from the list ──
  const toggleActive = async (product: Product) => {
    if (!token) return;
    const updatedStatus = !product.isActive;
    try {
      await staffUpdateProduct(token, product._id, { isActive: updatedStatus });
      setRows((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, isActive: updatedStatus } : p))
      );
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not update status");
    }
  };

  const onDelete = (p: Product) => {
    if (!token) return;
    Alert.alert("Delete product", `Remove ${p.productName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await staffDeleteProduct(token, p._id);
            await load();
          } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "Delete failed");
          }
        },
      },
    ]);
  };

  // ── Stats ──
  const totalProducts = rows.length;
  const activeProducts = rows.filter((p) => p.isActive).length;
  const outOfStock = rows.filter((p) => p.stockQuantity === 0).length;
  const lowStock = rows.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.reorderLevel).length;

  // ── Low stock alert items ──
  const alertItems = rows.filter(
    (p) => p.stockQuantity === 0 || (p.stockQuantity > 0 && p.stockQuantity <= p.reorderLevel)
  );

  const getStockBadgeStyle = (product: Product) => {
    if (product.stockQuantity === 0) return styles.badgeOut;
    if (product.stockQuantity <= product.reorderLevel) return styles.badgeLow;
    return styles.badgeIn;
  };

  const getStockBadgeText = (product: Product) => {
    if (product.stockQuantity === 0) return "Out of Stock";
    if (product.stockQuantity <= product.reorderLevel) return "Low Stock";
    return "In Stock";
  };

  return (
    <View style={styles.flex}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* ── Add Product Button ── */}
            <Pressable
              style={styles.add}
              onPress={() => navigation.navigate("StaffProductEditor", {})}
              hitSlop={touch.hitSlop}
            >
              <Text style={styles.addText}>+ Add product</Text>
            </Pressable>

            {/* ── Stat Cards ── */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.statTotal]}>
                <Text style={styles.statLabel}>TOTAL</Text>
                <Text style={styles.statValue}>{totalProducts}</Text>
                <Text style={styles.statSub}>in catalog</Text>
              </View>
              <View style={[styles.statCard, styles.statActive]}>
                <Text style={styles.statLabel}>ACTIVE</Text>
                <Text style={[styles.statValue, { color: "#38a169" }]}>{activeProducts}</Text>
                <Text style={styles.statSub}>visible in shop</Text>
              </View>
              <View style={[styles.statCard, styles.statOut]}>
                <Text style={styles.statLabel}>OUT OF STOCK</Text>
                <Text style={[styles.statValue, { color: colors.danger }]}>{outOfStock}</Text>
                <Text style={styles.statSub}>need restocking</Text>
              </View>
              <View style={[styles.statCard, styles.statLow]}>
                <Text style={styles.statLabel}>LOW STOCK</Text>
                <Text style={[styles.statValue, { color: "#d69e2e" }]}>{lowStock}</Text>
                <Text style={styles.statSub}>below reorder level</Text>
              </View>
            </View>

            {/* ── Low Stock Alerts ── */}
            {alertItems.length > 0 ? (
              <View style={styles.alertSection}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertTitle}>⚠️ Stock Alerts</Text>
                  <Text style={styles.alertCount}>
                    {alertItems.length} product{alertItems.length !== 1 ? "s" : ""} need attention
                  </Text>
                </View>
                {alertItems.map((item) => (
                  <View
                    key={item._id}
                    style={[
                      styles.alertItem,
                      item.stockQuantity === 0 ? styles.alertItemOut : styles.alertItemLow,
                    ]}
                  >
                    <View style={styles.alertInfo}>
                      <Text style={styles.alertName}>{item.productName}</Text>
                      <Text style={styles.alertCategory}>{item.productCategory}</Text>
                    </View>
                    <View style={styles.alertMeta}>
                      <Text style={styles.alertQty}>
                        Stock: <Text style={styles.alertBold}>{item.stockQuantity}</Text>
                      </Text>
                      <Text style={styles.alertReorder}>
                        Reorder: <Text style={styles.alertBold}>{item.reorderLevel}</Text>
                      </Text>
                      <View
                        style={[
                          styles.alertBadge,
                          item.stockQuantity === 0 ? styles.alertBadgeOut : styles.alertBadgeLow,
                        ]}
                      >
                        <Text
                          style={[
                            styles.alertBadgeText,
                            item.stockQuantity === 0
                              ? styles.alertBadgeTextOut
                              : styles.alertBadgeTextLow,
                          ]}
                        >
                          {item.stockQuantity === 0 ? "Out of Stock" : "Low Stock"}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {/* ── Section title for product list ── */}
            <Text style={styles.sectionTitle}>All Products</Text>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
          ) : (
            <Text style={styles.empty}>No products yet. Tap "+ Add product" to get started.</Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable
              onPress={() =>
                navigation.navigate("StaffProductEditor", {
                  product: {
                    _id: item._id,
                    productName: item.productName,
                    productDescription: item.productDescription,
                    productCategory: item.productCategory,
                    productPrice: item.productPrice,
                    stockQuantity: item.stockQuantity,
                    reorderLevel: item.reorderLevel,
                    isActive: item.isActive,
                    productImage: item.productImage,
                    metalMaterial: item.metalMaterial,
                    gemType: item.gemType,
                  },
                })
              }
              hitSlop={touch.hitSlop}
            >
              <Text style={styles.name}>{item.productName}</Text>
              <Text style={styles.meta}>
                LKR {item.productPrice.toLocaleString()} · {item.stockQuantity} in stock
              </Text>
              <View style={styles.badgeRow}>
                <View style={[styles.stockBadge, getStockBadgeStyle(item)]}>
                  <Text style={styles.stockBadgeText}>{getStockBadgeText(item)}</Text>
                </View>
              </View>
            </Pressable>

            {/* ── Active Toggle + Delete row ── */}
            <View style={styles.cardActions}>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>
                  {item.isActive ? "Active" : "Hidden"}
                </Text>
                <Switch
                  value={item.isActive}
                  onValueChange={() => toggleActive(item)}
                  trackColor={{ false: "#ccc", true: colors.accent }}
                  thumbColor="#fff"
                />
              </View>
              <Pressable style={styles.del} onPress={() => onDelete(item)} hitSlop={touch.hitSlop}>
                <Text style={styles.delText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.page, gap: spacing.sm, paddingBottom: spacing.xl },

  // ── Add button ──
  add: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    minHeight: touch.minHeight,
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  addText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  // ── Stat Cards ──
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: "46%",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statTotal: {},
  statActive: {},
  statOut: {},
  statLow: {},
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    marginTop: 4,
  },
  statSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },

  // ── Low Stock Alerts ──
  alertSection: {
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fbd38d",
    backgroundColor: "#fffff0",
    overflow: "hidden",
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fefcbf",
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#744210",
  },
  alertCount: {
    fontSize: 12,
    color: "#975a16",
  },
  alertItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#fbd38d",
  },
  alertItemOut: {},
  alertItemLow: {},
  alertInfo: { flex: 1, marginRight: 10 },
  alertName: { fontSize: 14, fontWeight: "600", color: colors.text },
  alertCategory: { fontSize: 12, color: colors.muted, marginTop: 2 },
  alertMeta: { alignItems: "flex-end" },
  alertQty: { fontSize: 12, color: colors.text },
  alertReorder: { fontSize: 12, color: colors.muted, marginTop: 2 },
  alertBold: { fontWeight: "700" },
  alertBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  alertBadgeOut: { backgroundColor: "#fed7d7" },
  alertBadgeLow: { backgroundColor: "#fefcbf" },
  alertBadgeText: { fontSize: 11, fontWeight: "700" },
  alertBadgeTextOut: { color: "#c53030" },
  alertBadgeTextLow: { color: "#975a16" },

  // ── Section title ──
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
    marginBottom: 4,
  },

  // ── Product Cards ──
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  meta: { marginTop: 6, fontSize: 14, color: colors.muted },
  badgeRow: { flexDirection: "row", marginTop: 8 },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeIn: { backgroundColor: "#c6f6d5" },
  badgeLow: { backgroundColor: "#fefcbf" },
  badgeOut: { backgroundColor: "#fed7d7" },
  stockBadgeText: { fontSize: 12, fontWeight: "700", color: colors.text },

  // ── Card actions row ──
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
  },
  del: {},
  delText: { color: colors.danger, fontWeight: "600" },

  empty: {
    textAlign: "center",
    color: colors.muted,
    paddingVertical: spacing.lg,
    lineHeight: 22,
  },
});

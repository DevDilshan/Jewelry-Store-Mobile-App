import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { staffDeleteProduct, staffFetchProducts } from "../../api/staffApi";
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

  return (
    <View style={styles.flex}>
      <Pressable
        style={styles.add}
        onPress={() => navigation.navigate("StaffProductEditor", {})}
        hitSlop={touch.hitSlop}
      >
        <Text style={styles.addText}>+ Add product</Text>
      </Pressable>
      {loading && rows.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={styles.list}
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
                  LKR {item.productPrice.toLocaleString()} · {item.stockQuantity} in stock ·{" "}
                  {item.isActive ? "Active" : "Hidden"}
                </Text>
              </Pressable>
              <Pressable style={styles.del} onPress={() => onDelete(item)} hitSlop={touch.hitSlop}>
                <Text style={styles.delText}>Delete</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  add: {
    margin: spacing.page,
    marginBottom: 0,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    minHeight: touch.minHeight,
    justifyContent: "center",
  },
  addText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  list: { padding: spacing.page, gap: spacing.sm, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  meta: { marginTop: 6, fontSize: 14, color: colors.muted },
  del: { marginTop: 10, alignSelf: "flex-start" },
  delText: { color: colors.danger, fontWeight: "600" },
});

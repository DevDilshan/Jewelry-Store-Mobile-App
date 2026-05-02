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
import { staffDeleteDiscount, staffFetchDiscounts, type StaffDiscount } from "../../api/staffApi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import type { StaffDiscountLike, StaffStackParamList } from "../../navigation/types";
import { colors, spacing, touch } from "../../theme";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffDiscounts">;

function toLike(d: StaffDiscount): StaffDiscountLike {
  return {
    _id: d._id,
    discountName: d.discountName,
    campaignTheme: d.campaignTheme,
    discountType: d.discountType,
    discountAmount: d.discountAmount,
    promoScope: d.promoScope,
    discountCoupon: d.discountCoupon,
    startDate: d.startDate,
    endDate: d.endDate,
    minSubtotal: d.minSubtotal,
    maxUses: d.maxUses,
  };
}

export function StaffDiscountsScreen({ navigation }: Props) {
  const { token } = useStaffAuth();
  const [rows, setRows] = useState<StaffDiscount[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const list = await staffFetchDiscounts(token);
      setRows(list);
    } catch (e) {
      Alert.alert("Discounts", e instanceof Error ? e.message : "Could not load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return navigation.addListener("focus", load);
  }, [navigation, load]);

  const onDelete = (d: StaffDiscount) => {
    if (!token) return;
    Alert.alert("Delete discount", d.discountName, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await staffDeleteDiscount(token, d._id);
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
        onPress={() => navigation.navigate("StaffDiscountEditor", {})}
        hitSlop={touch.hitSlop}
      >
        <Text style={styles.addText}>+ Add discount</Text>
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
                onPress={() => navigation.navigate("StaffDiscountEditor", { discount: toLike(item) })}
                hitSlop={touch.hitSlop}
              >
                <Text style={styles.name}>{item.discountName}</Text>
                <Text style={styles.meta}>
                  {item.promoScope === "site_wide" ? "Site-wide" : `Code ${item.discountCoupon}`} {" "}
                 
                  {item.discountType === "percentage" ? ` \n  Percentage - ${item.discountAmount}%` : `LKR ${item.discountAmount}`}
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

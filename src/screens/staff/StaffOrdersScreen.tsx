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
import { staffFetchOrders, staffOrderStats } from "../../api/staffApi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import type { StaffStackParamList } from "../../navigation/types";
import type { Order } from "../../types/models";
import { colors, spacing, touch } from "../../theme";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffOrders">;

export function StaffOrdersScreen({ navigation }: Props) {
  const { token } = useStaffAuth();
  const [rows, setRows] = useState<Order[]>([]);
  const [stats, setStats] = useState<{ totalOrders: number; totalRevenue: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [orders, s] = await Promise.all([staffFetchOrders(token), staffOrderStats(token)]);
      setRows(orders);
      setStats(s);
    } catch (e) {
      Alert.alert("Orders", e instanceof Error ? e.message : "Could not load");
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

  return (
    <View style={styles.flex}>
      {stats ? (
        <View style={styles.stats}>
          <Text style={styles.statN}>{stats.totalOrders}</Text>
          <Text style={styles.statL}>orders (excl. cancelled)</Text>
          <Text style={[styles.statN, { marginTop: 8 }]}>LKR {stats.totalRevenue.toLocaleString()}</Text>
          <Text style={styles.statL}>revenue</Text>
        </View>
      ) : null}
      {loading && rows.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate("StaffOrderDetail", { order: item })}
              hitSlop={touch.hitSlop}
            >
              <Text style={styles.name}>#{String(item._id).slice(-6)}</Text>
              <Text style={styles.meta}>
                {item.orderStatus} · LKR {item.totalAmount.toLocaleString()}
              </Text>
              <Text style={styles.date}>
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  stats: {
    margin: spacing.page,
    marginBottom: 0,
    padding: spacing.page,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statN: { fontSize: 22, fontWeight: "800", color: colors.text },
  statL: { fontSize: 14, color: colors.muted },
  list: { padding: spacing.page, gap: spacing.sm, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  meta: { marginTop: 6, fontSize: 15, color: colors.accentMuted, fontWeight: "600" },
  date: { marginTop: 4, fontSize: 13, color: colors.muted },
});

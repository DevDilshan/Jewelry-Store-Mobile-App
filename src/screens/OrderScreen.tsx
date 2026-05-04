import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fetchMyOrders } from "../api/jewelryApi";
import { MobileSafeScreen } from "../components/MobileSafeScreen";
import { useAuth } from "../context/AuthContext";
import type { AccountStackParamList } from "../navigation/types";
import type { Order } from "../types/models";
import { colors, spacing, touch } from "../theme";

type Props = NativeStackScreenProps<AccountStackParamList, "Orders">;

export function OrdersScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchMyOrders(token);
      setOrders(res.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (!token) {
    return (
      <MobileSafeScreen>
        <View style={styles.centered}>
          <Text style={styles.muted}>Sign in to see your orders.</Text>
        </View>
      </MobileSafeScreen>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <MobileSafeScreen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </MobileSafeScreen>
    );
  }

  return (
    <MobileSafeScreen style={{ flex: 1 }}>
    <FlatList
      data={orders}
      keyExtractor={(item) => item._id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.muted}>No orders yet.</Text>}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
          onPress={() => navigation.navigate("OrderDetail", { orderId: item._id })}
          hitSlop={touch.hitSlop}
        >
          <Text style={styles.id}>Order #{String(item._id).slice(-6)}</Text>
          <Text style={styles.status}>{item.orderStatus}</Text>
          <Text style={styles.total}>LKR {item.totalAmount.toLocaleString()}</Text>
          <Text style={styles.date}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</Text>
        </Pressable>
      )}
    />
    </MobileSafeScreen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.page, gap: spacing.sm, backgroundColor: colors.bg, flexGrow: 1, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  muted: { color: colors.muted, textAlign: "center", padding: 24 },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  id: { fontSize: 16, fontWeight: "700", color: colors.text },
  status: { marginTop: 4, fontSize: 14, color: colors.accentMuted, fontWeight: "600" },
  total: { marginTop: 8, fontSize: 18, fontWeight: "700", color: colors.text },
  date: { marginTop: 4, fontSize: 13, color: colors.muted },
});

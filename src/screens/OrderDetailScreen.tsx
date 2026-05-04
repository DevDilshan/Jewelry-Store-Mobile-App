import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MobileSafeScreen } from "../components/MobileSafeScreen";
import { cancelOrder, fetchOrder } from "../api/jewelryApi";
import { useAuth } from "../context/AuthContext";
import type { AccountStackParamList } from "../navigation/types";
import type { Order } from "../types/models";
import { colors, spacing, touch } from "../theme";

type Props = NativeStackScreenProps<AccountStackParamList, "OrderDetail">;

export function OrderDetailScreen({ route }: Props) {
  const { orderId } = route.params;
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchOrder(token, orderId);
      setOrder(res.data);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [token, orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const onCancel = () => {
    if (!token || !order) return;
    Alert.alert("Cancel order", "Cancel this pending order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, cancel",
        style: "destructive",
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelOrder(token, order._id);
            await load();
            Alert.alert("Cancelled", "Your order was cancelled.");
          } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "Could not cancel");
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  if (loading || !order) {
    return (
      <MobileSafeScreen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </MobileSafeScreen>
    );
  }

  const canCancel = order.orderStatus === "Pending";

  return (
    <MobileSafeScreen>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.status}>{order.orderStatus}</Text>
      <Text style={styles.total}>LKR {order.totalAmount.toLocaleString()}</Text>
      <Text style={styles.meta}>Payment: {order.paymentStatus || "—"}</Text>
      {order.discountCode ? (
        <Text style={styles.meta}>Coupon: {order.discountCode}</Text>
      ) : null}

      <Text style={styles.section}>Items</Text>
      {order.items.map((line, idx) => (
        <View key={idx} style={styles.line}>
          <Text style={styles.lineName}>{line.product?.productName || "Product"}</Text>
          <Text style={styles.lineMeta}>
            {line.quantity} × LKR {line.price.toLocaleString()}
          </Text>
        </View>
      ))}

      {canCancel ? (
        <Pressable
          style={[styles.danger, cancelling && { opacity: 0.75 }]}
          onPress={onCancel}
          disabled={cancelling}
          hitSlop={touch.hitSlop}
        >
          <Text style={styles.dangerText}>{cancelling ? "Cancelling…" : "Cancel order"}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
    </MobileSafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.page, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  status: { fontSize: 14, fontWeight: "700", color: colors.accentMuted, textTransform: "uppercase" },
  total: { fontSize: 28, fontWeight: "700", color: colors.text, marginTop: 8 },
  meta: { marginTop: 8, fontSize: 14, color: colors.muted },
  section: { marginTop: 24, fontSize: 18, fontWeight: "700", color: colors.text },
  line: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lineName: { fontSize: 16, fontWeight: "600" },
  lineMeta: { marginTop: 4, fontSize: 14, color: colors.muted },
  danger: {
    marginTop: 28,
    paddingVertical: 16,
    minHeight: touch.minHeight,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.danger,
  },
  dangerText: { color: colors.danger, fontWeight: "700" },
});

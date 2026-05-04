import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { staffUpdateOrder } from "../../api/staffApi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import type { StaffStackParamList } from "../../navigation/types";
import type { Order } from "../../types/models";
import { colors, spacing, touch } from "../../theme";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffOrderDetail">;

const STATUSES = ["Pending", "Processing", "Ready", "Cancelled"] as const;
const PAYMENTS = ["Pending", "Paid", "Failed"] as const;

type PopulatedOrder = Order & {
  customer?: { firstName?: string; lastName?: string; email?: string };
};

export function StaffOrderDetailScreen({ navigation, route }: Props) {
  const { token } = useStaffAuth();
  const { order: initial } = route.params;
  const o = initial as PopulatedOrder;
  const [orderStatus, setOrderStatus] = useState(o.orderStatus);
  const [paymentStatus, setPaymentStatus] = useState(o.paymentStatus ?? "Pending");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!token) return;
    setBusy(true);
    try {
      await staffUpdateOrder(token, o._id, { orderStatus, paymentStatus });
      navigation.goBack();
    } catch (e) {
      Alert.alert("Order", e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const cust = o.customer;
  const custLine = cust
    ? `${[cust.firstName, cust.lastName].filter(Boolean).join(" ")} · ${cust.email ?? ""}`
    : "—";

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Order</Text>
      <Text style={styles.mono} selectable>
        #{o._id}
      </Text>
      <Text style={styles.label}>Customer</Text>
      <Text style={styles.body}>{custLine}</Text>
      <Text style={styles.label}>Totals</Text>
      <Text style={styles.body}>
        Subtotal LKR {o.subtotal?.toLocaleString?.() ?? o.subtotal} · Total LKR {o.totalAmount.toLocaleString()}
        {o.discountCode ? ` · Code ${o.discountCode}` : ""}
      </Text>
      <Text style={styles.label}>Items</Text>
      {(o.items || []).map((line, i) => {
        const pname =
          typeof line.product === "object" && line.product && "productName" in line.product
            ? line.product.productName
            : "Product";
        return (
          <Text key={i} style={styles.lineItem}>
            {pname} × {line.quantity} @ LKR {line.price}
          </Text>
        );
      })}
      <Text style={styles.label}>Order status</Text>
      <View style={styles.chips}>
        {STATUSES.map((s) => (
          <Pressable key={s} style={[styles.chip, orderStatus === s && styles.chipOn]} onPress={() => setOrderStatus(s)}>
            <Text style={[styles.chipText, orderStatus === s && styles.chipTextOn]}>{s}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Payment status</Text>
      <View style={styles.chips}>
        {PAYMENTS.map((s) => (
          <Pressable key={s} style={[styles.chip, paymentStatus === s && styles.chipOn]} onPress={() => setPaymentStatus(s)}>
            <Text style={[styles.chipText, paymentStatus === s && styles.chipTextOn]}>{s}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={[styles.cta, busy && { opacity: 0.75 }]} onPress={save} disabled={busy}>
        <Text style={styles.ctaText}>{busy ? "Saving…" : "Save changes"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.page, paddingBottom: spacing.xl },
  label: { fontSize: 13, fontWeight: "600", color: colors.muted, marginTop: 14, marginBottom: 4 },
  mono: { fontSize: 13, color: colors.text },
  body: { fontSize: 16, color: colors.text, lineHeight: 22 },
  lineItem: { fontSize: 15, color: colors.text, marginBottom: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { borderColor: colors.accent, backgroundColor: colors.bg },
  chipText: { fontSize: 14, color: colors.text },
  chipTextOn: { fontWeight: "700", color: colors.accent },
  cta: {
    marginTop: 28,
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    minHeight: touch.minHeight,
    justifyContent: "center",
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

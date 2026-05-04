import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { placeOrder, validateCoupon } from "../api/jewelryApi";
import { MobileSafeScreen, MobileScrollScreen } from "../components/MobileSafeScreen";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { colors, spacing, touch } from "../theme";

export function CheckoutScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const { selectedLines, totals, clear, promo, setPromo, clearPromo } = useCart();
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <MobileSafeScreen>
        <View style={styles.centered}>
          <Text style={styles.msg}>Please sign in from the Account tab to place an order.</Text>
        </View>
      </MobileSafeScreen>
    );
  }

  const checkCoupon = async () => {
    const code = coupon.trim();
    if (!code) {
      clearPromo();
      setCouponMsg(null);
      return;
    }
    try {
      const res = await validateCoupon(code, totals.baseSubtotal, totals.siteWideSavings);
      if (res.valid) {
        setPromo({
          valid: true,
          discountAmount: res.discountAmount,
          code: res.code,
          message: res.message,
        });
        setCouponMsg(res.message || "Promo applied.");
      } else {
        clearPromo();
        setCouponMsg(res.message || "Invalid code");
      }
    } catch (e) {
      clearPromo();
      setCouponMsg(e instanceof Error ? e.message : "Validation failed");
    }
  };

  const submit = async () => {
    if (selectedLines.length === 0) {
      Alert.alert(
        "Cart",
        "No items selected. Turn on the switch next to items in the cart, or add products first."
      );
      return;
    }
    setSubmitting(true);
    try {
      const items = selectedLines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
      }));
      const discountCoupon = promo?.valid && promo.code ? promo.code : undefined;
      const res = await placeOrder(token, items, discountCoupon);
      clear();
      setCoupon("");
      clearPromo();
      setCouponMsg(null);
      Alert.alert("Order placed", res.message || "Thank you!", [
        {
          text: "View orders",
          onPress: () => {
            const parent = navigation.getParent();
            if (parent) {
              (parent as { navigate: (a: string, b?: object) => void }).navigate("Account", {
                screen: "Orders",
              });
            }
          },
        },
        { text: "OK" },
      ]);
    } catch (e) {
      Alert.alert("Order failed", e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileScrollScreen keyboard contentContainerStyle={styles.body}>
      <Text style={styles.label}>Order summary</Text>
      <Text style={styles.line}>
        List subtotal (for promos): LKR {totals.baseSubtotal.toLocaleString()}
      </Text>
      <Text style={styles.line}>You pay (estimate): LKR {totals.estimatedTotal.toLocaleString()}</Text>
      {totals.siteWideSavings > 0 ? (
        <Text style={styles.hint}>Site-wide savings in cart: LKR {totals.siteWideSavings.toLocaleString()}</Text>
      ) : null}

      <Text style={[styles.label, { marginTop: 24 }]}>Promo code (optional)</Text>
      <View style={styles.couponRow}>
        <TextInput
          style={styles.input}
          placeholder="CODE"
          autoCapitalize="characters"
          value={coupon}
          onChangeText={(t) => {
            setCoupon(t);
            clearPromo();
            setCouponMsg(null);
          }}
        />
        <Pressable style={styles.secondary} onPress={checkCoupon} hitSlop={touch.hitSlop}>
          <Text style={styles.secondaryText}>Check</Text>
        </Pressable>
      </View>
      {couponMsg ? <Text style={styles.couponMsg}>{couponMsg}</Text> : null}

      <Text style={styles.note}>
        Pay when you pick up at the boutique — same as the web shop.
      </Text>

      <Pressable
        style={[styles.cta, submitting && { opacity: 0.75 }]}
        onPress={submit}
        disabled={submitting}
        hitSlop={touch.hitSlop}
      >
        <Text style={styles.ctaText}>{submitting ? "Placing order…" : "Place order"}</Text>
      </Pressable>
    </MobileScrollScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: spacing.sm },
  centered: { flex: 1, justifyContent: "center", padding: spacing.lg, backgroundColor: colors.bg },
  msg: { fontSize: 16, color: colors.text, textAlign: "center", lineHeight: 24 },
  label: { fontSize: 14, color: colors.muted, fontWeight: "600" },
  line: { marginTop: 6, fontSize: 15, color: colors.text },
  hint: { marginTop: 8, fontSize: 14, color: colors.accentMuted },
  couponRow: { flexDirection: "row", gap: spacing.sm, marginTop: 8, alignItems: "stretch" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    backgroundColor: colors.surface,
    fontSize: 16,
    minHeight: touch.minHeight,
  },
  secondary: {
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    minHeight: touch.minHeight,
  },
  secondaryText: { color: colors.accent, fontWeight: "700" },
  couponMsg: { marginTop: 8, fontSize: 14, color: colors.muted },
  note: { marginTop: 24, fontSize: 14, color: colors.muted, lineHeight: 20 },
  cta: {
    marginTop: 24,
    backgroundColor: colors.accent,
    paddingVertical: 16,
    minHeight: touch.minHeight,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

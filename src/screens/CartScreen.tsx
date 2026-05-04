import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { MobileSafeScreen } from "../components/MobileSafeScreen";
import { mediaUrl } from "../config";
import { useCart } from "../context/CartContext";
import type { CartStackParamList } from "../navigation/types";
import { colors, spacing, touch } from "../theme";

type Props = NativeStackScreenProps<CartStackParamList, "CartMain">;

export function CartScreen({ navigation }: Props) {
  const { lines, setQuantity, removeLine, toggleLineSelected, totals, hydrated } = useCart();

  if (!hydrated) {
    return (
      <MobileSafeScreen>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Loading cart…</Text>
        </View>
      </MobileSafeScreen>
    );
  }

  if (lines.length === 0) {
    return (
      <MobileSafeScreen>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Your cart is empty.</Text>
          <Text style={styles.hint}>Open the Shop tab to browse pieces.</Text>
        </View>
      </MobileSafeScreen>
    );
  }

  return (
    <MobileSafeScreen style={styles.container}>
      <ScrollView style={styles.scroll}>
        {lines.map((line) => {
          const p = line.product;
          const img = mediaUrl(p.productImage);
          const included = line.selected !== false;
          return (
            <View key={line.productId} style={[styles.row, !included && styles.rowDim]}>
              <Switch
                value={included}
                onValueChange={() => toggleLineSelected(line.productId)}
                trackColor={{ false: colors.border, true: colors.accentMuted }}
              />
              <View style={styles.thumbBox}>
                {img ? <Image source={{ uri: img }} style={styles.thumb} contentFit="cover" /> : <View style={[styles.thumb, styles.thumbPh]} />}
              </View>
              <View style={styles.body}>
                <Text style={styles.title} numberOfLines={2}>
                  {p.productName}
                </Text>
                <Text style={styles.price}>
                  LKR {Number(p.productPrice).toLocaleString()} × {line.quantity}
                </Text>
                <View style={styles.actions}>
                  <Pressable
                    style={styles.mini}
                    onPress={() => setQuantity(line.productId, line.quantity - 1)}
                    hitSlop={touch.hitSlop}
                  >
                    <Text style={styles.miniText}>−</Text>
                  </Pressable>
                  <Text style={styles.qty}>{line.quantity}</Text>
                  <Pressable
                    style={styles.mini}
                    onPress={() => setQuantity(line.productId, line.quantity + 1)}
                    hitSlop={touch.hitSlop}
                  >
                    <Text style={styles.miniText}>+</Text>
                  </Pressable>
                  <Pressable style={styles.remove} onPress={() => removeLine(line.productId)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <Text style={styles.totalLabel}>Estimated total</Text>
        <Text style={styles.total}>LKR {totals.estimatedTotal.toLocaleString()}</Text>
        <Text style={styles.footerHint}>Toggle items off to exclude them from checkout.</Text>
        <Pressable style={styles.cta} onPress={() => navigation.navigate("Checkout")} hitSlop={touch.hitSlop}>
          <Text style={styles.ctaText}>Checkout</Text>
        </Pressable>
      </View>
    </MobileSafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: colors.bg },
  emptyText: { fontSize: 18, fontWeight: "600", color: colors.text },
  hint: { marginTop: 8, color: colors.muted, textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  rowDim: { opacity: 0.55 },
  thumbBox: { width: 72, height: 72, borderRadius: 8, overflow: "hidden" },
  thumb: { width: "100%", height: "100%" },
  thumbPh: { backgroundColor: colors.border },
  body: { flex: 1, marginLeft: 4 },
  title: { fontSize: 16, fontWeight: "600", color: colors.text },
  price: { marginTop: 6, fontSize: 14, color: colors.muted },
  actions: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 },
  mini: {
    minWidth: touch.minWidth,
    minHeight: touch.minHeight,
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  miniText: { fontSize: 18, color: colors.accent, fontWeight: "600" },
  qty: { fontSize: 16, fontWeight: "600", minWidth: 24, textAlign: "center" },
  remove: { marginLeft: "auto" },
  removeText: { color: colors.danger, fontWeight: "600" },
  footer: {
    padding: spacing.page,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: 14, color: colors.muted },
  total: { fontSize: 22, fontWeight: "700", color: colors.text, marginTop: 4 },
  footerHint: { fontSize: 12, color: colors.muted, marginTop: 8 },
  cta: {
    marginTop: 16,
    backgroundColor: colors.accent,
    paddingVertical: 16,
    minHeight: touch.minHeight,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

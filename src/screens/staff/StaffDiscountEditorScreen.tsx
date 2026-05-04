import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { staffCreateDiscount, staffUpdateDiscount } from "../../api/staffApi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import type { StaffStackParamList } from "../../navigation/types";
import { colors, spacing, touch } from "../../theme";
import DateTimePicker from "@react-native-community/datetimepicker";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffDiscountEditor">;

export function StaffDiscountEditorScreen({ navigation, route }: Props) {
  const { token } = useStaffAuth();
  const d = route.params?.discount;
  const editing = Boolean(d?._id);

  const [name, setName] = useState(d?.discountName ?? "");
  const [theme, setTheme] = useState(d?.campaignTheme ?? "None");
  const [scope, setScope] = useState<"coupon" | "site_wide">(d?.promoScope ?? "coupon");
  const [dtype, setDtype] = useState<"percentage" | "fixed">(d?.discountType ?? "percentage");
  const [amount, setAmount] = useState(d ? String(d.discountAmount) : "10");
  const [code, setCode] = useState(d?.discountCoupon ?? "");
  const [start, setStart] = useState(d?.startDate ? d.startDate.slice(0, 10) : "");
  const [end, setEnd] = useState(d?.endDate ? d.endDate.slice(0, 10) : "");
  const [minSub, setMinSub] = useState(d?.minSubtotal != null ? String(d.minSubtotal) : "");
  const [maxUses, setMaxUses] = useState(d?.maxUses != null ? String(d.maxUses) : "");
  const [busy, setBusy] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const save = async () => {
    if (!token) return;
    const amt = parseFloat(amount);
    if (!name.trim()) {
      Alert.alert("Discount", "Name is required.");
      return;
    }
    if (!amount.trim() || Number.isNaN(amt)) {
  Alert.alert("Discount", "Amount is required.");
  return;
  }
   if (amt < 0) {
  Alert.alert("Discount", "Amount cannot be negative.");
  return;
  }
   if (dtype === "percentage" && amt > 100) {
  Alert.alert("Discount", "Percentage cannot exceed 100.");
  return;
   }
    if (scope === "coupon" && !editing && !code.trim()) {
      Alert.alert("Discount", "Promo code is required for coupon discounts.");
      return;
    }
    if (scope === "coupon" && !editing && !code.trim()) {
      Alert.alert("Discount", "Promo code is required for coupon discounts.");
      return;
    }

    const body: Record<string, unknown> = {
      discountName: name.trim(),
      campaignTheme: theme.trim() || "None",
      promoScope: scope,
      discountType: dtype,
      discountAmount: amt,
    };
    if (scope === "coupon") {
      body.discountCoupon = code.trim().toUpperCase();
      if (minSub.trim()) body.minSubtotalLkr = parseFloat(minSub);
      if (maxUses.trim()) body.maxUses = parseInt(maxUses, 10);
    }
    if (start.trim()) body.startDate = new Date(start.trim()).toISOString();
    if (end.trim()) body.endDate = new Date(end.trim()).toISOString();

    setBusy(true);
    try {
      if (editing && d) {
        await staffUpdateDiscount(token, d._id, body);
      } else {
        await staffCreateDiscount(token, body);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert("Discount", e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Campaign name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text style={styles.label}>Theme (optional)</Text>
      <TextInput style={styles.input} value={theme} onChangeText={setTheme} />
      <Text style={styles.label}>Scope</Text>
      <View style={styles.chips}>
        {(["coupon", "site_wide"] as const).map((s) => (
          <Pressable key={s} style={[styles.chip, scope === s && styles.chipOn]} onPress={() => setScope(s)}>
            <Text style={[styles.chipText, scope === s && styles.chipTextOn]}>{s === "coupon" ? "Coupon" : "Site-wide"}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Type</Text>
      <View style={styles.chips}>
        {(["percentage", "fixed"] as const).map((t) => (
          <Pressable key={t} style={[styles.chip, dtype === t && styles.chipOn]} onPress={() => setDtype(t)}>
            <Text style={[styles.chipText, dtype === t && styles.chipTextOn]}>{t === "percentage" ? "%" : "Fixed LKR"}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>{dtype === "percentage" ? "Percent off" : "Amount (LKR)"}</Text>
      <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      {scope === "coupon" ? (
        <>
          <Text style={styles.label}>Promo code</Text>
          <TextInput
            style={[styles.input, editing && { opacity: 0.6 }]}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            editable={!editing}
          />
          {editing ? <Text style={styles.hint}>Code cannot be changed after creation.</Text> : null}
          <Text style={styles.label}>Min subtotal LKR (optional)</Text>
          <TextInput style={styles.input} value={minSub} onChangeText={setMinSub} keyboardType="decimal-pad" />
          <Text style={styles.label}>Max uses (optional)</Text>
          <TextInput style={styles.input} value={maxUses} onChangeText={setMaxUses} keyboardType="number-pad" />
        </>
      ) : (
        <Text style={styles.hint}>Site-wide promos get an auto-generated internal code on create.</Text>
      )}
       <Text style={styles.label}>Start date</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TextInput style={[styles.input, { flex: 1 }]} value={start} onChangeText={setStart} placeholder="YYYY-MM-DD" />
        <Pressable onPress={() => setShowStartPicker(true)}>
          <Text style={{ fontSize: 22 }}>📅</Text>
        </Pressable>
        </View>
      {showStartPicker && (
        <DateTimePicker
          value={start ? new Date(start) : new Date()}
          mode="date"
          display="default"
          onChange={(_, date) => {
            setShowStartPicker(false);
            if (date) setStart(date.toISOString().slice(0, 10));
          }}
        />
      )}

    <Text style={styles.label}>End date</Text>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <TextInput style={[styles.input, { flex: 1 }]} value={end} onChangeText={setEnd} placeholder="YYYY-MM-DD" />
      <Pressable onPress={() => setShowEndPicker(true)}>
        <Text style={{ fontSize: 22 }}>📅</Text>
      </Pressable>
    </View>
    {showEndPicker && (
      <DateTimePicker
        value={end ? new Date(end) : new Date()}
        mode="date"
        display="default"
        onChange={(_, date) => {
          setShowEndPicker(false);
          if (date) setEnd(date.toISOString().slice(0, 10));
        }}
      />
    )}
    
      <Pressable style={[styles.cta, busy && { opacity: 0.75 }]} onPress={save} disabled={busy}>
        <Text style={styles.ctaText}>{busy ? "Saving…" : editing ? "Save" : "Create"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.page, paddingBottom: spacing.xl },
  label: { fontSize: 14, fontWeight: "600", color: colors.muted, marginBottom: 6, marginTop: 12 },
  hint: { fontSize: 13, color: colors.muted, marginTop: 6, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    backgroundColor: colors.surface,
    fontSize: 16,
    minHeight: touch.minHeight,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
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

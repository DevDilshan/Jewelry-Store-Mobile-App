import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { staffCreateProduct, staffUpdateProduct } from "../../api/staffApi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import type { StaffStackParamList } from "../../navigation/types";
import { colors, spacing, touch } from "../../theme";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffProductEditor">;

const METALS = ["gold", "silver", "platinum", "white gold", "rose gold"] as const;
const GEMS = ["diamond", "pearl", "ruby", "emerald", "sapphire", "none"] as const;

export function StaffProductEditorScreen({ navigation, route }: Props) {
  const { token } = useStaffAuth();
  const p = route.params?.product;
  const editing = Boolean(p?._id);

  const [name, setName] = useState(p?.productName ?? "");
  const [category, setCategory] = useState(p?.productCategory ?? "Ring");
  const [description, setDescription] = useState(p?.productDescription ?? "");
  const [price, setPrice] = useState(p ? String(p.productPrice) : "");
  const [stock, setStock] = useState(p ? String(p.stockQuantity) : "0");
  const [active, setActive] = useState(p?.isActive ?? true);
  const [image, setImage] = useState(p?.productImage ?? "");
  const [metal, setMetal] = useState(p?.metalMaterial ?? "gold");
  const [gem, setGem] = useState(p?.gemType ?? "none");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!token) return;
    const priceN = parseFloat(price);
    const stockN = parseInt(stock, 10);
    if (!name.trim()) {
      Alert.alert("Product", "Name is required.");
      return;
    }
    if (!category.trim()) {
      Alert.alert("Product", "Category is required.");
      return;
    }
    if (Number.isNaN(priceN) || priceN < 0) {
      Alert.alert("Product", "Valid price is required.");
      return;
    }
    if (Number.isNaN(stockN) || stockN < 0) {
      Alert.alert("Product", "Valid stock quantity is required.");
      return;
    }

    const body: Record<string, unknown> = {
      productName: name.trim(),
      productCategory: category.trim(),
      productDescription: description.trim() || undefined,
      productPrice: priceN,
      stockQuantity: stockN,
      isActive: active,
      productImage: image.trim() || undefined,
      metalMaterial: metal,
      gemType: gem,
    };

    setBusy(true);
    try {
      if (editing && p) {
        await staffUpdateProduct(token, p._id, body);
      } else {
        await staffCreateProduct(token, body);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert("Product", e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Product name" />
      <Text style={styles.label}>Category</Text>
      <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="e.g. Ring, Necklace" />
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.tall]}
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="Optional"
      />
      <Text style={styles.label}>Price (LKR)</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
      <Text style={styles.label}>Stock</Text>
      <TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="number-pad" />
      <Text style={styles.label}>Image path / URL</Text>
      <TextInput style={styles.input} value={image} onChangeText={setImage} placeholder="uploads/…" autoCapitalize="none" />
      <Text style={styles.label}>Metal</Text>
      <View style={styles.chips}>
        {METALS.map((m) => (
          <Pressable
            key={m}
            style={[styles.chip, metal === m && styles.chipOn]}
            onPress={() => setMetal(m)}
          >
            <Text style={[styles.chipText, metal === m && styles.chipTextOn]}>{m}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Gem</Text>
      <View style={styles.chips}>
        {GEMS.map((g) => (
          <Pressable key={g} style={[styles.chip, gem === g && styles.chipOn]} onPress={() => setGem(g)}>
            <Text style={[styles.chipText, gem === g && styles.chipTextOn]}>{g}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Active in shop</Text>
        <Switch value={active} onValueChange={setActive} trackColor={{ true: colors.accent }} />
      </View>
      <Pressable style={[styles.cta, busy && { opacity: 0.75 }]} onPress={save} disabled={busy}>
        <Text style={styles.ctaText}>{busy ? "Saving…" : editing ? "Save changes" : "Create product"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.page, paddingBottom: spacing.xl },
  label: { fontSize: 14, fontWeight: "600", color: colors.muted, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    backgroundColor: colors.surface,
    fontSize: 16,
    minHeight: touch.minHeight,
  },
  tall: { minHeight: 100, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { borderColor: colors.accent, backgroundColor: colors.bg },
  chipText: { fontSize: 14, color: colors.text },
  chipTextOn: { fontWeight: "700", color: colors.accent },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
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

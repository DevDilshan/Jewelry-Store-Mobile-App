import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { staffCreateProduct, staffUpdateProduct } from "../../api/staffApi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import type { StaffStackParamList } from "../../navigation/types";
import { colors, spacing, touch } from "../../theme";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffProductEditor">;

const CATEGORIES = ["Rings", "Necklace", "Earring", "Bracelet", "Brooch", "Pendant"] as const;
const METALS = ["gold", "silver", "platinum", "rose gold"] as const;
const GEMS = ["diamond", "pearl", "ruby", "emerald", "sapphire", "none"] as const;

export function StaffProductEditorScreen({ navigation, route }: Props) {
  const { token } = useStaffAuth();
  const p = route.params?.product;
  const editing = Boolean(p?._id);

  const [name, setName] = useState(p?.productName ?? "");
  const [category, setCategory] = useState(p?.productCategory ?? "");
  const [description, setDescription] = useState(p?.productDescription ?? "");
  const [price, setPrice] = useState(p ? String(p.productPrice) : "");
  const [stock, setStock] = useState(p ? String(p.stockQuantity) : "0");
  const [reorderLevel, setReorderLevel] = useState(p ? String(p.reorderLevel ?? "") : "");
  const [active, setActive] = useState(p?.isActive ?? true);
  const [image, setImage] = useState(p?.productImage ?? "");
  const [metal, setMetal] = useState(p?.metalMaterial ?? "gold");
  const [gem, setGem] = useState(p?.gemType ?? "none");
  const [busy, setBusy] = useState(false);

  /** Pick an image from the phone gallery and convert to base64 data URL */
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library to upload images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        const mimeType = asset.mimeType || "image/jpeg";
        const dataUrl = `data:${mimeType};base64,${asset.base64}`;
        setImage(dataUrl);
      }
    }
  };

  const save = async () => {
    if (!token) return;
    const priceN = parseFloat(price);
    const stockN = parseInt(stock, 10);
    const reorderN = parseInt(reorderLevel, 10);

    if (!name.trim()) {
      Alert.alert("Product", "Name is required.");
      return;
    }
    if (!category) {
      Alert.alert("Product", "Please select a category.");
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
    if (Number.isNaN(reorderN) || reorderN <= 0) {
      Alert.alert("Product", "Reorder level must be greater than 0.");
      return;
    }

    // ── Stock / Active auto-toggle logic (matches web app) ──
    let finalActive: boolean;
    if (stockN === 0) {
      finalActive = false;
    } else if (editing && p && p.stockQuantity === 0) {
      finalActive = true;
    } else {
      finalActive = active;
    }

    const body: Record<string, unknown> = {
      productName: name.trim(),
      productCategory: category,
      productDescription: description.trim() || undefined,
      productPrice: priceN,
      stockQuantity: stockN,
      reorderLevel: reorderN,
      isActive: finalActive,
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

  // Show a hint when stock/active auto-toggle will apply
  const stockN = parseInt(stock, 10);
  const autoToggleHint = !Number.isNaN(stockN)
    ? stockN === 0 && active
      ? "Stock is 0 — product will be set to Hidden automatically."
      : editing && p && p.stockQuantity === 0 && stockN > 0 && !active
        ? "Stock restored — product will be set to Active automatically."
        : null
    : null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Product name" />

      {/* ── Category Dropdown ── */}
      <Text style={styles.label}>Category</Text>
      {!category ? (
        <Text style={styles.dropdownHint}>Select a category</Text>
      ) : null}
      <View style={styles.chips}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c}
            style={[styles.categoryChip, category === c && styles.categoryChipOn]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.categoryChipText, category === c && styles.categoryChipTextOn]}>{c}</Text>
          </Pressable>
        ))}
      </View>

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

      <Text style={styles.label}>Reorder Level</Text>
      <TextInput
        style={styles.input}
        value={reorderLevel}
        onChangeText={setReorderLevel}
        keyboardType="number-pad"
        placeholder="e.g. 5"
      />

      {/* ── Image Picker ── */}
      <Text style={styles.label}>Product Image</Text>
      <Pressable style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.imagePreview} contentFit="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderIcon}>+</Text>
            <Text style={styles.imagePlaceholderText}>Tap to upload image</Text>
          </View>
        )}
      </Pressable>
      {image ? (
        <Pressable onPress={() => setImage("")} style={styles.removeImage}>
          <Text style={styles.removeImageText}>Remove image</Text>
        </Pressable>
      ) : null}

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

      {autoToggleHint ? (
        <Text style={styles.hint}>{autoToggleHint}</Text>
      ) : null}

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
  dropdownHint: {
    fontSize: 13,
    color: colors.muted,
    fontStyle: "italic",
    marginBottom: 6,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryChipOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  categoryChipText: { fontSize: 14, color: colors.text },
  categoryChipTextOn: { fontWeight: "700", color: "#fff" },
  imagePicker: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    overflow: "hidden",
    minHeight: 180,
  },
  imagePreview: {
    width: "100%",
    height: 220,
  },
  imagePlaceholder: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderIcon: {
    fontSize: 36,
    color: colors.muted,
    fontWeight: "300",
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 6,
  },
  removeImage: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  removeImageText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "600",
  },
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
  hint: {
    fontSize: 13,
    color: colors.accent,
    fontStyle: "italic",
    marginTop: 6,
    paddingHorizontal: 4,
  },
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

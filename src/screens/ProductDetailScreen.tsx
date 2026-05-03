import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from "react-native";
import { MobileSafeScreen } from "../components/MobileSafeScreen";
import { createProductReview, fetchProductBundle } from "../api/jewelryApi";
import { mediaUrl } from "../config";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useShopDetailReturnToHome } from "../navigation/useShopDetailReturnToHome";
import type { ShopStackParamList } from "../navigation/types";
import type { ProductPageBundle, ReviewItem } from "../types/models";
import { colors, spacing, touch } from "../theme";

type Props = NativeStackScreenProps<ShopStackParamList, "ProductDetail">;

export function ProductDetailScreen({ route, navigation }: Props) {
  const { productId, fromHome } = route.params;
  useShopDetailReturnToHome(navigation, fromHome);
  const { token, user } = useAuth();
  const { addProduct } = useCart();
  const [bundle, setBundle] = useState<ProductPageBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviewText, setReviewText] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewRating, setReviewRating] = useState("5");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const b = await fetchProductBundle(productId, token);
      setBundle(b);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not load product");
    } finally {
      setLoading(false);
    }
  }, [productId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const submitReview = async () => {
    if (!token) {
      Alert.alert("Sign in required", "Please sign in to leave a review.");
      return;
    }
    const r = parseInt(reviewRating, 10);
    if (!reviewText.trim() || Number.isNaN(r) || r < 1 || r > 5) {
      Alert.alert("Review", "Enter a rating (1–5) and review text.");
      return;
    }
    setSubmitting(true);
    try {
      await createProductReview(token, {
        productId,
        rating: r,
        title: reviewTitle.trim() || undefined,
        text: reviewText.trim(),
      });
      setReviewText("");
      setReviewTitle("");
      await load();
      Alert.alert("Thank you", "Your review was posted.");
    } catch (e) {
      Alert.alert("Could not post review", e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !bundle) {
    return (
      <MobileSafeScreen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </MobileSafeScreen>
    );
  }

  const { product, reviews, mine } = bundle;
  const img = mediaUrl(product.productImage);
  const maxQty = Math.max(1, product.stockQuantity);
  const canReview = !!token && !mine.productReview && !mine.orderFeedback;

  return (
    <MobileSafeScreen keyboard>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
      <View style={styles.hero}>
        {img ? (
          <Image source={{ uri: img }} style={styles.heroImg} contentFit="contain" />
        ) : (
          <View style={[styles.heroImg, styles.heroPlaceholder]} />
        )}
      </View>
      <Text style={styles.name}>{product.productName}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>LKR {product.productPrice.toLocaleString()}</Text>
        {product.compareAtPrice != null && product.compareAtPrice > product.productPrice ? (
          <Text style={styles.compare}>LKR {product.compareAtPrice.toLocaleString()}</Text>
        ) : null}
      </View>
      <Text style={styles.desc}>{product.productDescription || "No description."}</Text>
      <Text style={styles.meta}>
        {product.productCategory}
        {product.metalMaterial ? ` · ${product.metalMaterial}` : ""}
        {product.gemType && product.gemType !== "none" ? ` · ${product.gemType}` : ""}
      </Text>

      <View style={styles.row}>
        <Text style={styles.label}>Quantity</Text>
        <View style={styles.qtyRow}>
          <Pressable
            style={styles.qtyBtn}
            onPress={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </Pressable>
          <Text style={styles.qtyVal}>{Math.min(qty, maxQty)}</Text>
          <Pressable
            style={styles.qtyBtn}
            onPress={() => setQty((q) => Math.min(maxQty, q + 1))}
            disabled={qty >= maxQty}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={() => {
          addProduct(product, Math.min(qty, maxQty));
          Alert.alert("Added to cart", `${product.productName} × ${Math.min(qty, maxQty)}`);
        }}
        disabled={product.stockQuantity < 1}
      >
        <Text style={styles.ctaText}>
          {product.stockQuantity < 1 ? "Out of stock" : "Add to cart"}
        </Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Reviews</Text>
      {reviews.length === 0 ? (
        <Text style={styles.muted}>No reviews yet.</Text>
      ) : (
        reviews.map((r: ReviewItem) => <ReviewBlock key={String(r._id)} r={r} />)
      )}

      {user && (mine.productReview || mine.orderFeedback) ? (
        <Text style={styles.note}>You have already shared feedback for this product.</Text>
      ) : null}

      {canReview ? (
        <View style={styles.reviewForm}>
          <Text style={styles.sectionTitle}>Write a review</Text>
          <TextInput
            style={styles.input}
            placeholder="Rating 1–5"
            keyboardType="number-pad"
            value={reviewRating}
            onChangeText={setReviewRating}
          />
          <TextInput
            style={styles.input}
            placeholder="Title (optional)"
            value={reviewTitle}
            onChangeText={setReviewTitle}
          />
          <TextInput
            style={[styles.input, styles.inputMulti]}
            placeholder="Your review"
            multiline
            value={reviewText}
            onChangeText={setReviewText}
          />
          <Pressable
            style={[styles.cta, submitting && { opacity: 0.7 }]}
            onPress={submitReview}
            disabled={submitting}
          >
            <Text style={styles.ctaText}>{submitting ? "Sending…" : "Submit review"}</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
    </MobileSafeScreen>
  );
}

function ReviewBlock({ r }: { r: ReviewItem }) {
  const body = r.text || r.feedback || "";
  return (
    <View style={styles.reviewCard}>
      <Text style={styles.reviewName}>{r.customerName || "Customer"}</Text>
      {r.title ? <Text style={styles.reviewTitle}>{r.title}</Text> : null}
      <Text style={styles.reviewRating}>{r.rating != null ? `${r.rating}/5` : ""}</Text>
      <Text style={styles.reviewBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  hero: { backgroundColor: colors.surface, alignItems: "center" },
  heroImg: { width: "100%", height: 280 },
  heroPlaceholder: { backgroundColor: colors.border },
  name: { fontSize: 22, fontWeight: "700", color: colors.text, paddingHorizontal: spacing.page, marginTop: 16 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 10, paddingHorizontal: spacing.page, marginTop: 8 },
  price: { fontSize: 20, fontWeight: "700", color: colors.accent },
  compare: { fontSize: 16, color: colors.muted, textDecorationLine: "line-through" },
  desc: { fontSize: 15, color: colors.text, paddingHorizontal: spacing.page, marginTop: 12, lineHeight: 22 },
  meta: { fontSize: 14, color: colors.muted, paddingHorizontal: spacing.page, marginTop: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.page,
    marginTop: 20,
  },
  label: { fontSize: 16, fontWeight: "600", color: colors.text },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  qtyBtn: {
    minWidth: touch.minWidth,
    minHeight: touch.minHeight,
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: { fontSize: 20, color: colors.accent, fontWeight: "600" },
  qtyVal: { fontSize: 18, fontWeight: "600", minWidth: 28, textAlign: "center" },
  cta: {
    marginHorizontal: spacing.page,
    marginTop: 20,
    backgroundColor: colors.accent,
    paddingVertical: 16,
    minHeight: touch.minHeight,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPressed: { opacity: 0.9 },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: spacing.page,
    marginTop: 28,
    marginBottom: 8,
  },
  muted: { paddingHorizontal: spacing.page, color: colors.muted },
  reviewCard: {
    marginHorizontal: spacing.page,
    marginBottom: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewName: { fontWeight: "700", color: colors.text },
  reviewTitle: { marginTop: 4, fontWeight: "600" },
  reviewRating: { fontSize: 13, color: colors.muted, marginTop: 2 },
  reviewBody: { marginTop: 6, color: colors.text, lineHeight: 20 },
  note: { paddingHorizontal: spacing.page, color: colors.muted, fontStyle: "italic", marginTop: 8 },
  reviewForm: { paddingHorizontal: spacing.page, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: colors.surface,
    fontSize: 16,
  },
  inputMulti: { minHeight: 100, textAlignVertical: "top" },
});

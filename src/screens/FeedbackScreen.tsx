import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    createOrderFeedback,
    deleteOrderFeedback,
    fetchMyFeedback,
    fetchMyOrders,
    patchOrderFeedback,
} from "../api/jewelryApi";
import { mediaUrl } from "../config";
import { MobileSafeScreen } from "../components/MobileSafeScreen";
import { useAuth } from "../context/AuthContext";
import type { AccountStackParamList } from "../navigation/types";
import type { CustomerOrderFeedback, Order } from "../types/models";
import { isOrderFeedbackEligible } from "../utils/orderStatus";
import { colors, spacing, touch } from "../theme";

type Props = NativeStackScreenProps<AccountStackParamList, "Feedback">;

export function FeedbackScreen({ navigation }: Props) {
    const { token } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [list, setList] = useState<CustomerOrderFeedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [orderId, setOrderId] = useState("");
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [o, f] = await Promise.all([fetchMyOrders(token), fetchMyFeedback(token)]);
            setOrders(o.data || []);
            setList(Array.isArray(f) ? f : []);
        } catch {
            Alert.alert("Error", "Could not load reviews.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        load();
    }, [load]);

    const feedbackOrderIds = useMemo(
        () => new Set(list.map((fb) => String(fb.order?._id ?? fb.order ?? ""))),
        [list]
    );

    const eligibleOrders = useMemo(
        () =>
            orders.filter(
                (o) => isOrderFeedbackEligible(o.orderStatus) && !feedbackOrderIds.has(String(o._id))
            ),
        [orders, feedbackOrderIds]
    );

    const openAdd = () => {
        setEditingId(null);
        setOrderId(eligibleOrders[0]?._id || "");
        setRating(5);
        setTitle("");
        setBody("");
        setModalOpen(true);
    };

    const openEdit = (fb: CustomerOrderFeedback) => {
        setEditingId(fb._id);
        setOrderId(String(fb.order?._id ?? ""));
        setRating(fb.rating ?? 5);
        setTitle(fb.title || "");
        setBody(fb.feedback || "");
        setModalOpen(true);
    };

    const submit = async () => {
        if (!token) return;
        if (!body.trim() || !rating) {
            Alert.alert("Review", "Rating and feedback text are required.");
            return;
        }
        if (!editingId && !orderId) {
            Alert.alert("Review", "Choose an order.");
            return;
        }
        setSubmitting(true);
        try {
            if (editingId) {
                await patchOrderFeedback(token, editingId, {
                    title: title.trim(),
                    feedback: body.trim(),
                    rating,
                });
            } else {
                await createOrderFeedback(token, {
                    orderId,
                    title: title.trim(),
                    feedback: body.trim(),
                    rating,
                });
            }
            setModalOpen(false);
            await load();
            Alert.alert("Saved", "Your review was saved.");
        } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "Could not save.");
        } finally {
            setSubmitting(false);
        }
    };

    const onDelete = (id: string) => {
        if (!token) return;
        Alert.alert("Delete review", "Remove this review?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteOrderFeedback(token, id);
                        await load();
                    } catch (e) {
                        Alert.alert("Error", e instanceof Error ? e.message : "Could not delete.");
                    }
                },
            },
        ]);
    };

    if (!token) {
        return (
            <MobileSafeScreen>
                <View style={styles.centered}>
                    <Text style={styles.muted}>Sign in to manage order reviews.</Text>
                    <Pressable style={styles.primary} onPress={() => navigation.navigate("Login")} hitSlop={touch.hitSlop}>
                        <Text style={styles.primaryText}>Sign in</Text>
                    </Pressable>
                </View>
            </MobileSafeScreen>
        );
    }

    if (loading) {
        return (
            <MobileSafeScreen>
                <View style={styles.centered}>
                    <ActivityIndicator color={colors.accent} />
                </View>
            </MobileSafeScreen>
        );
    }

    return (
        <MobileSafeScreen style={styles.flex}>
            <FlatList
                data={list}
                keyExtractor={(item) => item._id}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.title}>My reviews</Text>
                        <Text style={styles.sub}>Feedback on orders (same as the website: Dashboard / My Reviews).</Text>
                        <Pressable
                            style={[styles.primary, eligibleOrders.length === 0 && { opacity: 0.5 }]}
                            onPress={openAdd}
                            disabled={eligibleOrders.length === 0}
                            hitSlop={touch.hitSlop}
                        >
                            <Text style={styles.primaryText}>Write a review</Text>
                        </Pressable>
                    </View>
                }
                ListEmptyComponent={<Text style={styles.muted}>No order reviews yet.</Text>}
                renderItem={({ item }) => {
                    const img = item.order?.items?.[0]?.product?.productImage;
                    const uri = mediaUrl(img);
                    return (
                        <View style={styles.card}>
                            <View style={styles.cardTop}>
                                {uri ? <Image source={{ uri }} style={styles.thumb} contentFit="cover" /> : <View style={[styles.thumb, styles.ph]} />}
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle}>{item.title || "Review"}</Text>
                                    <Text style={styles.stars}>{"★".repeat(item.rating || 0)}</Text>
                                    <Text style={styles.body}>{item.feedback}</Text>
                                </View>
                            </View>
                            <View style={styles.cardActions}>
                                <Pressable onPress={() => openEdit(item)} hitSlop={touch.hitSlop} style={styles.cardActionHit}>
                                    <Text style={styles.link}>Edit</Text>
                                </Pressable>
                                <Pressable onPress={() => onDelete(item._id)} hitSlop={touch.hitSlop} style={styles.cardActionHit}>
                                    <Text style={styles.danger}>Delete</Text>
                                </Pressable>
                            </View>
                        </View>
                    );
                }}
            />

            <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
                <KeyboardAvoidingView
                    style={styles.modalRoot}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <View style={styles.modalBackdrop}>
                        <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalOpen(false)} accessibilityRole="button" />
                        <SafeAreaView edges={["bottom", "left", "right"]} style={styles.modalSafe}>
                            <View style={styles.modalCard}>
                                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                                    <Text style={styles.modalTitle}>{editingId ? "Edit review" : "New review"}</Text>
                                    {!editingId && (
                                        <>
                                            <Text style={styles.label}>Order</Text>
                                            <View style={styles.orderPick}>
                                                {eligibleOrders.map((o) => (
                                                    <Pressable
                                                        key={o._id}
                                                        style={[styles.orderChip, orderId === o._id && styles.orderChipOn]}
                                                        onPress={() => setOrderId(o._id)}
                                                        hitSlop={touch.hitSlop}
                                                    >
                                                        <Text style={styles.orderChipText}>#{String(o._id).slice(-6)}</Text>
                                                    </Pressable>
                                                ))}
                                            </View>
                                        </>
                                    )}
                                    <Text style={styles.label}>Rating (1–5)</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="number-pad"
                                        value={String(rating)}
                                        onChangeText={(t) => setRating(Math.min(5, Math.max(1, parseInt(t, 10) || 1)))}
                                    />
                                    <Text style={styles.label}>Title (optional)</Text>
                                    <TextInput style={styles.input} value={title} onChangeText={setTitle} />
                                    <Text style={styles.label}>Your feedback</Text>
                                    <TextInput style={[styles.input, styles.tall]} multiline value={body} onChangeText={setBody} />
                                    <View style={styles.modalActions}>
                                        <Pressable style={styles.ghost} onPress={() => setModalOpen(false)} hitSlop={touch.hitSlop}>
                                            <Text style={styles.ghostText}>Cancel</Text>
                                        </Pressable>
                                        <Pressable
                                            style={[styles.primary, styles.primaryModal, submitting && { opacity: 0.75 }]}
                                            onPress={submit}
                                            disabled={submitting}
                                            hitSlop={touch.hitSlop}
                                        >
                                            <Text style={styles.primaryText}>{submitting ? "Saving…" : "Save"}</Text>
                                        </Pressable>
                                    </View>
                                </ScrollView>
                            </View>
                        </SafeAreaView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </MobileSafeScreen>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.bg },
    list: { padding: spacing.page, paddingBottom: spacing.xl },
    header: { marginBottom: spacing.sm },
    title: { fontSize: 22, fontWeight: "700", color: colors.text },
    sub: { marginTop: 8, color: colors.muted, lineHeight: 20 },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg, backgroundColor: colors.bg },
    muted: { color: colors.muted, textAlign: "center" },
    primary: {
        marginTop: spacing.sm,
        backgroundColor: colors.accent,
        paddingVertical: 14,
        minHeight: touch.minHeight,
        justifyContent: "center",
        borderRadius: 10,
        alignItems: "center",
        alignSelf: "flex-start",
        paddingHorizontal: 20,
    },
    primaryText: { color: "#fff", fontWeight: "700" },
    /** Modal actions row: no extra top margin, natural width in flex row */
    primaryModal: { marginTop: 0, alignSelf: "auto" },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 12,
        marginBottom: 12,
    },
    cardTop: { flexDirection: "row", gap: 12 },
    thumb: { width: 56, height: 56, borderRadius: 8 },
    ph: { backgroundColor: colors.border },
    cardTitle: { fontWeight: "700", fontSize: 16 },
    stars: { color: colors.accent, marginTop: 4 },
    body: { marginTop: 8, color: colors.text, lineHeight: 20 },
    cardActions: { flexDirection: "row", gap: 16, marginTop: 12 },
    cardActionHit: { minHeight: touch.minHeight, justifyContent: "center" },
    link: { color: colors.accent, fontWeight: "600" },
    danger: { color: colors.danger, fontWeight: "600" },
    modalRoot: { flex: 1 },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },
    modalSafe: { width: "100%" },
    modalCard: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: spacing.md,
        maxHeight: "90%",
    },
    modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
    label: { marginTop: 10, fontWeight: "600", color: colors.muted },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        padding: 10,
        marginTop: 6,
        fontSize: 16,
    },
    tall: { minHeight: 100, textAlignVertical: "top" },
    orderPick: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
    orderChip: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: touch.minHeight,
        justifyContent: "center",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    orderChipOn: { borderColor: colors.accent, backgroundColor: colors.bg },
    orderChipText: { fontWeight: "600" },
    modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 20, flexWrap: "wrap" },
    ghost: { paddingVertical: 12, paddingHorizontal: 8, minHeight: touch.minHeight, justifyContent: "center" },
    ghostText: { color: colors.muted, fontWeight: "600" },
});

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { staffDeleteFeedback, staffReplyFeedback } from "../../api/staffApi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import type { StaffStackParamList } from "../../navigation/types";
import { staffCanDeleteFeedback } from "../../utils/staffRoles";
import { colors, spacing, touch } from "../../theme";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffFeedbackDetail">;

export function StaffFeedbackDetailScreen({ navigation, route }: Props) {
    const { token, staff } = useStaffAuth();
    const { item } = route.params;
    const [reply, setReply] = useState(item.staffReply ?? "");
    const [busy, setBusy] = useState(false);

    const saveReply = async () => {
        if (!token) return;
        const text = reply.trim();
        if (!text) {
            Alert.alert("Reply", "Enter reply text.");
            return;
        }
        setBusy(true);
        try {
            await staffReplyFeedback(token, item._id, text);
            navigation.goBack();
        } catch (e) {
            Alert.alert("Reply", e instanceof Error ? e.message : "Failed");
        } finally {
            setBusy(false);
        }
    };

    const del = () => {
        if (!token) return;
        Alert.alert("Delete feedback", "Remove this review permanently?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await staffDeleteFeedback(token, item._id);
                        navigation.goBack();
                    } catch (e) {
                        Alert.alert("Error", e instanceof Error ? e.message : "Failed");
                    }
                },
            },
        ]);
    };

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.body}>{item.customerName || "—"}</Text>
            <Text style={styles.label}>Rating</Text>
            <Text style={styles.stars}>{"★".repeat(item.rating || 0)}</Text>
            <Text style={styles.label}>Feedback</Text>
            <Text style={styles.body}>{item.feedback || item.title || "—"}</Text>
            {item.staffReply ? (
                <>
                    <Text style={styles.label}>Current reply</Text>
                    <Text style={styles.body}>{item.staffReply}</Text>
                </>
            ) : null}
            <Text style={styles.label}>Your reply</Text>
            <TextInput
                style={[styles.input, styles.tall]}
                value={reply}
                onChangeText={setReply}
                multiline
                placeholder="Thank the customer…"
            />
            <Pressable style={[styles.cta, busy && { opacity: 0.75 }]} onPress={saveReply} disabled={busy}>
                <Text style={styles.ctaText}>{busy ? "Saving…" : "Post reply"}</Text>
            </Pressable>
            {staffCanDeleteFeedback(staff?.role ?? "") ? (
                <Pressable style={styles.danger} onPress={del} hitSlop={touch.hitSlop}>
                    <Text style={styles.dangerText}>Delete feedback (admin)</Text>
                </Pressable>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.bg },
    pad: { padding: spacing.page, paddingBottom: spacing.xl },
    label: { fontSize: 13, fontWeight: "600", color: colors.muted, marginTop: 12, marginBottom: 4 },
    body: { fontSize: 16, color: colors.text, lineHeight: 24 },
    stars: { fontSize: 18, color: colors.accent },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        padding: 14,
        backgroundColor: colors.surface,
        fontSize: 16,
    },
    tall: { minHeight: 120, textAlignVertical: "top" },
    cta: {
        marginTop: 20,
        backgroundColor: colors.accent,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        minHeight: touch.minHeight,
        justifyContent: "center",
    },
    ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    danger: { marginTop: 24, alignItems: "center", padding: 12 },
    dangerText: { color: colors.danger, fontWeight: "700" },
});

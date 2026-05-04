import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { staffFetchFeedback, type StaffFeedbackRow } from "../../api/staffApi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import type { StaffStackParamList } from "../../navigation/types";
import { colors, spacing, touch } from "../../theme";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffFeedback">;

export function StaffFeedbackScreen({ navigation }: Props) {
    const { token } = useStaffAuth();
    const [rows, setRows] = useState<StaffFeedbackRow[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const list = await staffFetchFeedback(token);
            setRows(list);
        } catch (e) {
            Alert.alert("Feedback", e instanceof Error ? e.message : "Could not load");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        return navigation.addListener("focus", load);
    }, [navigation, load]);

    return (
        <View style={styles.flex}>
            {loading && rows.length === 0 ? (
                <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
            ) : (
                <FlatList
                    data={rows}
                    keyExtractor={(item) => item._id}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <Pressable
                            style={styles.card}
                            onPress={() => navigation.navigate("StaffFeedbackDetail", { item })}
                            hitSlop={touch.hitSlop}
                        >
                            <Text style={styles.name}>{item.customerName || "Customer"}</Text>
                            <Text style={styles.meta} numberOfLines={2}>
                                {item.feedback || item.title}
                            </Text>
                            <Text style={styles.stars}>{"★".repeat(item.rating || 0)}</Text>
                        </Pressable>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.bg },
    list: { padding: spacing.page, gap: spacing.sm, paddingBottom: spacing.xl },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
    },
    name: { fontSize: 16, fontWeight: "700", color: colors.text },
    meta: { marginTop: 6, fontSize: 14, color: colors.muted },
    stars: { marginTop: 6, color: colors.accent, fontWeight: "600" },
});

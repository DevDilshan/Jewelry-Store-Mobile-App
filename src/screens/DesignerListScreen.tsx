import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { listDesignerPortfolios } from "../api/jewelryApi";
import { MobileSafeScreen } from "../components/MobileSafeScreen";
import type { ShopStackParamList } from "../navigation/types";
import type { DesignerPortfolioPublic } from "../types/models";
import { colors, spacing, touch } from "../theme";

type Props = NativeStackScreenProps<ShopStackParamList, "DesignerList">;

export function DesignerListScreen({ navigation }: Props) {
  const [rows, setRows] = useState<DesignerPortfolioPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await listDesignerPortfolios();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load designers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && rows.length === 0) {
    return (
      <MobileSafeScreen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </MobileSafeScreen>
    );
  }

  return (
    <MobileSafeScreen style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={rows}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.muted}>No published portfolios yet.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
            onPress={() => navigation.navigate("DesignerDetail", { id: item._id })}
            hitSlop={touch.hitSlop}
          >
            <Text style={styles.title}>{item.displayName}</Text>
            {item.headline ? <Text style={styles.headline}>{item.headline}</Text> : null}
            {item.staff ? (
              <Text style={styles.staff}>
                {[item.staff.firstName, item.staff.lastName].filter(Boolean).join(" ")}
                {item.staff.jobTitle ? ` · ${item.staff.jobTitle}` : ""}
              </Text>
            ) : null}
          </Pressable>
        )}
      />
    </MobileSafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  list: { padding: spacing.page, gap: spacing.sm, paddingBottom: spacing.xl },
  error: { color: colors.danger, textAlign: "center", padding: spacing.page },
  muted: { textAlign: "center", color: colors.muted, padding: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  headline: { marginTop: 6, fontSize: 15, color: colors.muted },
  staff: { marginTop: 8, fontSize: 13, color: colors.muted },
});

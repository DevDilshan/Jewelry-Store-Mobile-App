import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
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
import {
  designerFetchMyPortfolio,
  staffFetchPortfolios,
  type DesignerPortfolioFull,
  type StaffPortfolioRow,
} from "../../api/staffApi";
import { mediaUrl } from "../../config";
import { useStaffAuth } from "../../context/StaffAuthContext";
import type { StaffStackParamList } from "../../navigation/types";
import { staffCanEditPortfolios, staffIsDesigner } from "../../utils/staffRoles";
import { colors, spacing, touch } from "../../theme";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffPortfolios">;

export function StaffPortfoliosScreen({ navigation }: Props) {
  const { token, staff } = useStaffAuth();
  const role = staff?.role ?? "";
  const isDesigner = staffIsDesigner(role);

  const [mine, setMine] = useState<DesignerPortfolioFull | null>(null);
  const [rows, setRows] = useState<StaffPortfolioRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDesigner = useCallback(async () => {
    if (!token || !isDesigner) return;
    try {
      const row = await designerFetchMyPortfolio(token);
      setMine(row);
    } catch (e) {
      Alert.alert("My portfolio", e instanceof Error ? e.message : "Could not load");
    }
  }, [token, isDesigner]);

  const loadAdmin = useCallback(async () => {
    if (!token || isDesigner) return;
    try {
      const list = await staffFetchPortfolios(token);
      setRows(list);
    } catch (e) {
      Alert.alert("Portfolios", e instanceof Error ? e.message : "Could not load");
    }
  }, [token, isDesigner]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (isDesigner) {
        await loadDesigner();
      } else {
        await loadAdmin();
      }
    } finally {
      setLoading(false);
    }
  }, [token, isDesigner, loadDesigner, loadAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return navigation.addListener("focus", load);
  }, [navigation, load]);

  if (isDesigner) {
    const thumb = mine?.images?.[0];
    const uri = thumb ? mediaUrl(thumb.relPath) : null;

    return (
      <View style={styles.flex}>
        {loading && !mine ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} />
        ) : (
          <View style={styles.designerWrap}>
            {!mine ? (
              <>
                <Text style={styles.designerTitle}>Your designer portfolio</Text>
                <Text style={styles.designerSub}>
                  You don’t have a portfolio yet. Create one to appear on the Designers storefront tab — add photos and
                  publish when ready.
                </Text>
                <Pressable
                  style={styles.primaryCta}
                  onPress={() => navigation.navigate("StaffPortfolioEditor", { mine: true })}
                  hitSlop={touch.hitSlop}
                >
                  <Text style={styles.primaryCtaText}>Create portfolio</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                style={styles.heroCard}
                onPress={() => navigation.navigate("StaffPortfolioEditor", { mine: true })}
                hitSlop={touch.hitSlop}
              >
                {uri ? (
                  <Image source={{ uri }} style={styles.heroImg} contentFit="cover" />
                ) : (
                  <View style={[styles.heroImg, styles.heroPh]} />
                )}
                <View style={styles.heroBody}>
                  <Text style={styles.heroName}>{mine.displayName}</Text>
                  <Text style={styles.heroMeta}>
                    {mine.headline || "—"} · {mine.isPublished ? "Published" : "Draft"} · {mine.images?.length ?? 0}{" "}
                    photo{(mine.images?.length ?? 0) === 1 ? "" : "s"}
                  </Text>
                  <Text style={styles.heroLink}>Edit portfolio & photos ›</Text>
                </View>
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  }

  const canAddForDesigner = staffCanEditPortfolios(role);

  return (
    <View style={styles.flex}>
      {canAddForDesigner ? (
        <Pressable
          style={styles.addTop}
          onPress={() => navigation.navigate("StaffPortfolioCreate")}
          hitSlop={touch.hitSlop}
        >
          <Text style={styles.addTopText}>+ Add portfolio for designer</Text>
        </Pressable>
      ) : null}
      {loading && rows.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No designer portfolios yet.</Text>
          }
          renderItem={({ item }) => {
            const first = item.images?.[0];
            const uri = first ? mediaUrl(first.relPath) : null;
            return (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate("StaffPortfolioEditor", { id: item._id })}
                hitSlop={touch.hitSlop}
              >
                <View style={styles.cardRow}>
                  {uri ? (
                    <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.thumb, styles.thumbPh]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.displayName}</Text>
                    <Text style={styles.meta} numberOfLines={2}>
                      {item.headline || "—"}
                    </Text>
                    <Text style={styles.metaSmall}>
                      {item.staff?.firstName} {item.staff?.lastName} · {item.isPublished ? "Published" : "Draft"} ·{" "}
                      {item.images?.length ?? 0} photos
                      {(() => {
                        const extra: string[] = [];
                        if (item.yearsOfExperience != null) extra.push(`${item.yearsOfExperience} yrs`);
                        if (item.completedProjects != null) {
                          extra.push(`${item.completedProjects.toLocaleString()} proj.`);
                        }
                        return extra.length ? ` · ${extra.join(" · ")}` : "";
                      })()}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  addTop: {
    marginHorizontal: spacing.page,
    marginTop: spacing.sm,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.text,
    alignItems: "center",
    minHeight: touch.minHeight,
    justifyContent: "center",
  },
  addTopText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  designerWrap: { padding: spacing.page, paddingTop: spacing.md },
  designerTitle: { fontSize: 22, fontWeight: "700", color: colors.text },
  designerSub: { marginTop: 10, fontSize: 16, color: colors.muted, lineHeight: 24 },
  primaryCta: {
    marginTop: 24,
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    minHeight: touch.minHeight,
    justifyContent: "center",
  },
  primaryCtaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  heroImg: { width: "100%", height: 180 },
  heroPh: { backgroundColor: colors.border },
  heroBody: { padding: spacing.page },
  heroName: { fontSize: 20, fontWeight: "700", color: colors.text },
  heroMeta: { marginTop: 8, fontSize: 15, color: colors.muted, lineHeight: 22 },
  heroLink: { marginTop: 14, fontSize: 16, fontWeight: "700", color: colors.accent },
  list: { padding: spacing.page, gap: spacing.sm, paddingBottom: spacing.xl },
  empty: { textAlign: "center", color: colors.muted, marginTop: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  cardRow: { flexDirection: "row", gap: 12 },
  thumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: colors.border },
  thumbPh: { backgroundColor: colors.border },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  meta: { marginTop: 4, fontSize: 14, color: colors.muted },
  metaSmall: { marginTop: 6, fontSize: 12, color: colors.muted },
});

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { MobileSafeScreen } from "../components/MobileSafeScreen";
import { getDesignerPortfolio } from "../api/jewelryApi";
import { portfolioImageDisplayUri } from "../config";
import { useShopDetailReturnToHome } from "../navigation/useShopDetailReturnToHome";
import type { ShopStackParamList } from "../navigation/types";
import type { DesignerPortfolioPublic } from "../types/models";
import { colors, spacing } from "../theme";

type Props = NativeStackScreenProps<ShopStackParamList, "DesignerDetail">;

export function DesignerDetailScreen({ route, navigation }: Props) {
  const { id, fromHome } = route.params;
  useShopDetailReturnToHome(navigation, fromHome);
  const [data, setData] = useState<DesignerPortfolioPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const row = await getDesignerPortfolio(id);
      setData(row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <MobileSafeScreen>
        <View style={styles.centered}>
          {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator size="large" color={colors.accent} />}
        </View>
      </MobileSafeScreen>
    );
  }

  return (
    <MobileSafeScreen>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.name}>{data.displayName}</Text>
      {data.headline ? <Text style={styles.headline}>{data.headline}</Text> : null}
      {data.staff ? (
        <Text style={styles.staff}>
          {[data.staff.firstName, data.staff.lastName].filter(Boolean).join(" ")}
          {data.staff.jobTitle ? ` · ${data.staff.jobTitle}` : ""}
        </Text>
      ) : null}
      {data.bio ? <Text style={styles.bio}>{data.bio}</Text> : null}
      {data.specialties && data.specialties.length > 0 ? (
        <Text style={styles.tags}>{data.specialties.join(" · ")}</Text>
      ) : null}

      <View style={styles.grid}>
        {data.images.map((img) => {
          const uri = portfolioImageDisplayUri(img);
          return (
            <View key={img._id} style={styles.cell}>
              {uri ? (
                <Image source={{ uri }} style={styles.img} contentFit="cover" recyclingKey={uri} />
              ) : (
                <View style={[styles.img, styles.ph]} />
              )}
              {img.caption ? <Text style={styles.caption}>{img.caption}</Text> : null}
            </View>
          );
        })}
      </View>
    </ScrollView>
    </MobileSafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.page, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  error: { color: colors.danger, padding: spacing.page },
  name: { fontSize: 24, fontWeight: "700", color: colors.text },
  headline: { fontSize: 16, color: colors.muted, marginTop: 8 },
  staff: { fontSize: 14, color: colors.muted, marginTop: 12 },
  bio: { fontSize: 15, lineHeight: 22, color: colors.text, marginTop: 16 },
  tags: { fontSize: 14, color: colors.accentMuted, marginTop: 12 },
  grid: { marginTop: 20, gap: 16 },
  cell: {},
  img: { width: "100%", height: 220, borderRadius: 12, backgroundColor: colors.border },
  ph: { backgroundColor: colors.border },
  caption: { marginTop: 8, fontSize: 14, color: colors.muted },
});

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { adminCreatePortfolio, staffFetchPortfolios, staffFetchTeam } from "../../api/staffApi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import type { StaffStackParamList } from "../../navigation/types";
import { staffCanEditPortfolios } from "../../utils/staffRoles";
import { colors, spacing, touch } from "../../theme";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffPortfolioCreate">;

export function StaffPortfolioCreateScreen({ navigation }: Props) {
  const { token, staff } = useStaffAuth();
  const role = staff?.role ?? "";
  const allowed = staffCanEditPortfolios(role);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [team, setTeam] = useState<Awaited<ReturnType<typeof staffFetchTeam>>>([]);
  const [portfolios, setPortfolios] = useState<Awaited<ReturnType<typeof staffFetchPortfolios>>>([]);

  const [staffId, setStaffId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [yearsExperience, setYearsExperience] = useState("0");
  const [completedProjects, setCompletedProjects] = useState("0");
  const [published, setPublished] = useState(false);

  const eligible = useMemo(() => {
    const hasPortfolio = new Set(portfolios.map((p) => String(p.staff?._id ?? "")));
    return team.filter((t) => t.role === "designer" && !hasPortfolio.has(String(t._id)));
  }, [team, portfolios]);

  const load = useCallback(async () => {
    if (!token || !allowed) return;
    setLoading(true);
    try {
      const [t, p] = await Promise.all([staffFetchTeam(token), staffFetchPortfolios(token)]);
      setTeam(t);
      setPortfolios(p);
    } catch (e) {
      Alert.alert("Load", e instanceof Error ? e.message : "Could not load staff");
    } finally {
      setLoading(false);
    }
  }, [token, allowed]);

  useEffect(() => {
    if (!allowed) {
      Alert.alert("Portfolios", "Only administrators and product managers can create portfolios for designers.");
      navigation.goBack();
      return;
    }
    load();
  }, [allowed, load, navigation]);

  const submit = async () => {
    if (!token || !staffId) {
      Alert.alert("Portfolio", "Choose a designer who doesn’t have a portfolio yet.");
      return;
    }
    const name = displayName.trim();
    if (name.length < 2 || name.length > 120) {
      Alert.alert("Portfolio", "Display name must be 2–120 characters.");
      return;
    }
    const yearsOfExperienceNum = Number(yearsExperience);
    const completedProjectsNum = Number(completedProjects);
    const spec = specialties
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    setBusy(true);
    try {
      const row = await adminCreatePortfolio(token, {
        staffId,
        displayName: name,
        headline: headline.trim(),
        bio: bio.trim(),
        specialties: spec,
        yearsOfExperience: yearsOfExperienceNum,
        completedProjects: completedProjectsNum,
        isPublished: published,
      });
      navigation.replace("StaffPortfolioEditor", { id: row._id });
    } catch (e) {
      Alert.alert("Portfolio", e instanceof Error ? e.message : "Could not create");
    } finally {
      setBusy(false);
    }
  };

  if (!allowed) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>
        Create a storefront portfolio for a staff member with the designer role. They can sign in later to manage photos
        from “My portfolio”, or you can add images here after saving.
      </Text>

      {eligible.length === 0 ? (
        <Text style={styles.warn}>
          Every designer already has a portfolio, or there are no designer accounts. Add a designer from Team, then
          return here.
        </Text>
      ) : (
        <>
          <Text style={styles.label}>Designer</Text>
          <View style={styles.chips}>
            {eligible.map((m) => {
              const label = [m.firstName, m.lastName].filter(Boolean).join(" ").trim() || m.username;
              const on = staffId === m._id;
              return (
                <Pressable
                  key={m._id}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => {
                    setStaffId(m._id);
                    if (!displayName.trim()) setDisplayName(label);
                  }}
                  hitSlop={touch.hitSlop}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={2}>
                    {label}
                    {"\n"}
                    <Text style={styles.chipSub}>{m.email}</Text>
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Display name (storefront)</Text>
          <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="e.g. Maya Atelier" />

          <Text style={styles.label}>Headline</Text>
          <TextInput style={styles.input} value={headline} onChangeText={setHeadline} placeholder="Short tagline" />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.tall]}
            value={bio}
            onChangeText={setBio}
            multiline
            placeholder="About the designer"
          />

          <Text style={styles.label}>Specialties (comma-separated)</Text>
          <TextInput style={styles.input} value={specialties} onChangeText={setSpecialties} placeholder="Rings, custom gold" />

          <Text style={styles.label}>Years of experience (0–80)</Text>
          <TextInput
            style={styles.input}
            value={yearsExperience}
            onChangeText={setYearsExperience}
            keyboardType="default"
            placeholder="0"
          />

          <Text style={styles.label}>Completed projects (0–100,000)</Text>
          <TextInput
            style={styles.input}
            value={completedProjects}
            onChangeText={setCompletedProjects}
            keyboardType="default"
            placeholder="0"
          />

          <View style={styles.row}>
            <Text style={styles.label}>Published on storefront</Text>
            <Switch value={published} onValueChange={setPublished} trackColor={{ true: colors.accent }} />
          </View>

          <Pressable style={[styles.cta, (busy || !staffId) && { opacity: 0.75 }]} onPress={submit} disabled={busy || !staffId}>
            <Text style={styles.ctaText}>{busy ? "Creating…" : "Create portfolio"}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  scroll: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.page, paddingBottom: spacing.xl },
  intro: { fontSize: 15, color: colors.muted, lineHeight: 22, marginBottom: spacing.sm },
  warn: { fontSize: 15, color: colors.accentMuted, lineHeight: 22 },
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
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    maxWidth: "100%",
  },
  chipOn: { borderColor: colors.accent, backgroundColor: colors.bg },
  chipText: { fontSize: 14, fontWeight: "600", color: colors.text },
  chipTextOn: { color: colors.accent },
  chipSub: { fontSize: 12, fontWeight: "400", color: colors.muted },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
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

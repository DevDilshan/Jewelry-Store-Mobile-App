import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { staffFetchTeam, staffRegisterMember, type StaffMemberRow } from "../../api/staffApi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import type { StaffStackParamList } from "../../navigation/types";
import { staffCanManageTeam } from "../../utils/staffRoles";
import { colors, spacing, touch } from "../../theme";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffTeam">;

const ROLES = ["admin", "productmanager", "sales", "viewer", "designer"] as const;

export function StaffTeamScreen({ navigation }: Props) {
  const { token, staff } = useStaffAuth();
  const canManage = staffCanManageTeam(staff?.role ?? "");

  const [rows, setRows] = useState<StaffMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("viewer");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const list = await staffFetchTeam(token);
      setRows(list);
    } catch (e) {
      Alert.alert("Team", e instanceof Error ? e.message : "Could not load");
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

  const add = async () => {
    if (!token || !canManage) return;
    if (!username.trim() || !email.trim()) {
      Alert.alert("Team", "Username and email are required.");
      return;
    }
    setBusy(true);
    try {
      await staffRegisterMember(token, {
        username: username.trim(),
        email: email.trim(),
        role,
        password: password.trim() || undefined,
      });
      setUsername("");
      setEmail("");
      setPassword("");
      await load();
      Alert.alert("Team", "Staff member created.");
    } catch (e) {
      Alert.alert("Team", e instanceof Error ? e.message : "Could not create");
    } finally {
      setBusy(false);
    }
  };

  if (!canManage) {
    return (
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.ro}>Only administrators can manage team accounts.</Text>
      </ScrollView>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.form}>
        <Text style={styles.section}>Invite staff</Text>
        <Text style={styles.label}>Username</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Text style={styles.label}>Role</Text>
        <View style={styles.chips}>
          {ROLES.map((r) => (
            <Pressable key={r} style={[styles.chip, role === r && styles.chipOn]} onPress={() => setRole(r)}>
              <Text style={[styles.chipText, role === r && styles.chipTextOn]}>{r}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Password (optional)</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Default from server if empty" />
        <Pressable style={[styles.cta, busy && { opacity: 0.75 }]} onPress={add} disabled={busy}>
          <Text style={styles.ctaText}>{busy ? "Creating…" : "Add staff member"}</Text>
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <Text style={styles.section}>All staff ({rows.length})</Text>
        {loading && rows.length === 0 ? <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} /> : null}
        {rows.map((item) => (
          <View key={item._id} style={styles.card}>
            <Text style={styles.name}>{item.username}</Text>
            <Text style={styles.meta}>
              {item.email} · {item.role}
            </Text>
            <Text style={styles.meta}>
              {[item.firstName, item.lastName].filter(Boolean).join(" ") || "—"}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.page },
  ro: { color: colors.muted, lineHeight: 22 },
  form: { padding: spacing.page, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  section: { fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 4, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.surface,
    fontSize: 16,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { borderColor: colors.accent, backgroundColor: colors.bg },
  chipText: { fontSize: 12, color: colors.text },
  chipTextOn: { fontWeight: "700", color: colors.accent },
  cta: {
    marginTop: 16,
    backgroundColor: colors.text,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    minHeight: touch.minHeight,
    justifyContent: "center",
  },
  ctaText: { color: "#fff", fontWeight: "700" },
  list: { padding: spacing.page, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: spacing.sm,
  },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  meta: { marginTop: 4, fontSize: 14, color: colors.muted },
});

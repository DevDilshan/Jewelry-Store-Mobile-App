import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useLayoutEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ApiError } from "../api/client";
import { MobileScrollScreen } from "../components/MobileSafeScreen";
import { useStaffAuth } from "../context/StaffAuthContext";
import { navigateToStaffWorkspace } from "../navigation/navigationHelpers";
import type { AccountStackParamList } from "../navigation/types";
import { colors, spacing, touch } from "../theme";

type Props = NativeStackScreenProps<AccountStackParamList, "StaffLogin">;

export function StaffLoginScreen({ navigation }: Props) {
  const { signInStaff, staff, loading: staffAuthLoading, token } = useStaffAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  /** Persisted staff session or post–sign-in: leave this screen and open the workspace (token in SecureStore). */
  useLayoutEffect(() => {
    if (staffAuthLoading) return;
    if (!staff) return;
    navigation.popToTop();
    navigateToStaffWorkspace(navigation);
  }, [staffAuthLoading, staff, navigation]);

  const onSubmit = async () => {
    setBusy(true);
    try {
      await signInStaff(email.trim(), password);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Staff sign in failed";
      Alert.alert("Staff sign in", msg);
    } finally {
      setBusy(false);
    }
  };

  const resolvingSession = !staffAuthLoading && Boolean(token) && !staff;

  if (staffAuthLoading || resolvingSession) {
    return (
      <MobileScrollScreen>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.resolvingText}>Restoring staff session…</Text>
        </View>
      </MobileScrollScreen>
    );
  }

  return (
    <MobileScrollScreen keyboard contentContainerStyle={styles.body}>
      <Text style={styles.intro}>
        Store team accounts use the same backend as the admin site. This does not replace your customer
        account — you can stay signed in to both.
      </Text>
      <Text style={[styles.label, styles.labelFirst]}>Work email</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
        textContentType="username"
        value={email}
        onChangeText={setEmail}
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        textContentType="password"
        value={password}
        onChangeText={setPassword}
      />
      <Pressable
        style={[styles.cta, busy && { opacity: 0.75 }]}
        onPress={onSubmit}
        disabled={busy}
        hitSlop={touch.hitSlop}
      >
        <Text style={styles.ctaText}>{busy ? "Signing in…" : "Staff sign in"}</Text>
      </Pressable>
      <Pressable style={styles.link} onPress={() => navigation.goBack()} hitSlop={touch.hitSlop}>
        <Text style={styles.linkText}>Back to account</Text>
      </Pressable>
    </MobileScrollScreen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.page },
  resolvingText: { marginTop: 12, fontSize: 15, color: colors.muted },
  body: { paddingTop: spacing.sm },
  intro: { fontSize: 15, color: colors.muted, lineHeight: 22, marginBottom: spacing.sm },
  label: { fontSize: 14, fontWeight: "600", color: colors.muted, marginBottom: 6, marginTop: 12 },
  labelFirst: { marginTop: 0 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 4,
    backgroundColor: colors.surface,
    fontSize: 16,
    minHeight: touch.minHeight,
  },
  cta: {
    marginTop: 20,
    backgroundColor: colors.text,
    paddingVertical: 16,
    minHeight: touch.minHeight,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  link: { marginTop: 20, alignItems: "center", paddingVertical: 8 },
  linkText: { color: colors.accent, fontWeight: "600" },
});
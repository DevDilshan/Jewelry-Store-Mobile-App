import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput } from "react-native";
import { ApiError } from "../api/client";
import { MobileScrollScreen } from "../components/MobileSafeScreen";
import { useAuth } from "../context/AuthContext";
import type { AccountStackParamList } from "../navigation/types";
import { colors, spacing, touch } from "../theme";

type Props = NativeStackScreenProps<AccountStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    try {
      await signUp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        address: address.trim() || undefined,
      });
      navigation.navigate("Dashboard");
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Registration failed";
      Alert.alert("Create account", msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <MobileScrollScreen keyboard contentContainerStyle={styles.body}>
      <Text style={[styles.label, styles.labelFirst]}>First name</Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
      <Text style={styles.label}>Last name</Text>
      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
      <Text style={styles.label}>Email *</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />
      <Text style={styles.label}>Password *</Text>
      <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
      <Text style={styles.label}>Address (optional)</Text>
      <TextInput style={[styles.input, styles.tall]} multiline value={address} onChangeText={setAddress} />
      <Pressable
        style={[styles.cta, busy && { opacity: 0.75 }]}
        onPress={onSubmit}
        disabled={busy}
        hitSlop={touch.hitSlop}
      >
        <Text style={styles.ctaText}>{busy ? "Creating…" : "Create account"}</Text>
      </Pressable>
      <Pressable style={styles.link} onPress={() => navigation.navigate("Login")} hitSlop={touch.hitSlop}>
        <Text style={styles.linkText}>Already have an account? Sign in</Text>
      </Pressable>
    </MobileScrollScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: spacing.sm },
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
  tall: { minHeight: 100, textAlignVertical: "top", paddingTop: 14 },
  cta: {
    marginTop: 20,
    backgroundColor: colors.accent,
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
//updated
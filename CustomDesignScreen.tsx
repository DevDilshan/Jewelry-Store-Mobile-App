import type { NavigationProp } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { submitGuestCustomDesignInquiry } from "../api/jewelryApi";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useShopDetailReturnToHome } from "../navigation/useShopDetailReturnToHome";
import type { RootTabParamList, ShopStackParamList } from "../navigation/types";
import { colors, radius, spacing, touch } from "../theme";

type Props = NativeStackScreenProps<ShopStackParamList, "CustomDesign">;

type FormState = {
  name: string;
  email: string;
  phone: string;
  title: string;
  description: string;
  budget: string;
};

const EMPTY: FormState = { name: "", email: "", phone: "", title: "", description: "", budget: "" };

const DESIGN_IDEAS = [
  "Engagement ring with custom engraving",
  "Gold necklace with birthstone pendant",
  "Matching bridal jewellery set",
  "Custom bracelet with family initials",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CustomDesignScreen({ navigation, route }: Props) {
  useShopDetailReturnToHome(navigation, route.params?.fromHome);
  const { user } = useAuth();
  const signedIn = Boolean(user);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function set(field: keyof FormState) {
    return (val: string) => setForm((f) => ({ ...f, [field]: val }));
  }

  function goDesigners() {
    setSuccess(false);
    const tab = navigation.getParent() as NavigationProp<RootTabParamList> | undefined;
    tab?.navigate("Shop", { screen: "DesignerList" });
  }

  function goAccount() {
    setSuccess(false);
    const tab = navigation.getParent() as NavigationProp<RootTabParamList> | undefined;
    tab?.navigate("Account", { screen: "Dashboard" });
  }

  async function handleSubmit() {
    const n = form.name.trim();
    const em = form.email.trim();
    const desc = form.description.trim();
    if (!n || n.length < 2) {
      Alert.alert("Missing details", "Please enter your name (at least 2 characters).");
      return;
    }
    if (!em || !EMAIL_RE.test(em)) {
      Alert.alert("Missing details", "Please enter a valid email address.");
      return;
    }
    if (!desc) {
      Alert.alert("Missing details", "Please describe what you have in mind.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitGuestCustomDesignInquiry({
        name: n,
        email: em,
        phone: form.phone,
        title: form.title,
        description: desc,
        budget: form.budget,
      });
      if (!res.success) {
        Alert.alert("Could not send", res.message || "Please try again later.");
        return;
      }
      setForm(EMPTY);
      setSuccess(true);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Could not send. Check your connection and try again.";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <View style={styles.successWrap}>
        <Text style={styles.successTitle}>Request sent</Text>
        <Text style={styles.successBody}>Thank you! We’ll reach out using the email you provided.</Text>
        <View style={styles.successActions}>
          {signedIn ? (
            <Pressable style={styles.secondaryBtn} onPress={goAccount} hitSlop={touch.hitSlop}>
              <Text style={styles.secondaryBtnText}>Open Account</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.primaryBtn} onPress={goDesigners} hitSlop={touch.hitSlop}>
            <Text style={styles.primaryBtnText}>Meet our designers</Text>
          </Pressable>
          <Pressable style={styles.textBtn} onPress={() => navigation.goBack()} hitSlop={touch.hitSlop}>
            <Text style={styles.textBtnLabel}>Close</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={88}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Request a custom design</Text>
          <Text style={styles.lead}>
            Tell us about your vision — metal, stones, style, and budget. Our design team will reply within a couple of
            business days. No account required.
          </Text>
        </View>

        {signedIn ? (
          <Text style={styles.hint}>
            You’re signed in — use the Account tab for orders and profile. To track every custom request like on the web,
            use your account dashboard in the browser.
          </Text>
        ) : null}

        <Text style={styles.sectionLabel}>Popular requests</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {DESIGN_IDEAS.map((idea) => (
            <Pressable
              key={idea}
              style={styles.chip}
              onPress={() => set("description")(idea)}
              hitSlop={touch.hitSlop}
            >
              <Text style={styles.chipText}>{idea}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>
              Your name <Text style={styles.req}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={set("name")}
              placeholder="e.g. Amali Perera"
              placeholderTextColor={colors.muted}
              maxLength={200}
              autoComplete="name"
              returnKeyType="next"
            />
          </View>

          {/* updated */}

          <View style={styles.field}>
            <Text style={styles.label}>
              Email <Text style={styles.req}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={set("email")}
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={320}
              autoComplete="email"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Phone <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={set("phone")}
              placeholder="+94 77 000 0000"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              maxLength={40}
              autoComplete="tel"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Short title <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={set("title")}
              placeholder="e.g. Rose gold engagement ring with sapphire"
              placeholderTextColor={colors.muted}
              maxLength={200}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Describe your design <Text style={styles.req}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.description}
              onChangeText={set("description")}
              placeholder="Metal, stones, style, sizing, occasion — anything that helps us understand your vision."
              placeholderTextColor={colors.muted}
              multiline
              maxLength={8000}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Approximate budget (LKR) <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={form.budget}
              onChangeText={set("budget")}
              placeholder="e.g. 50,000 – 100,000"
              placeholderTextColor={colors.muted}
              maxLength={500}
              returnKeyType="done"
            />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.submit, pressed && { opacity: 0.88 }]}
          onPress={handleSubmit}
          disabled={submitting}
          hitSlop={touch.hitSlop}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Send request</Text>
          )}
        </Pressable>

        <Text style={styles.footnote}>No payment is required at this stage.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: { marginBottom: spacing.md },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  lead: {
    marginTop: 10,
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
  },
  hint: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.accentMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  chips: { gap: 8, paddingBottom: spacing.md, paddingRight: spacing.page },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { fontSize: 13, color: colors.text, fontWeight: "500" },
  form: { gap: spacing.md, marginTop: spacing.sm },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: colors.text },
  req: { color: colors.danger },
  optional: { fontWeight: "500", color: colors.muted, fontSize: 13 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.page,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    minHeight: touch.minHeight,
  },
  textarea: { minHeight: 140, paddingTop: 14 },
  submit: {
    marginTop: spacing.xl,
    backgroundColor: colors.accent,
    paddingVertical: 17,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: touch.minHeight,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footnote: {
    marginTop: 14,
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 19,
  },
  successWrap: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.page,
    paddingTop: spacing.xl,
    justifyContent: "center",
  },
  successTitle: { fontSize: 24, fontWeight: "800", color: colors.text },
  successBody: { marginTop: 12, fontSize: 16, color: colors.muted, lineHeight: 24 },
  successActions: { marginTop: spacing.xl, gap: 12 },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: radius.lg,
    alignItems: "center",
    minHeight: touch.minHeight,
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    paddingVertical: 16,
    borderRadius: radius.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.accent,
    minHeight: touch.minHeight,
    justifyContent: "center",
  },
  secondaryBtnText: { color: colors.accent, fontSize: 16, fontWeight: "700" },
  textBtn: { alignItems: "center", paddingVertical: 12 },
  textBtnLabel: { color: colors.accentMuted, fontSize: 15, fontWeight: "600" },
});

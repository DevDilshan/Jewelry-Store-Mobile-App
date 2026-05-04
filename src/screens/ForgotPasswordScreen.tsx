import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput } from "react-native";
import { forgotCustomerPassword } from "../api/jewelryApi";
import { MobileScrollScreen } from "../components/MobileSafeScreen";
import type { AccountStackParamList } from "../navigation/types";
import { colors, spacing, touch } from "../theme";

type Props = NativeStackScreenProps<AccountStackParamList, "ForgotPassword">;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordScreen({ navigation }: Props) {
    const [email, setEmail] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        const em = email.trim();
        if (!em || !EMAIL_RE.test(em)) {
            Alert.alert("Email", "Enter a valid email address.");
            return;
        }
        setBusy(true);
        try {
            await forgotCustomerPassword(em);
            Alert.alert(
                "Check your email",
                "If an account exists, reset instructions have been sent (see server logs in development)."
            );
            navigation.goBack();
        } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "Request failed");
        } finally {
            setBusy(false);
        }
    };

    return (
        <MobileScrollScreen keyboard contentContainerStyle={styles.body}>
            <Text style={styles.title}>Forgot password</Text>
            <Text style={styles.lead}>
                We’ll send reset instructions if an account exists for that email (same API as the website).
            </Text>
            <Text style={styles.label}>Email</Text>
            <TextInput
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
            />
            <Pressable
                style={[styles.primary, busy && { opacity: 0.8 }]}
                onPress={submit}
                disabled={busy}
                hitSlop={touch.hitSlop}
            >
                <Text style={styles.primaryText}>{busy ? "Sending…" : "Send reset link"}</Text>
            </Pressable>
            <Pressable style={styles.link} onPress={() => navigation.navigate("Login")} hitSlop={touch.hitSlop}>
                <Text style={styles.linkText}>Back to sign in</Text>
            </Pressable>
        </MobileScrollScreen>
    );
}

const styles = StyleSheet.create({
    body: { paddingTop: spacing.sm },
    title: { fontSize: 24, fontWeight: "700", color: colors.text },
    lead: { marginTop: 12, fontSize: 15, color: colors.muted, lineHeight: 22 },
    label: { marginTop: 20, fontWeight: "600", color: colors.muted },
    input: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        padding: 14,
        backgroundColor: colors.surface,
        fontSize: 16,
        minHeight: touch.minHeight,
    },
    primary: {
        marginTop: 24,
        backgroundColor: colors.accent,
        paddingVertical: 16,
        minHeight: touch.minHeight,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    link: { marginTop: 20, alignItems: "center", paddingVertical: 8 },
    linkText: { color: colors.accent, fontWeight: "600" },
});

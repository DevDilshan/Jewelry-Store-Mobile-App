import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput } from "react-native";
import { ApiError } from "../api/client";
import { MobileScrollScreen } from "../components/MobileSafeScreen";
import { useAuth } from "../context/AuthContext";
import type { AccountStackParamList } from "../navigation/types";
import { colors, spacing, touch } from "../theme";

type Props = NativeStackScreenProps<AccountStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
    const { signIn } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);

    const onSubmit = async () => {
        setBusy(true);
        try {
            await signIn(email.trim(), password);
            navigation.navigate("Dashboard");
        } catch (e) {
            const msg =
                e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Sign in failed";
            Alert.alert("Sign in", msg);
        } finally {
            setBusy(false);
        }
    };

    return (
        <MobileScrollScreen keyboard contentContainerStyle={styles.body}>
            <Text style={[styles.label, styles.labelFirst]}>Email</Text>
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
                <Text style={styles.ctaText}>{busy ? "Signing in…" : "Sign in"}</Text>
            </Pressable>
            <Pressable style={styles.link} onPress={() => navigation.navigate("Register")} hitSlop={touch.hitSlop}>
                <Text style={styles.linkText}>Need an account? Register</Text>
            </Pressable>
            <Pressable style={styles.link} onPress={() => navigation.navigate("ForgotPassword")} hitSlop={touch.hitSlop}>
                <Text style={styles.linkText}>Forgot password?</Text>
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

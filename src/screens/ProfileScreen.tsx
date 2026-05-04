import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MobileSafeScreen, MobileScrollScreen } from "../components/MobileSafeScreen";
import { changeCustomerPassword, fetchCustomerMe, patchCustomerMe } from "../api/jewelryApi";
import { useAuth } from "../context/AuthContext";
import type { AccountStackParamList } from "../navigation/types";
import {
    getPasswordPolicyIssues,
    isPasswordPolicyValid,
    PASSWORD_REQUIREMENTS_HINT,
} from "../utils/passwordPolicy";
import { colors, spacing, touch } from "../theme";

type Props = NativeStackScreenProps<AccountStackParamList, "Profile">;

function splitFullName(full: string): { firstName: string; lastName: string } {
    const t = full.trim();
    if (!t) return { firstName: "", lastName: "" };
    const i = t.indexOf(" ");
    if (i === -1) return { firstName: t, lastName: "" };
    return { firstName: t.slice(0, i).trim(), lastName: t.slice(i + 1).trim() };
}

export function ProfileScreen({ navigation }: Props) {
    const { token, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        if (!token) {
            navigation.replace("Login");
            return;
        }
        setLoading(true);
        try {
            const data = await fetchCustomerMe(token);
            setFullName([data.firstName, data.lastName].filter(Boolean).join(" ").trim());
            setEmail(data.email);
            setPhone(data.phone || "");
            setAddress(data.address || "");
        } catch {
            Alert.alert("Error", "Could not load profile.");
        } finally {
            setLoading(false);
        }
    }, [token, navigation]);

    useEffect(() => {
        load();
    }, [load]);

    const saveProfile = async () => {
        if (!token) return;
        if (!email.trim() || !email.includes("@")) {
            Alert.alert("Profile", "Enter a valid email.");
            return;
        }
        const { firstName, lastName } = splitFullName(fullName);
        setBusy(true);
        try {
            await patchCustomerMe(token, {
                firstName,
                lastName,
                email: email.trim(),
                phone: phone.trim(),
                address: address.trim(),
            });
            await refreshProfile();
            Alert.alert("Saved", "Your profile was updated.");
        } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "Could not save.");
        } finally {
            setBusy(false);
        }
    };

    const savePassword = async () => {
        if (!token) return;
        if (!isPasswordPolicyValid(newPw)) {
            Alert.alert("Password", getPasswordPolicyIssues(newPw).join("\n") || PASSWORD_REQUIREMENTS_HINT);
            return;
        }
        if (newPw !== confirmPw) {
            Alert.alert("Password", "New password and confirmation do not match.");
            return;
        }
        setBusy(true);
        try {
            await changeCustomerPassword(token, { currentPassword: currentPw, newPassword: newPw });
            setCurrentPw("");
            setNewPw("");
            setConfirmPw("");
            Alert.alert("Saved", "Password updated.");
        } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "Could not update password.");
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <MobileSafeScreen>
                <View style={styles.centered}>
                    <ActivityIndicator color={colors.accent} />
                </View>
            </MobileSafeScreen>
        );
    }

    return (
        <MobileScrollScreen keyboard contentContainerStyle={styles.pad}>
            <Text style={styles.section}>Profile</Text>
            <Text style={styles.label}>Full name</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <Text style={styles.label}>Address</Text>
            <TextInput style={[styles.input, styles.tall]} multiline value={address} onChangeText={setAddress} />
            <Pressable
                style={[styles.primary, busy && { opacity: 0.8 }]}
                onPress={saveProfile}
                disabled={busy}
                hitSlop={touch.hitSlop}
            >
                <Text style={styles.primaryText}>Save profile</Text>
            </Pressable>

            <Text style={[styles.section, { marginTop: 32 }]}>Change password</Text>
            <Text style={styles.hint}>{PASSWORD_REQUIREMENTS_HINT}</Text>
            <Text style={styles.label}>Current password</Text>
            <TextInput style={styles.input} secureTextEntry value={currentPw} onChangeText={setCurrentPw} />
            <Text style={styles.label}>New password</Text>
            <TextInput style={styles.input} secureTextEntry value={newPw} onChangeText={setNewPw} />
            <Text style={styles.label}>Confirm new password</Text>
            <TextInput style={styles.input} secureTextEntry value={confirmPw} onChangeText={setConfirmPw} />
            <Pressable
                style={[styles.secondary, busy && { opacity: 0.8 }]}
                onPress={savePassword}
                disabled={busy}
                hitSlop={touch.hitSlop}
            >
                <Text style={styles.secondaryText}>Update password</Text>
            </Pressable>
        </MobileScrollScreen>
    );
}

const styles = StyleSheet.create({
    pad: { paddingTop: spacing.sm },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
    section: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 8 },
    label: { fontSize: 14, fontWeight: "600", color: colors.muted, marginTop: 12, marginBottom: 6 },
    hint: { fontSize: 13, color: colors.muted, marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        padding: 14,
        backgroundColor: colors.surface,
        fontSize: 16,
        minHeight: touch.minHeight,
    },
    tall: { minHeight: 100, textAlignVertical: "top", paddingTop: 14 },
    primary: {
        marginTop: 20,
        backgroundColor: colors.accent,
        paddingVertical: 16,
        minHeight: touch.minHeight,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    secondary: {
        marginTop: 12,
        paddingVertical: 16,
        minHeight: touch.minHeight,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.accent,
    },
    secondaryText: { color: colors.accent, fontWeight: "700", fontSize: 16 },
});

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { staffCreateDiscount, staffUpdateDiscount } from "../../api/staffApi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import type { StaffStackParamList } from "../../navigation/types";
import { colors, spacing, touch } from "../../theme";

function StaffDiscountEditorScreen() {
 
return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Campaign name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text style={styles.label}>Theme (optional)</Text>
      <TextInput style={styles.input} value={theme} onChangeText={setTheme} />
      <Text style={styles.label}>Scope</Text>
      <View style={styles.chips}>
        {(["coupon", "site_wide"] as const).map((s) => (
          <Pressable key={s} style={[styles.chip, scope === s && styles.chipOn]} onPress={() => setScope(s)}>
            <Text style={[styles.chipText, scope === s && styles.chipTextOn]}>{s === "coupon" ? "Coupon" : "Site-wide"}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Type</Text>
      <View style={styles.chips}>
        {(["percentage", "fixed"] as const).map((t) => (
          <Pressable key={t} style={[styles.chip, dtype === t && styles.chipOn]} onPress={() => setDtype(t)}>
            <Text style={[styles.chipText, dtype === t && styles.chipTextOn]}>{t === "percentage" ? "%" : "Fixed LKR"}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>{dtype === "percentage" ? "Percent off" : "Amount (LKR)"}</Text>
      <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      {scope === "coupon" ? (
        <>
          <Text style={styles.label}>Promo code</Text>
          <TextInput
            style={[styles.input, editing && { opacity: 0.6 }]}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            editable={!editing}
          />
          {editing ? <Text style={styles.hint}>Code cannot be changed after creation.</Text> : null}
          <Text style={styles.label}>Min subtotal LKR (optional)</Text>
          <TextInput style={styles.input} value={minSub} onChangeText={setMinSub} keyboardType="decimal-pad" />
          <Text style={styles.label}>Max uses (optional)</Text>
          <TextInput style={styles.input} value={maxUses} onChangeText={setMaxUses} keyboardType="number-pad" />
        </>
      ) : (
        <Text style={styles.hint}>Site-wide promos get an auto-generated internal code on create.</Text>
      )}
      <Text style={styles.label}>Start date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={start} onChangeText={setStart} placeholder="optional" />
      <Text style={styles.label}>End date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={end} onChangeText={setEnd} placeholder="optional" />
      <Pressable style={[styles.cta, busy && { opacity: 0.75 }]} onPress={save} disabled={busy}>
        <Text style={styles.ctaText}>{busy ? "Saving…" : editing ? "Save" : "Create"}</Text>
      </Pressable>
    </ScrollView>
  );
}


export default StaffDiscountEditorScreen
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useStaffAuth } from "../../context/StaffAuthContext";
import { navigateToCustomerTabs, signOutStaffAndReturnToAccount } from "../../navigation/navigationHelpers";
import type { StaffStackParamList } from "../../navigation/types";
import {
  staffCanEditPortfolios,
  staffCanManageDiscounts,
  staffCanManageOrders,
  staffCanManageProducts,
  staffCanManageTeam,
  staffCanViewCustomDesignRequests,
  staffCanViewPortfolios,
} from "../../utils/staffRoles";
import { colors, spacing, touch } from "../../theme";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffHome">;

type StaffMenuTarget =
  | "StaffProducts"
  | "StaffDiscounts"
  | "StaffPortfolios"
  | "StaffCustomDesignRequests"
  | "StaffTeam"
  | "StaffFeedback"
  | "StaffOrders";

type MenuItem = { title: string; sub: string; screen: StaffMenuTarget };

const ALL_ITEMS: MenuItem[] = [
  { title: "Products", sub: "Add, edit, stock", screen: "StaffProducts" },
  { title: "Discounts", sub: "Coupons & site-wide", screen: "StaffDiscounts" },
  { title: "Designer portfolios", sub: "Publish & copy", screen: "StaffPortfolios" },
  { title: "Custom designs", sub: "Guest inquiries & sketches", screen: "StaffCustomDesignRequests" },
  { title: "Team", sub: "Staff accounts (admin)", screen: "StaffTeam" },
  { title: "Customer feedback", sub: "Reviews & replies", screen: "StaffFeedback" },
  { title: "Orders", sub: "All store orders", screen: "StaffOrders" },
];

function filterItems(role: string): MenuItem[] {
  return ALL_ITEMS.filter((row) => {
    if (row.screen === "StaffProducts") return staffCanManageProducts(role);
    if (row.screen === "StaffDiscounts") return staffCanManageDiscounts(role);
    if (row.screen === "StaffPortfolios") return staffCanViewPortfolios(role);
    if (row.screen === "StaffCustomDesignRequests") return staffCanViewCustomDesignRequests(role);
    if (row.screen === "StaffTeam") return staffCanManageTeam(role);
    if (row.screen === "StaffFeedback") return true;
    if (row.screen === "StaffOrders") return staffCanManageOrders(role);
    return false;
  });
}

function goStaffHome(
  navigation: Props["navigation"],
  screen: StaffMenuTarget
) {
  switch (screen) {
    case "StaffProducts":
      navigation.navigate("StaffProducts");
      break;
    case "StaffDiscounts":
      navigation.navigate("StaffDiscounts");
      break;
    case "StaffPortfolios":
      navigation.navigate("StaffPortfolios");
      break;
    case "StaffCustomDesignRequests":
      navigation.navigate("StaffCustomDesignRequests");
      break;
    case "StaffTeam":
      navigation.navigate("StaffTeam");
      break;
    case "StaffFeedback":
      navigation.navigate("StaffFeedback");
      break;
    case "StaffOrders":
      navigation.navigate("StaffOrders");
      break;
  }
}

export function StaffHomeScreen({ navigation }: Props) {
  const { staff, signOutStaff } = useStaffAuth();
  const role = staff?.role ?? "viewer";
  const items = filterItems(role);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.pad}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.kicker}>Staff workspace</Text>
      <Text style={styles.title}>
        {staff ? [staff.firstName, staff.lastName].filter(Boolean).join(" ").trim() || staff.username : "Staff"}
      </Text>
      <Text style={styles.meta}>
        {staff?.email} · {role}
        {staffCanEditPortfolios(role) ? "" : " · Portfolio editing: view only"}
      </Text>

      <View style={styles.menu}>
        {items.map((row) => (
          <Pressable
            key={row.screen}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
            onPress={() => goStaffHome(navigation, row.screen)}
            hitSlop={touch.hitSlop}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowSub}>{row.sub}</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.secondary} onPress={() => navigateToCustomerTabs(navigation)} hitSlop={touch.hitSlop}>
        <Text style={styles.secondaryText}>Back to customer app</Text>
      </Pressable>

      <Pressable
        style={styles.danger}
        onPress={() => signOutStaffAndReturnToAccount(navigation, signOutStaff)}
        hitSlop={touch.hitSlop}
      >
        <Text style={styles.dangerText}>Sign out staff</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.page, paddingBottom: spacing.xl },
  kicker: { fontSize: 13, fontWeight: "600", color: colors.accentMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  title: { marginTop: 6, fontSize: 24, fontWeight: "700", color: colors.text },
  meta: { marginTop: 8, fontSize: 15, color: colors.muted, lineHeight: 22 },
  menu: { marginTop: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: spacing.page,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: touch.minHeight,
  },
  rowTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  rowSub: { marginTop: 4, fontSize: 13, color: colors.muted },
  chev: { fontSize: 22, color: colors.muted },
  secondary: {
    marginTop: 28,
    paddingVertical: 16,
    minHeight: touch.minHeight,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.accent,
  },
  secondaryText: { color: colors.accent, fontWeight: "700", fontSize: 16 },
  danger: { marginTop: 12, alignItems: "center", padding: 14 },
  dangerText: { color: colors.danger, fontWeight: "700" },
});

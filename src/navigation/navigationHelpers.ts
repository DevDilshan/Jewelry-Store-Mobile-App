import { CommonActions } from "@react-navigation/native";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

type AnyNav = NavigationProp<ParamListBase>;

/**
 * Walks up until we find the root native stack that hosts both `CustomerTabs` and `StaffWorkspace`.
 * Account flows sit under Tab (two hops); staff screens sit directly under root (one hop), so a
 * fixed `getParent().getParent()` breaks "back to customer" from the staff modal.
 */
function getRootStackNavigation(navigation: AnyNav): AnyNav | undefined {
  let current: AnyNav | undefined = navigation;
  for (let i = 0; i < 8 && current; i++) {
    const names = current.getState?.().routeNames;
    if (names?.includes("CustomerTabs") && names?.includes("StaffWorkspace")) {
      return current;
    }
    current = current.getParent() as AnyNav | undefined;
  }
  return undefined;
}

export function navigateToStaffWorkspace(navigation: AnyNav) {
  const root = getRootStackNavigation(navigation);
  (root as { navigate: (n: keyof RootStackParamList) => void } | undefined)?.navigate("StaffWorkspace");
}

/**
 * Leave the staff modal and land on the customer Home tab — no modal-dismiss animation.
 * Uses reset() so the root stack becomes [CustomerTabs] with no StaffWorkspace entry.
 */
export function navigateToCustomerTabs(navigation: AnyNav) {
  const root = getRootStackNavigation(navigation);
  root?.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: "CustomerTabs" }],
    })
  );
}

/**
 * Leave the staff modal (or Account stack) and land on Account → Dashboard.
 * Uses reset() so the root stack becomes [CustomerTabs] — no slide-down popup.
 */
export function navigateToCustomerAccountDashboard(navigation: AnyNav) {
  const root = getRootStackNavigation(navigation);
  root?.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: "CustomerTabs",
          params: { screen: "Account", params: { screen: "Dashboard" } },
        },
      ],
    })
  );
}

/** Clears staff credentials then hard-navigates to Account Dashboard (no modal popup). */
export async function signOutStaffAndReturnToAccount(
  navigation: AnyNav,
  signOutStaff: () => Promise<void>
): Promise<void> {
  await signOutStaff();
  navigateToCustomerAccountDashboard(navigation);
}

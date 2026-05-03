import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { StaffStackParamList } from "./types";
import { colors } from "../theme";
import { StaffHomeScreen } from "../screens/staff/StaffHomeScreen";
import { StaffProductsScreen } from "../screens/staff/StaffProductsScreen";
import { StaffProductEditorScreen } from "../screens/staff/StaffProductEditorScreen";
import { StaffDiscountsScreen } from "../screens/staff/StaffDiscountsScreen";
import { StaffDiscountEditorScreen } from "../screens/staff/StaffDiscountEditorScreen";
import { StaffPortfoliosScreen } from "../screens/staff/StaffPortfoliosScreen";
import { StaffPortfolioCreateScreen } from "../screens/staff/StaffPortfolioCreateScreen";
import { StaffPortfolioEditorScreen } from "../screens/staff/StaffPortfolioEditorScreen";
import { StaffTeamScreen } from "../screens/staff/StaffTeamScreen";
import { StaffFeedbackScreen } from "../screens/staff/StaffFeedbackScreen";
import { StaffFeedbackDetailScreen } from "../screens/staff/StaffFeedbackDetailScreen";
import { StaffOrdersScreen } from "../screens/staff/StaffOrdersScreen";
import { StaffOrderDetailScreen } from "../screens/staff/StaffOrderDetailScreen";
import { StaffCustomDesignRequestsScreen } from "../screens/staff/StaffCustomDesignRequestsScreen";

const Stack = createNativeStackNavigator<StaffStackParamList>();

const headerOpts = {
  headerTintColor: colors.accent,
  headerStyle: { backgroundColor: colors.surface },
  contentStyle: { backgroundColor: colors.bg },
};

export function StaffNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="StaffHome"
      screenOptions={{
        ...headerOpts,
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen name="StaffHome" component={StaffHomeScreen} options={{ title: "Staff" }} />
      <Stack.Screen name="StaffProducts" component={StaffProductsScreen} options={{ title: "Products" }} />
      <Stack.Screen name="StaffProductEditor" component={StaffProductEditorScreen} options={{ title: "Product" }} />
      <Stack.Screen name="StaffDiscounts" component={StaffDiscountsScreen} options={{ title: "Discounts" }} />
      <Stack.Screen name="StaffDiscountEditor" component={StaffDiscountEditorScreen} options={{ title: "Discount" }} />
      <Stack.Screen name="StaffPortfolios" component={StaffPortfoliosScreen} options={{ title: "Portfolios" }} />
      <Stack.Screen name="StaffPortfolioCreate" component={StaffPortfolioCreateScreen} options={{ title: "New portfolio" }} />
      <Stack.Screen name="StaffPortfolioEditor" component={StaffPortfolioEditorScreen} options={{ title: "Portfolio" }} />
      <Stack.Screen name="StaffTeam" component={StaffTeamScreen} options={{ title: "Team" }} />
      <Stack.Screen name="StaffFeedback" component={StaffFeedbackScreen} options={{ title: "Feedback" }} />
      <Stack.Screen name="StaffFeedbackDetail" component={StaffFeedbackDetailScreen} options={{ title: "Review" }} />
      <Stack.Screen name="StaffOrders" component={StaffOrdersScreen} options={{ title: "Orders" }} />
      <Stack.Screen name="StaffOrderDetail" component={StaffOrderDetailScreen} options={{ title: "Order" }} />
      <Stack.Screen
        name="StaffCustomDesignRequests"
        component={StaffCustomDesignRequestsScreen}
        options={{ title: "Custom designs" }}
      />
    </Stack.Navigator>
  );
}

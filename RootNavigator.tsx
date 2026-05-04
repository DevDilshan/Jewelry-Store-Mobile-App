import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { colors } from "../theme";
import type {
  AccountStackParamList,
  CartStackParamList,
  HomeStackParamList,
  RootStackParamList,
  RootTabParamList,
  ShopStackParamList,
} from "./types";
import { StaffNavigator } from "./StaffNavigator";
import { HomeScreen } from "../screens/HomeScreen";
import { ProductListScreen } from "../screens/ProductListScreen";
import { ProductDetailScreen } from "../screens/ProductDetailScreen";
import { DesignerListScreen } from "../screens/DesignerListScreen";
import { DesignerDetailScreen } from "../screens/DesignerDetailScreen";
import { CustomDesignScreen } from "../screens/CustomDesignScreen";
import { CartScreen } from "../screens/CartScreen";
import { CheckoutScreen } from "../screens/CheckoutScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { OrdersScreen } from "../screens/OrdersScreen";
import { OrderDetailScreen } from "../screens/OrderDetailScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { FeedbackScreen } from "../screens/FeedbackScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";
import { StaffLoginScreen } from "../screens/StaffLoginScreen";

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ShopStack = createNativeStackNavigator<ShopStackParamList>();
const CartStack = createNativeStackNavigator<CartStackParamList>();
const AccountStack = createNativeStackNavigator<AccountStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

const headerOpts = {
  headerTintColor: colors.accent,
  headerStyle: { backgroundColor: colors.surface },
  contentStyle: { backgroundColor: colors.bg },
};

function HomeNavigator() {
  return (
    <HomeStack.Navigator initialRouteName="Home" screenOptions={headerOpts}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
    </HomeStack.Navigator>
  );
}


function ShopNavigator() {
  return (
    <ShopStack.Navigator initialRouteName="ProductList" screenOptions={headerOpts}>
      <ShopStack.Screen name="ProductList" component={ProductListScreen} options={{ title: "Shop" }} />
      <ShopStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "Product" }} />
      <ShopStack.Screen name="DesignerList" component={DesignerListScreen} options={{ title: "Our Designers" }} />
      <ShopStack.Screen name="DesignerDetail" component={DesignerDetailScreen} options={{ title: "Portfolio" }} />
      <ShopStack.Screen name="CustomDesign" component={CustomDesignScreen} options={{ title: "Custom Design" }} />
    </ShopStack.Navigator>
  );
}

function CartNavigator() {
  return (
    <CartStack.Navigator screenOptions={headerOpts}>
      <CartStack.Screen name="CartMain" component={CartScreen} options={{ title: "Your Cart" }} />
      <CartStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Checkout" }} />
    </CartStack.Navigator>
  );
}

function AccountNavigator() {
  return (
    <AccountStack.Navigator initialRouteName="Dashboard" screenOptions={headerOpts}>
      <AccountStack.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Account" }} />
      <AccountStack.Screen name="Login" component={LoginScreen} options={{ title: "Sign in" }} />
      <AccountStack.Screen name="Register" component={RegisterScreen} options={{ title: "Create account" }} />
      <AccountStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: "Forgot password" }} />
      <AccountStack.Screen name="StaffLogin" component={StaffLoginScreen} options={{ title: "Staff sign in" }} />
      <AccountStack.Screen name="Orders" component={OrdersScreen} options={{ title: "My orders" }} />
      <AccountStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: "Order" }} />
      <AccountStack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
      <AccountStack.Screen name="Feedback" component={FeedbackScreen} options={{ title: "My reviews" }} />
    </AccountStack.Navigator>
  );
}

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_ICONS: Record<string, [IoniconName, IoniconName]> = {
  Home: ["home", "home-outline"],
  Shop: ["diamond", "diamond-outline"],
  Cart: ["bag-handle", "bag-handle-outline"],
  Account: ["person-circle", "person-circle-outline"],
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const pair = TAB_ICONS[name] ?? ["ellipse", "ellipse-outline"];
  const iconName = focused ? pair[0] : pair[1];
  return <Ionicons name={iconName} size={24} color={focused ? colors.accent : colors.muted} />;
}

function CustomerTabNavigator() {
  const { lines } = useCart();
  const cartCount = lines.reduce((a, l) => a + l.quantity, 0);
  const insets = useSafeAreaInsets();
  const tabBarInsetBottom = 8 + insets.bottom;
  const tabBarHeight = 60 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: tabBarHeight,
          paddingBottom: tabBarInsetBottom,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeNavigator} options={{ title: "Home" }} />
      <Tab.Screen
        name="Shop"
        component={ShopNavigator}
        options={{ title: "Shop" }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate("Shop", { screen: "ProductList", params: undefined });
          },
        })}
      />
      <Tab.Screen
        name="Cart"
        component={CartNavigator}
        options={{
          title: "Cart",
          tabBarBadge: cartCount > 0 ? Math.min(cartCount, 99) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, fontSize: 10, minWidth: 17, height: 17 },
        }}
      />
      <Tab.Screen name="Account" component={AccountNavigator} options={{ title: "Account" }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  // temp: trigger git diff for PR
  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="CustomerTabs" component={CustomerTabNavigator} />
        <RootStack.Screen
          name="StaffWorkspace"
          component={StaffNavigator}
          options={{ presentation: "fullScreenModal" }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}





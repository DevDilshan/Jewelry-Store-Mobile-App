import { useFocusEffect, type NavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { BackHandler, Platform, Pressable, Text } from "react-native";
import type { RootTabParamList, ShopStackParamList } from "./types";
import { colors } from "../theme";

/**
 * When a Shop-stack screen was opened from the Home tab (`fromHome: true`),
 * header back, iOS swipe-back, and Android hardware back return to Home instead of Shop’s list root.
 */
export function useShopDetailReturnToHome(
  navigation: NativeStackNavigationProp<ShopStackParamList>,
  fromHome?: boolean
) {
  const bypassBeforeRemoveRef = useRef(false);
  const returnFlowRef = useRef(false);

  const returnToHome = useCallback(() => {
    if (returnFlowRef.current) return;
    returnFlowRef.current = true;
    bypassBeforeRemoveRef.current = true;
    try {
      navigation.popToTop();
    } catch {
      /* stack may be a single screen */
    }
    const tab = navigation.getParent() as NavigationProp<RootTabParamList> | undefined;
    tab?.navigate("Home", { screen: "Home" });
    queueMicrotask(() => {
      bypassBeforeRemoveRef.current = false;
      returnFlowRef.current = false;
    });
  }, [navigation]);

  useEffect(() => {
    if (!fromHome) return undefined;
    return navigation.addListener("beforeRemove", (e) => {
      if (bypassBeforeRemoveRef.current) return;
      const t = (e.data as { action?: { type?: string } })?.action?.type;
      if (t !== "POP" && t !== "GO_BACK") return;
      e.preventDefault();
      returnToHome();
    });
  }, [navigation, fromHome, returnToHome]);

  useLayoutEffect(() => {
    if (!fromHome) return;
    navigation.setOptions({
      headerLeft: () => (
        <Pressable
          onPress={returnToHome}
          hitSlop={12}
          style={{
            paddingVertical: 8,
            paddingHorizontal: Platform.OS === "ios" ? 4 : 8,
            marginLeft: Platform.OS === "ios" ? 4 : 0,
          }}
        >
          <Text style={{ color: colors.accent, fontSize: 17, fontWeight: "600" }}>‹ Home</Text>
        </Pressable>
      ),
    });
    return () => {
      navigation.setOptions({ headerLeft: undefined });
    };
  }, [navigation, fromHome, returnToHome]);

  useFocusEffect(
    useCallback(() => {
      if (!fromHome) return undefined;
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        returnToHome();
        return true;
      });
      return () => sub.remove();
    }, [fromHome, returnToHome])
  );
}

import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { keyboardOffset, spacing } from "../theme";

type Props = {
  children: ReactNode;
  /** Wrap body in KeyboardAvoidingView (auth, checkout, profile, forms) */
  keyboard?: boolean;
  style?: ViewStyle;
};

/**
 * Safe areas for notched phones + home indicator; optional keyboard avoidance for forms.
 * Top inset is usually handled by the stack header — we pad left, right, bottom.
 */
export function MobileSafeScreen({ children, keyboard, style }: Props) {
  const body = (
    <SafeAreaView style={[styles.safe, style]} edges={["left", "right", "bottom"]}>
      {children}
    </SafeAreaView>
  );

  if (keyboard) {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={keyboardOffset}
      >
        {body}
      </KeyboardAvoidingView>
    );
  }

  return body;
}

type ScrollProps = Props & {
  scrollProps?: Omit<ScrollViewProps, "children" | "style">;
  contentContainerStyle?: ViewStyle;
};

export function MobileScrollScreen({ children, keyboard, scrollProps, contentContainerStyle, style }: ScrollProps) {
  const { contentContainerStyle: scrollContentExtra, ...restScroll } = scrollProps ?? {};
  return (
    <MobileSafeScreen keyboard={keyboard} style={style}>
      <ScrollView
        {...restScroll}
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle, scrollContentExtra]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </MobileSafeScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
});

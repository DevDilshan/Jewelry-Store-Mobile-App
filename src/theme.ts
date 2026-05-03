import { Platform } from "react-native";

export const colors = {
  bg: "#faf8f5",
  surface: "#ffffff",
  text: "#1c1917",
  muted: "#78716c",
  accent: "#9a3412",
  accentMuted: "#c2410c",
  border: "#e7e5e4",
  danger: "#b91c1c",
};

/** Consistent spacing for small screens */
export const spacing = {
  xs: 6,
  sm: 10,
  page: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
};

/** Minimum touch target (Apple HIG ~44pt) */
export const touch = {
  minHeight: 48,
  minWidth: 48,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 } as const,
};

/** iOS header + status bar — rough offset for KeyboardAvoidingView under stack */
export const keyboardOffset = Platform.select({ ios: 88, android: 0, default: 0 });

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { LightColors, DarkColors, Spacing, Typography } from "~/styles";
import { useAppTheme } from "~/components/theme/AppThemeContext";

type AppHeaderProps = {
  title: string;
  onMenuPress?: () => void;
  rightElement?: React.ReactNode;
  showBack?: boolean;
  /** Hide the left menu/back button entirely */
  hideMenu?: boolean;
};

export function AppHeader({ title, onMenuPress, rightElement, showBack, hideMenu }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const router = useRouter();

  const colors = mode === "dark" ? DarkColors : LightColors;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.sm,
          backgroundColor: colors.header,
        },
      ]}
    >
      {!hideMenu && (
        <Pressable
          onPress={showBack ? () => router.back() : onMenuPress}
          hitSlop={10}
          style={styles.menuButton}
        >
          <Ionicons
            name={showBack ? "chevron-back" : "menu-outline"}
            size={24}
            color={colors.headerForeground}
          />
        </Pressable>
      )}

      <Text style={[styles.title, { color: colors.headerForeground, flex: 1 }]}>
        {title}
      </Text>

      {rightElement}
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: Spacing.sm,
  },

  menuButton: {
    padding: Spacing.sm,
  },

  title: {
    ...Typography.h1,
  },
});
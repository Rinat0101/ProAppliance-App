import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import {
  LightColors,
  DarkColors,
  Spacing,
  Radius,
  Typography,
} from "~/styles";

type ScheduleEmptyStateProps = {
  onGoToToday: () => void;
};

export function ScheduleEmptyState({
  onGoToToday,
}: ScheduleEmptyStateProps) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.divider,
        },
      ]}
    >
      <Ionicons
        name="calendar-outline"
        size={56}
        color={colors.textTertiary}
        style={styles.icon}
      />

      <Text
        style={[
          styles.title,
          { color: colors.textPrimary },
        ]}
      >
        Nothing planned for this day
      </Text>

      <Pressable
        style={[
          styles.button,
          { backgroundColor: colors.accent },
        ]}
        onPress={onGoToToday}
      >
        <Text style={styles.buttonText}>Go to Today</Text>
      </Pressable>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    marginBottom: Spacing.md,
    opacity: 0.25,
  },

  title: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: Spacing.md,
    textAlign: "center",
  },

  button: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
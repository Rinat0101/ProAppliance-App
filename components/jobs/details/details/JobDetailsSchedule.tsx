import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { LightColors, DarkColors, Spacing, Typography, Radius } from "~/styles";

type Props = {
  /** Example: Tue, Jan 6th */
  dateLabel: string;

  /** Example: 10:30 AM */
  startTime: string;

  /** Example: 11:30 AM */
  endTime: string;

  /** Optional press (edit later) */
  onPress?: () => void;
};

export function JobDetailsSchedule({
  dateLabel,
  startTime,
  endTime,
  onPress,
}: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      {/* ---------- HEADER ---------- */}
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Schedule
      </Text>

      {/* ---------- CONTENT ---------- */}
      <View style={styles.row}>
        <Ionicons
          name="calendar-outline"
          size={20}
          color={colors.textSecondary}
        />

        <Text style={[styles.value, { color: colors.textPrimary }]}>
          {dateLabel} {startTime} – {endTime}
        </Text>
      </View>
    </Pressable>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },

  title: {
    ...Typography.sectionTitle,
    marginBottom: Spacing.sm,
    fontWeight: "700",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },

  value: {
    ...Typography.body
  },
});
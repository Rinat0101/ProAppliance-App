import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { LightColors, DarkColors, Spacing, Radius } from "~/styles";

type ViewMode = "timeline" | "day";

type Props = {
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  rightSlot?: React.ReactNode;
};

export function ScheduleControlsHeader({ viewMode, onChangeViewMode, rightSlot }: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      {/* View toggle */}
      <View style={[styles.toggle, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        {(["timeline", "day"] as const).map((m) => {
          const active = viewMode === m;
          return (
            <Pressable
              key={m}
              onPress={() => onChangeViewMode(m)}
              style={[
                styles.toggleBtn,
                active && {
                  backgroundColor: colors.surface,
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 2,
                },
              ]}
            >
              <Text style={[styles.toggleText, { color: active ? colors.textPrimary : colors.textSecondary }]}>
                {m === "timeline" ? "Timeline" : "Day"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {rightSlot ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  toggle: {
    flexDirection: "row",
    borderRadius: Radius.full,
    padding: 3,
    borderWidth: 1,
  },
  toggleBtn: {
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderRadius: Radius.full,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

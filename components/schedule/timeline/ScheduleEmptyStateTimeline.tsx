import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { LightColors, DarkColors, Spacing, Radius, Typography } from "~/styles";

type Props = {
  label?: string;
};

export function ScheduleEmptyStateTimeline({
  label = "No jobs scheduled",
}: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const STRIPE_W = 18;
  const STRIPE_GAP = 14;

  const stripes = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => i);
  }, []);

  const baseBg = mode === "dark" ? colors.muted : "#ECEECEF";
  const stripeColor =
    mode === "dark"
      ? "rgba(255,255,255,0.06)"
      : "rgba(255,255,255,0.55)";

  return (
    <View style={styles.pill}>
      {/* STRIPES */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={styles.stripeSheet}>
          {stripes.map((i) => (
            <View
              key={i}
              style={[
                styles.stripe,
                {
                  backgroundColor: stripeColor,
                  left: i * (STRIPE_W + STRIPE_GAP),
                  width: STRIPE_W,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* TEXT */}
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  pill: {
    width: "100%",                 // ✅ FULL WIDTH
    minHeight: 52,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#ECEDEE",     // overridden dynamically if needed
  },

  stripeSheet: {
    position: "absolute",
    top: -40,
    bottom: -40,
    left: -80,
    right: -80,
    transform: [{ rotate: "-18deg" }],
  },

  stripe: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRadius: 6,
  },

  text: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: "600",
    fontStyle: "italic",
  },
});
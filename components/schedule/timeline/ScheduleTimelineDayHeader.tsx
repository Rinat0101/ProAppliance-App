import { View, Text, StyleSheet } from "react-native";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import {
  LightColors,
  DarkColors,
  Spacing,
  Typography,
} from "~/styles";

type Props = {
  date: Date;
  isToday: boolean;
};

export function ScheduleTimelineDayHeader({ date, isToday }: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const dayName = date.toLocaleDateString("en-US", {
    weekday: "short",
  });

  const dayNumber = date.getDate();

  return (
    <View style={styles.wrapper}>
      <View style={styles.left}>
        <Text
          style={[
            styles.dayText,
            { color: colors.textSecondary },
          ]}
        >
          {dayName}
        </Text>

        <View
          style={[
            styles.dayCircle,
            isToday && { backgroundColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.dayNumber,
              {
                color: isToday
                  ? "#FFF"
                  : colors.textPrimary,
              },
            ]}
          >
            {dayNumber}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.divider,
          { backgroundColor: colors.border },
        ]}
      />
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },

  dayText: {
    fontSize: 12,
    fontWeight: "600",
  },

  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  dayNumber: {
    fontSize: 14,
    fontWeight: "700",
  },

  divider: {
    height: 1,
    width: "100%",
    opacity: 0.4,
  },
});
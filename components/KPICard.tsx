import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "~/components/theme/AppThemeContext";
import { LightColors, DarkColors } from "~/styles";

type Trend = {
  value: string;
  positive: boolean;
};

interface KPICardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  trend?: Trend;
}

export function KPICard({ title, value, icon, trend }: KPICardProps) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: mode === "light" ? colors.border : "transparent",
        },
      ]}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.title, { color: colors.textSecondary }]}>
            {title}
          </Text>

          <Text style={[styles.value, { color: colors.textPrimary }]}>
            {value}
          </Text>
        </View>

        <Ionicons name={icon} size={22} color={colors.textSecondary} />
      </View>

      {/* Trend */}
      {trend && (
        <Text
          style={[
            styles.trendText,
            {
              color: trend.positive ? colors.success : colors.destructive,
            },
          ]}
        >
          {trend.positive ? "↑" : "↓"} {trend.value}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "47%",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  title: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  value: {
    fontSize: 22,
    fontWeight: "700",
  },

  trendText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
  },
});

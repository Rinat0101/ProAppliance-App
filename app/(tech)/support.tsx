/**
 * Support / Helpdesk screen — department list.
 * Tap a department → see ticket threads for that dept.
 */
import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { AppHeader } from "~/components/layout/AppHeader";
import { LightColors, DarkColors, Spacing, Radius } from "~/styles";
import { DEPARTMENTS } from "~/components/team/TeamContacts";
import { mockSupportTickets } from "~/data/mockData";

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;
  const router = useRouter();

  // Aggregate per-dept unread + open counts
  const deptStats = React.useMemo(() => {
    const stats: Record<string, { open: number; unread: number }> = {};
    for (const t of mockSupportTickets) {
      if (!stats[t.deptId]) stats[t.deptId] = { open: 0, unread: 0 };
      if (t.status === "open") stats[t.deptId].open += 1;
      stats[t.deptId].unread += t.unreadCount;
    }
    return stats;
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Support" hideMenu />

      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: 32 + insets.bottom }]}>
        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          Select a department to view or open a support request
        </Text>

        {DEPARTMENTS.map((dept) => {
          const stats = deptStats[dept.id];
          const hasOpen   = stats && stats.open > 0;
          const hasUnread = stats && stats.unread > 0;

          return (
            <Pressable
              key={dept.id}
              onPress={() => router.push({ pathname: "/support/[deptId]", params: { deptId: dept.id, name: dept.name, color: dept.color } })}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.surface, borderColor: hasOpen ? dept.color + "55" : colors.border },
                pressed && { opacity: 0.75 },
              ]}
            >
              {/* Icon */}
              <View style={[styles.iconWrap, { backgroundColor: dept.color + "18" }]}>
                <Ionicons name={dept.icon} size={22} color={dept.color} />
              </View>

              {/* Info */}
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>{dept.name}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {dept.subtitle}
                </Text>
                {hasOpen && (
                  <Text style={[styles.openLabel, { color: dept.color }]}>
                    {stats.open} open {stats.open === 1 ? "request" : "requests"}
                  </Text>
                )}
              </View>

              {/* Unread badge OR chevron */}
              {hasUnread ? (
                <View style={[styles.badge, { backgroundColor: dept.color }]}>
                  <Text style={styles.badgeText}>{stats.unread > 9 ? "9+" : stats.unread}</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm },
  hint: { fontSize: 13, marginBottom: Spacing.sm },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  iconWrap: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: "700" },
  subtitle: { fontSize: 13 },
  openLabel: { fontSize: 12, fontWeight: "600", marginTop: 1 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 6, flexShrink: 0 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});

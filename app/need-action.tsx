import { useMemo } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { AppHeader } from "~/components/layout/AppHeader";
import { LightColors, DarkColors, Spacing, Radius } from "~/styles";
import {
  useActionItems,
  ActionType,
  ActionItem,
  ACTION_CONFIG,
} from "~/components/notifications/NeedActionPanel";

const TYPE_ORDER: ActionType[] = [
  "collect_payment",
  "fill_estimate",
  "estimate_follow_up",
  "upload_photos",
];

export default function NeedActionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const items = useActionItems();

  const byType = useMemo(() => {
    const map: Partial<Record<ActionType, ActionItem[]>> = {};
    for (const item of items) {
      if (!map[item.type]) map[item.type] = [];
      map[item.type]!.push(item);
    }
    return map;
  }, [items]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Need Action" hideMenu />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
      >
        {items.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "18" }]}>
              <Ionicons name="checkmark-circle-outline" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>All caught up!</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No actions required right now.
            </Text>
          </View>
        ) : (
          TYPE_ORDER.map((type) => {
            const group = byType[type];
            if (!group?.length) return null;
            const cfg = ACTION_CONFIG[type];
            return (
              <View key={type} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconWrap, { backgroundColor: cfg.color + "18" }]}>
                    <Ionicons name={cfg.icon} size={15} color={cfg.color} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    {cfg.label}
                  </Text>
                  <View style={[styles.sectionBadge, { backgroundColor: cfg.color }]}>
                    <Text style={styles.sectionBadgeText}>{group.length}</Text>
                  </View>
                </View>

                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {group.map((item, i) => (
                    <View key={`${item.jobId}-${item.type}`}>
                      {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                      <ActionRow
                        item={item}
                        colors={colors}
                        onPress={() => router.push(`/jobs/${item.jobId}` as any)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function ActionRow({
  item,
  colors,
  onPress,
}: {
  item: ActionItem;
  colors: typeof LightColors | typeof DarkColors;
  onPress: () => void;
}) {
  const cfg = ACTION_CONFIG[item.type];

  const dateLabel = useMemo(() => {
    const [y, m, d] = item.scheduledDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === -1) return "Yesterday";
    if (diff === 1) return "Tomorrow";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, [item.scheduledDate]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.jobTitle}
          </Text>
          <Text style={[styles.rowDate, { color: colors.textTertiary }]}>{dateLabel}</Text>
        </View>
        <Text style={[styles.rowDesc, { color: colors.textSecondary }]} numberOfLines={1}>
          {cfg.description(item)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  empty: {
    alignItems: "center",
    gap: Spacing.md,
    paddingTop: 80,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center" },

  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 2,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", flex: 1 },
  sectionBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  sectionBadgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  card: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  divider: { height: 1, marginHorizontal: Spacing.md },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  rowContent: { flex: 1, gap: 3 },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  rowTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  rowDate: { fontSize: 12, flexShrink: 0 },
  rowDesc: { fontSize: 13 },
});

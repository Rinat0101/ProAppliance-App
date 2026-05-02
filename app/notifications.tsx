import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { DarkColors, LightColors, Spacing, Radius } from "~/styles";
import { useNotifications, type Notification, type NotifType } from "~/contexts/NotificationsContext";

const TYPE_CONFIG: Record<NotifType, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  job_assigned:    { icon: "briefcase-outline",    color: "#3B82F6", label: "New Job"     },
  job_rescheduled: { icon: "calendar-outline",     color: "#F59E0B", label: "Rescheduled" },
  job_cancelled:   { icon: "close-circle-outline", color: "#EF4444", label: "Cancelled"   },
  job_updated:     { icon: "pencil-outline",       color: "#8B5CF6", label: "Updated"     },
  job_note:        { icon: "chatbubble-outline",   color: "#10B981", label: "Note Added"  },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  const unread = notifications.filter((n) => !n.read);
  const read   = notifications.filter((n) => n.read);

  function handlePress(notif: Notification) {
    markRead(notif.id);
    setTimeout(() => router.push(`/jobs/${notif.jobId}`), 200);
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.header, paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <Pressable onPress={markAllRead} hitSlop={8}>
            <Text style={[styles.markAll, { color: colors.primary }]}>Mark all read</Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
      >
        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No notifications</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              You're all caught up
            </Text>
          </View>
        ) : (
          <>
            {unread.length > 0 && (
              <>
                <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>NEW</Text>
                {unread.map((n) => (
                  <NotifRow key={n.id} notif={n} colors={colors} onPress={() => handlePress(n)} />
                ))}
              </>
            )}
            {read.length > 0 && (
              <>
                <Text style={[styles.groupLabel, { color: colors.textTertiary, marginTop: unread.length > 0 ? Spacing.lg : 0 }]}>
                  EARLIER
                </Text>
                {read.map((n) => (
                  <NotifRow key={n.id} notif={n} colors={colors} onPress={() => handlePress(n)} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function NotifRow({ notif, colors, onPress }: { notif: Notification; colors: typeof LightColors; onPress: () => void }) {
  const cfg = TYPE_CONFIG[notif.type];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: notif.read ? colors.surface : colors.primary + "08", borderColor: colors.border },
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: cfg.color + "18" }]}>
        <Ionicons name={cfg.icon} size={20} color={cfg.color} />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={[styles.typePill, { backgroundColor: cfg.color + "18" }]}>
            <Text style={[styles.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Text style={[styles.time, { color: colors.textTertiary }]}>{timeAgo(notif.timestamp)}</Text>
        </View>
        <Text style={[styles.jobTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {notif.jobTitle}
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
          {notif.message}
        </Text>
      </View>

      {!notif.read && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#fff" },
  markAll: { fontSize: 13, fontWeight: "600" },
  headerSpacer: { width: 60 },

  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.sm },
  groupLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  content: { flex: 1, gap: 3 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  typeLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  time: { fontSize: 11 },
  jobTitle: { fontSize: 14, fontWeight: "600" },
  message: { fontSize: 13, lineHeight: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },

  empty: { alignItems: "center", gap: Spacing.sm, paddingVertical: 60 },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginTop: Spacing.sm },
  emptySubtitle: { fontSize: 14 },
});

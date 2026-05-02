import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { LightColors, DarkColors, Spacing, Radius } from "~/styles";
import { useNotifications, type Notification, type NotifType } from "~/contexts/NotificationsContext";

const TYPE_CONFIG: Record<NotifType, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  job_assigned:   { icon: "briefcase-outline",    color: "#3B82F6", label: "New Job" },
  job_rescheduled:{ icon: "calendar-outline",     color: "#F59E0B", label: "Rescheduled" },
  job_cancelled:  { icon: "close-circle-outline", color: "#EF4444", label: "Cancelled" },
  job_updated:    { icon: "pencil-outline",        color: "#8B5CF6", label: "Updated" },
  job_note:       { icon: "chatbubble-outline",   color: "#10B981", label: "Note Added" },
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

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpenAll?: () => void;
};

export function NotificationsPanel({ visible, onClose, onOpenAll }: Props) {
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;
  const router = useRouter();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  function handleNotifPress(notif: Notification) {
    markRead(notif.id);
    onClose();
    setTimeout(() => router.push(`/jobs/${notif.jobId}`), 200);
  }

  const unread = notifications.filter((n) => !n.read);
  const read   = notifications.filter((n) => n.read);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Overlay */}
      <Pressable style={styles.overlay} onPress={onClose} />

      {/* Panel — slides in from top-right */}
      <View
        style={[
          styles.panel,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            top: insets.top + 56,
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.panelHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.panelTitleRow}>
            <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>
              Notifications
            </Text>
            <Pressable
              onPress={() => { onClose(); setTimeout(() => onOpenAll?.(), 150); }}
              hitSlop={8}
              style={[styles.openAllBtn, { backgroundColor: "#3E5366" + "18" }]}
            >
              <Ionicons name="arrow-forward" size={15} color="#3E5366" />
            </Pressable>
          </View>
          {unreadCount > 0 && (
            <Pressable onPress={markAllRead} hitSlop={8}>
              <Text style={[styles.markAll, { color: colors.primary }]}>
                Mark all read
              </Text>
            </Pressable>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {notifications.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={32} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No notifications
              </Text>
            </View>
          ) : (
            <>
              {unread.length > 0 && (
                <>
                  <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>NEW</Text>
                  {unread.map((n) => (
                    <NotifRow key={n.id} notif={n} colors={colors} onPress={() => handleNotifPress(n)} />
                  ))}
                </>
              )}
              {read.length > 0 && (
                <>
                  <Text style={[styles.groupLabel, { color: colors.textTertiary, marginTop: unread.length > 0 ? Spacing.md : 0 }]}>
                    EARLIER
                  </Text>
                  {read.map((n) => (
                    <NotifRow key={n.id} notif={n} colors={colors} onPress={() => handleNotifPress(n)} />
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function NotifRow({
  notif,
  colors,
  onPress,
}: {
  notif: Notification;
  colors: typeof LightColors;
  onPress: () => void;
}) {
  const cfg = TYPE_CONFIG[notif.type];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.notifRow,
        { backgroundColor: notif.read ? "transparent" : colors.primary + "08" },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[styles.notifIcon, { backgroundColor: cfg.color + "18" }]}>
        <Ionicons name={cfg.icon} size={18} color={cfg.color} />
      </View>

      <View style={styles.notifContent}>
        <View style={styles.notifTop}>
          <View style={[styles.typePill, { backgroundColor: cfg.color + "18" }]}>
            <Text style={[styles.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Text style={[styles.notifTime, { color: colors.textTertiary }]}>
            {timeAgo(notif.timestamp)}
          </Text>
        </View>
        <Text style={[styles.notifTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {notif.jobTitle}
        </Text>
        <Text style={[styles.notifMsg, { color: colors.textSecondary }]} numberOfLines={2}>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  panel: {
    position: "absolute",
    right: Spacing.md,
    left: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    maxHeight: 480,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    overflow: "hidden",
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  panelTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  panelTitle: { fontSize: 16, fontWeight: "700" },
  markAll: { fontSize: 13, fontWeight: "600" },
  openAllBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  list: { paddingVertical: Spacing.sm },
  groupLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.md,
    paddingBottom: 4,
  },

  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  notifContent: { flex: 1, gap: 2 },
  notifTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  typePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  typeLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  notifTime: { fontSize: 11 },
  notifTitle: { fontSize: 13, fontWeight: "600" },
  notifMsg: { fontSize: 12, lineHeight: 17 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },

  empty: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  emptyText: { fontSize: 14 },
});

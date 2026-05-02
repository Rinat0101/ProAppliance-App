import React, { useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { LightColors, DarkColors, Spacing, Radius } from "~/styles";
import { useAuth } from "~/contexts/AuthContext";
import { getAllJobs } from "~/data/store";
import type { Job } from "~/types";

/* ─── action types ───────────────────────────────────────────── */

export type ActionType =
  | "fill_estimate"
  | "upload_photos"
  | "collect_payment"
  | "estimate_follow_up";

export interface ActionItem {
  jobId: string;
  jobNumber: string;
  jobTitle: string;
  clientName: string;
  scheduledDate: string;
  type: ActionType;
  balance?: number;
}

export const ACTION_CONFIG: Record<ActionType, {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  description: (item: ActionItem) => string;
}> = {
  fill_estimate: {
    icon: "document-text-outline",
    color: "#F59E0B",
    label: "Fill Estimate",
    description: (i) => `Estimate required for ${i.clientName}`,
  },
  upload_photos: {
    icon: "camera-outline",
    color: "#3B82F6",
    label: "Upload Photos",
    description: (i) => `Add photos for job #${i.jobNumber}`,
  },
  collect_payment: {
    icon: "card-outline",
    color: "#EF4444",
    label: "Collect Payment",
    description: (i) => i.balance ? `$${i.balance.toFixed(0)} outstanding — ${i.clientName}` : `Balance due — ${i.clientName}`,
  },
  estimate_follow_up: {
    icon: "call-outline",
    color: "#8B5CF6",
    label: "Follow Up",
    description: (i) => `Awaiting estimate approval from ${i.clientName}`,
  },
};

/* ─── derive action items from jobs ─────────────────────────── */

export function getActionItems(jobs: Job[]): ActionItem[] {
  const items: ActionItem[] = [];

  for (const job of jobs) {
    if (job.status === "cancelled") continue;

    // Estimate jobs that haven't been filled
    if (job.status === "estimate" && job.items.length === 0) {
      items.push({ jobId: job.id, jobNumber: job.jobNumber, jobTitle: job.title, clientName: job.clientName, scheduledDate: job.scheduledDate, type: "fill_estimate" });
    }

    // Completed jobs missing photos
    if (
      (job.status === "completed" || job.status === "in_progress") &&
      (!job.photos || job.photos.length === 0)
    ) {
      items.push({ jobId: job.id, jobNumber: job.jobNumber, jobTitle: job.title, clientName: job.clientName, scheduledDate: job.scheduledDate, type: "upload_photos" });
    }

    // Unpaid or partial payment on completed jobs
    if (job.status === "completed" && job.paymentStatus !== "paid" && job.balance > 0) {
      items.push({ jobId: job.id, jobNumber: job.jobNumber, jobTitle: job.title, clientName: job.clientName, scheduledDate: job.scheduledDate, type: "collect_payment", balance: job.balance });
    }

    // Estimate follow-up workflow status
    if (job.techWorkflowStatus === "estimate_follow_up") {
      items.push({ jobId: job.id, jobNumber: job.jobNumber, jobTitle: job.title, clientName: job.clientName, scheduledDate: job.scheduledDate, type: "estimate_follow_up" });
    }
  }

  return items;
}

/* ─── hook ───────────────────────────────────────────────────── */

export function useActionItems() {
  const { currentUserId } = useAuth();
  return useMemo(() => {
    const jobs = getAllJobs().filter((j) => j.technicianId === currentUserId);
    return getActionItems(jobs);
  }, [currentUserId]);
}

/* ─── panel component ────────────────────────────────────────── */

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NeedActionPanel({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;
  const router = useRouter();
  const items = useActionItems();

  const byType = useMemo(() => {
    const map: Partial<Record<ActionType, ActionItem[]>> = {};
    for (const item of items) {
      if (!map[item.type]) map[item.type] = [];
      map[item.type]!.push(item);
    }
    return map;
  }, [items]);

  function handlePress(item: ActionItem) {
    onClose();
    setTimeout(() => router.push(`/jobs/${item.jobId}` as any), 200);
  }

  const typeOrder: ActionType[] = ["collect_payment", "fill_estimate", "estimate_follow_up", "upload_photos"];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />

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
            <View style={[styles.titleIconWrap, { backgroundColor: "#F59E0B18" }]}>
              <Ionicons name="alert-circle-outline" size={16} color="#F59E0B" />
            </View>
            <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>
              Need Action
            </Text>
            {items.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: "#F59E0B" }]}>
                <Text style={styles.countText}>{items.length}</Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {items.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={32} color={colors.primary} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                All caught up!
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No actions required right now.
              </Text>
            </View>
          ) : (
            typeOrder.map((type) => {
              const group = byType[type];
              if (!group?.length) return null;
              const cfg = ACTION_CONFIG[type];
              return (
                <View key={type}>
                  <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>
                    {cfg.label.toUpperCase()}
                  </Text>
                  {group.map((item) => (
                    <ActionRow
                      key={`${item.jobId}-${item.type}`}
                      item={item}
                      colors={colors}
                      onPress={() => handlePress(item)}
                    />
                  ))}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ─── row ────────────────────────────────────────────────────── */

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
    const d = new Date(item.scheduledDate);
    const today = new Date();
    const diff = Math.round((d.getTime() - today.setHours(0, 0, 0, 0)) / 86400000);
    if (diff === 0) return "Today";
    if (diff === -1) return "Yesterday";
    if (diff === 1) return "Tomorrow";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, [item.scheduledDate]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: cfg.color + "18" }]}>
        <Ionicons name={cfg.icon} size={18} color={cfg.color} />
      </View>

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

      <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
    </Pressable>
  );
}

/* ─── styles ─────────────────────────────────────────────────── */

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
  panelTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  titleIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  panelTitle: { fontSize: 16, fontWeight: "700" },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  countText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  list: { paddingVertical: Spacing.sm },
  groupLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 4,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowContent: { flex: 1, gap: 2 },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  rowTitle: { fontSize: 13, fontWeight: "600", flex: 1 },
  rowDate:  { fontSize: 11, flexShrink: 0 },
  rowDesc:  { fontSize: 12 },

  empty: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700" },
  emptyText:  { fontSize: 13, textAlign: "center" },
});

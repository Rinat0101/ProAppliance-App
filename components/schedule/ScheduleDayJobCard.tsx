import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { LightColors, DarkColors, Spacing, Radius } from "~/styles";

type Job = {
  id: string;
  jobNumber: string;
  scheduledTime: string;
  scheduledEndTime: string;
  title: string;
  clientName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  status: string;
  paymentStatus: string;
  tags?: string[];
  distance?: string;
};

type Props = {
  job: Job;
  onPress?: () => void;
  isActive?: boolean;
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  scheduled:   { label: "Scheduled",   color: "#3B82F6" },
  en_route:    { label: "En Route",    color: "#F59E0B" },
  in_progress: { label: "In Progress", color: "#EC4899" },
  completed:   { label: "Completed",   color: "#10B981" },
  cancelled:   { label: "Cancelled",   color: "#EF4444" },
  estimate:    { label: "Estimate",    color: "#6366F1" },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  paid:    { label: "Paid",         color: "#10B981" },
  partial: { label: "Partial",      color: "#F59E0B" },
  unpaid:  { label: "Unpaid",       color: "#9CA3AF" },
};

function fmt12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function ScheduleDayJobCard({ job, onPress, isActive }: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const status = STATUS_CONFIG[job.status] ?? { label: job.status, color: colors.textSecondary };
  const payment = PAYMENT_CONFIG[job.paymentStatus] ?? { label: job.paymentStatus, color: colors.textSecondary };
  const tags = (job.tags ?? []).slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: isActive ? "#10B981" : colors.border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      {/* ── Top row: time + status pill ── */}
      <View style={styles.topRow}>
        <Text style={[styles.time, { color: colors.textPrimary }]}>
          {fmt12(job.scheduledTime)}
          <Text style={[styles.timeSep, { color: colors.textTertiary }]}> – </Text>
          {fmt12(job.scheduledEndTime)}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: status.color + "18" }]}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {/* ── Title + job number ── */}
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {job.title}
        </Text>
        <Text style={[styles.jobNum, { color: colors.textTertiary }]}>#{job.jobNumber}</Text>
      </View>

      {/* ── Client ── */}
      <View style={styles.infoRow}>
        <Ionicons name="person-outline" size={13} color={colors.textTertiary} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]} numberOfLines={1}>
          {job.clientName}
        </Text>
      </View>

      {/* ── Address ── */}
      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]} numberOfLines={1}>
          {job.address}, {job.city}
          {job.distance ? `  ·  ${job.distance}` : ""}
        </Text>
      </View>

      {/* ── Bottom: tags + payment ── */}
      <View style={styles.bottomRow}>
        <View style={styles.tagsRow}>
          {tags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.paymentPill, { backgroundColor: payment.color + "18" }]}>
          <Text style={[styles.paymentText, { color: payment.color }]}>{payment.label}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 8,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  time: {
    fontSize: 15,
    fontWeight: "700",
  },
  timeSep: {
    fontWeight: "400",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 0,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  jobNum: {
    fontSize: 11,
    fontWeight: "600",
    flexShrink: 0,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginTop: 2,
  },
  tagsRow: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  paymentPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    flexShrink: 0,
  },
  paymentText: {
    fontSize: 11,
    fontWeight: "700",
  },
});

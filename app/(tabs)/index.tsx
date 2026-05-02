import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { KPICard } from "~/components/KPICard";
import { RadialFAB } from "~/components/fab/RadialFAB";
import { AppHeader } from "~/components/layout/AppHeader";
import { AppSidebar } from "~/components/layout/AppSidebar";
import { mockJobs } from "~/data/mockData";

import { LightColors, DarkColors } from "~/styles";
import type { AppColors } from "~/styles/colors";

/* ---------------- SCREEN ---------------- */

export default function HomeScreen() {
  const [selectedDate] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const dateStr = selectedDate.toISOString().split("T")[0];

  const selectedJobs = mockJobs.filter((job) => job.scheduledDate === dateStr);

  const selectedRevenue = selectedJobs.reduce((sum, job) => sum + job.total, 0);

  const selectedPayments = selectedJobs.reduce((sum, job) => {
    const payments =
      job.payments?.filter((p) => p.timestamp.split("T")[0] === dateStr) || [];
    return sum + payments.reduce((s, p) => s + p.amount, 0);
  }, 0);

  const estimatesOnDate = mockJobs.filter(
    (job) => job.status === "estimate" && job.scheduledDate === dateStr
  ).length;

  const jobsUndone = mockJobs.filter(
    (job) => job.status !== "completed"
  ).length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* SIDEBAR */}
      <AppSidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 160 + insets.bottom },
        ]}
      >
        {/* COMMON HEADER */}
        <AppHeader title="Dashboard" onMenuPress={() => setSidebarOpen(true)} />

        {/* DATE HEADER */}
        <View style={[styles.dateHeader, { backgroundColor: colors.header }]}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={colors.headerForeground}
            style={{ opacity: 0.7 }}
          />
          <Text style={[styles.dateText, { color: colors.headerForeground }]}>
            {selectedDate.toDateString()}
          </Text>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          {/* KPI GRID */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiGrid}>
              <KPICard
                title="Jobs"
                value={selectedJobs.length}
                icon="briefcase-outline"
                trend={{ value: "+2 from yesterday", positive: true }}
              />

              <KPICard
                title="Revenue"
                value={`$${selectedRevenue.toFixed(0)}`}
                icon="cash-outline"
                trend={{ value: "+15% this week", positive: true }}
              />

              {/* 🔥 RESTORED */}
              <KPICard
                title="Sales"
                value={`$${selectedRevenue.toFixed(0)}`}
                icon="trending-up-outline"
                trend={{ value: "+8% from yesterday", positive: true }}
              />

              <KPICard
                title="Payments"
                value={`$${selectedPayments.toFixed(0)}`}
                icon="card-outline"
                trend={{ value: "+12% this week", positive: true }}
              />

              <KPICard
                title="Estimates"
                value={estimatesOnDate}
                icon="document-text-outline"
                trend={{ value: "+3 this week", positive: true }}
              />

              <KPICard
                title="Jobs Undone"
                value={jobsUndone}
                icon="time-outline"
                trend={{ value: "-2 from yesterday", positive: false }}
              />
            </View>
          </View>

          {/* TO DO */}
          <View
            style={[styles.todoSection, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.todoTitle, { color: colors.textSecondary }]}>
              TO DO
            </Text>

            <TodoItem
              icon="alert-circle-outline"
              iconBg={colors.muted}
              iconColor={colors.destructive}
              title="Review changes requested"
              subtitle="3 quotes have changes requested"
              colors={colors}
            />

            <TodoItem
              icon="receipt-outline"
              iconBg={colors.muted}
              iconColor={colors.primary}
              title="Follow up on past due invoices"
              subtitle="4 invoices are past due worth $15.5K"
              colors={colors}
            />
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <RadialFAB variant="dashboard" />
      </View>
    </View>
  );
}

/* ---------------- TODO ITEM ---------------- */

function TodoItem({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  colors: AppColors;
}) {
  return (
    <Pressable style={styles.todoItem}>
      <View style={[styles.todoIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.todoItemTitle, { color: colors.textPrimary }]}>
          {title}
        </Text>
        <Text
          style={[styles.todoItemSubtitle, { color: colors.textSecondary }]}
        >
          {subtitle}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </Pressable>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 120,
  },

  dateHeader: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  dateText: {
    fontSize: 12,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },

  todoSection: {
    borderRadius: 16,
    paddingVertical: 8,
  },

  todoTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    paddingHorizontal: 16,
  },

  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  todoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  todoItemTitle: {
    fontSize: 14,
    fontWeight: "600",
  },

  todoItemSubtitle: {
    fontSize: 12,
  },

  fabWrapper: {
    position: "absolute",
    right: 16,
  },
});

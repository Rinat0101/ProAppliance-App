/**
 * Tech dashboard — KPIs + today's schedule for the current technician.
 * TODO: replace getTechDashboard() with API call: GET /api/v1/technician/dashboard
 */
import { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { AppHeader } from "~/components/layout/AppHeader";
import { LightColors, DarkColors, Spacing, Radius } from "~/styles";
import { useAuth } from "~/contexts/AuthContext";
import { useNotifications } from "~/contexts/NotificationsContext";
import { getTechDashboard, type DashPeriod } from "~/data/store";
import { DateRangePicker } from "~/components/ui/DateRangePicker";
import { NotificationsPanel } from "~/components/notifications/NotificationsPanel";
import { useActionItems } from "~/components/notifications/NeedActionPanel";


/* ------------------------------------------------------------------ */
/*  Period config                                                       */
/* ------------------------------------------------------------------ */

const PERIODS: { key: DashPeriod; label: string; icon?: keyof typeof Ionicons.glyphMap }[] = [
  { key: "today",     label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "custom",    label: "Custom", icon: "calendar-outline" },
];

/* ------------------------------------------------------------------ */
/*  Screen                                                              */
/* ------------------------------------------------------------------ */

export default function TechHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;
  const { currentUserId } = useAuth();

  const [period, setPeriod] = useState<DashPeriod>("today");
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const actionItems = useActionItems();
  const [customFrom, setCustomFrom] = useState<string | undefined>();
  const [customTo, setCustomTo] = useState<string | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  // TODO: replace with useQuery(['techDashboard', period, customFrom, customTo], () => fetchTechDashboard(...))
  const data = useMemo(
    () => getTechDashboard(currentUserId, period, customFrom, customTo),
    [currentUserId, period, customFrom, customTo]
  );

  const upcomingCount = useMemo(
    () => data.periodJobs.filter(
      (j) => j.status !== "completed" && j.status !== "cancelled" && j.latitude != null
    ).length,
    [data.periodJobs]
  );

  const singleDayDate = useMemo(() => {
    if (period === "today") return new Date().toISOString().split("T")[0];
    if (period === "yesterday") {
      const y = new Date(); y.setDate(y.getDate() - 1);
      return y.toISOString().split("T")[0];
    }
    if (period === "custom" && customFrom === customTo && customFrom) return customFrom;
    return null;
  }, [period, customFrom, customTo]);

  const customLabel = useMemo(() => {
    if (period !== "custom" || !customFrom) return "Custom";
    const fmt = (s: string) =>
      new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return customFrom === customTo || !customTo
      ? fmt(customFrom)
      : `${fmt(customFrom)} – ${fmt(customTo)}`;
  }, [period, customFrom, customTo]);

  function handlePeriodPress(key: DashPeriod) {
    if (key === "custom") {
      setCalendarOpen(true);
    } else {
      setPeriod(key);
    }
  }

  function handleCustomConfirm(from: string, to: string) {
    setCustomFrom(from);
    setCustomTo(to);
    setPeriod("custom");
    setCalendarOpen(false);
  }

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      >
        <AppHeader
          title="Dashboard"
          hideMenu
          rightElement={
            <Pressable onPress={() => setNotifOpen(true)} style={styles.notifBtn} hitSlop={8}>
              <Ionicons name="notifications-outline" size={24} color={colors.headerForeground} />
              {unreadCount > 0 && (
                <View style={[styles.notifBadge, { backgroundColor: colors.destructive }]}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              )}
            </Pressable>
          }
        />

        {/* GREETING */}
        <View style={[styles.greeting, { backgroundColor: colors.header }]}>
          <Text style={[styles.greetingName, { color: colors.headerForeground }]}>
            {greeting}, {data.technicianName.split(" ")[0]}
          </Text>
          <Text style={[styles.greetingDate, { color: colors.headerForeground, opacity: 0.7 }]}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </Text>
        </View>

        <View style={styles.content}>
          {/* NEED ACTION BANNER */}
          {actionItems.length > 0 && (
            <Pressable
              onPress={() => router.push("/need-action" as any)}
              style={[styles.actionBanner, { backgroundColor: "#F59E0B12", borderColor: "#F59E0B50" }]}
            >
              <View style={[styles.actionBannerIcon, { backgroundColor: "#F59E0B22" }]}>
                <Ionicons name="alert-circle" size={18} color="#F59E0B" />
              </View>
              <View style={styles.actionBannerBody}>
                <Text style={[styles.actionBannerTitle, { color: colors.textPrimary }]}>Need Action</Text>
                <Text style={[styles.actionBannerSub, { color: colors.textSecondary }]}>
                  {actionItems.length} item{actionItems.length > 1 ? "s" : ""} require attention
                </Text>
              </View>
              <View style={[styles.actionBannerBadge, { backgroundColor: "#F59E0B" }]}>
                <Text style={styles.actionBannerBadgeText}>{actionItems.length}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#F59E0B" />
            </Pressable>
          )}

          {/* PERIOD SELECTOR */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodRow}>
            {PERIODS.map((p) => {
              const active = period === p.key;
              const label = p.key === "custom" ? customLabel : p.label;
              return (
                <Pressable
                  key={p.key}
                  onPress={() => handlePeriodPress(p.key)}
                  style={[styles.periodPill, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}
                >
                  {p.icon && <Ionicons name={p.icon} size={13} color={active ? "#fff" : colors.textSecondary} />}
                  <Text style={[styles.periodLabel, { color: active ? "#fff" : colors.textSecondary }]}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* KPI GRID */}
          <View style={styles.kpiGrid}>
            <KPICard colors={colors} icon="checkmark-circle-outline" label="Jobs Done"
              value={String(data.jobsDone)} sub={data.jobsOpen > 0 ? `${data.jobsOpen} open` : "All done!"}
              accent={colors.primary} />
            <KPICard colors={colors} icon="time-outline" label="Jobs Open"
              value={String(data.jobsOpen)} sub="active jobs"
              accent="#F59E0B" />
            <KPICard colors={colors} icon="wallet-outline" label="To Payout"
              value={`$${data.toPayout.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
              sub="your share (40%)" accent="#8B5CF6" />
            <KPICard colors={colors} icon="stats-chart-outline" label="Completion"
              value={data.completionRate > 0 ? `${data.completionRate}%` : "—"}
              sub="of assigned jobs" accent="#10B981" />
          </View>

          {/* MAP BUTTON — today only */}
          {period === "today" && upcomingCount > 0 && (
            <Pressable onPress={() => router.push("/(tech)/map")} style={[styles.mapBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="map-outline" size={18} color="#fff" />
              <Text style={styles.mapBtnText}>View route on map</Text>
              <View style={[styles.mapBtnBadge, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                <Text style={styles.mapBtnBadgeText}>{upcomingCount}</Text>
              </View>
            </Pressable>
          )}

          {/* SCHEDULE CARD — today only */}
          {period === "today" && (
            <Pressable
              onPress={() => router.push(
                singleDayDate
                  ? ({ pathname: "/(tech)/schedule", params: { date: singleDayDate } } as any)
                  : "/(tech)/schedule"
              )}
              style={({ pressed }) => [
                styles.scheduleCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.75 },
              ]}
            >
              <View style={[styles.scheduleIconWrap, { backgroundColor: colors.primary + "18" }]}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.scheduleCardBody}>
                <Text style={[styles.scheduleCardTitle, { color: colors.textPrimary }]}>
                  Today's Schedule
                </Text>
                <Text style={[styles.scheduleCardSub, { color: colors.textSecondary }]}>
                  {data.periodJobs.length === 0
                    ? "No jobs scheduled"
                    : `${data.periodJobs.length} job${data.periodJobs.length > 1 ? "s" : ""}`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </ScrollView>

      <NotificationsPanel
        visible={notifOpen}
        onClose={() => setNotifOpen(false)}
        onOpenAll={() => router.push("/notifications")}
      />

      <DateRangePicker
        visible={calendarOpen}
        initialFrom={customFrom}
        initialTo={customTo}
        onConfirm={handleCustomConfirm}
        onClose={() => setCalendarOpen(false)}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  KPI Card                                                            */
/* ------------------------------------------------------------------ */

function KPICard({
  colors,
  icon,
  label,
  value,
  sub,
  accent,
}: {
  colors: typeof LightColors | typeof DarkColors;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.kpiIconWrap, { backgroundColor: accent + "18" }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.kpiSub, { color: colors.textTertiary }]}>{sub}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  screen: { flex: 1 },

  greeting: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: 2,
  },
  greetingName: { fontSize: 22, fontWeight: "800" },
  greetingDate: { fontSize: 13 },

  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },

  // Period selector
  periodRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingBottom: 2,
  },
  periodPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  periodLabel: { fontSize: 13, fontWeight: "600" },

  // KPI grid
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  kpiCard: {
    width: "47.5%",
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: 3,
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  kpiValue: { fontSize: 24, fontWeight: "800" },
  kpiLabel: { fontSize: 13, fontWeight: "600" },
  kpiSub: { fontSize: 11 },

  headerBtns: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  notifBtn: {
    position: "relative",
    padding: 4,
  },
  notifBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notifBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },

  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.xl,
  },
  mapBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  mapBtnBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  mapBtnBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  // Need action banner
  actionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
  },
  actionBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  actionBannerBody: { flex: 1, gap: 1 },
  actionBannerTitle: { fontSize: 14, fontWeight: "700" },
  actionBannerSub: { fontSize: 12 },
  actionBannerBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    flexShrink: 0,
  },
  actionBannerBadgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  // Schedule card
  scheduleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  scheduleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  scheduleCardBody: { flex: 1, gap: 2 },
  scheduleCardTitle: { fontSize: 15, fontWeight: "700" },
  scheduleCardSub:   { fontSize: 12 },

  jobTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  jobTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: { fontSize: 11, fontWeight: "600" },
  jobClient: { fontSize: 12 },
  jobAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  jobAddress: { fontSize: 11, flex: 1 },
  jobDistance: { fontSize: 11 },
});

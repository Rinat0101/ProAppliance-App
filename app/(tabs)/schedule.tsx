import { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { LightColors, DarkColors, Radius } from "~/styles";

import { AppHeader } from "~/components/layout/AppHeader";
import { ScheduleControlsHeader } from "~/components/schedule/ScheduleControlsHeader";
import { ScheduleDateStrip } from "~/components/schedule/ScheduleDateStrip";
import { DayView } from "~/components/schedule/DayView";
import { TimelineView } from "~/components/schedule/TimelineView";
import { RadialFAB } from "~/components/fab/RadialFAB";

import { getAllJobs } from "~/data/store";
import type { Job } from "~/types";

/* ---------------- TYPES ---------------- */

type ViewMode = "day" | "timeline";

/* ---------------- HELPERS ---------------- */

function toDateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

/* ---------------- SCREEN ---------------- */

export default function ScheduleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();

  const colors = mode === "dark" ? DarkColors : LightColors;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");

  const today = useMemo(() => new Date(), []);

  const jobs = getAllJobs();

  /* ---------------- DAY VIEW JOBS ---------------- */

  const dayJobs = useMemo(() => {
    const key = toDateKey(selectedDate);
    return jobs
      .filter((job) => job.scheduledDate === key)
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [jobs, selectedDate]);

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* ---------------- COMMON HEADER ---------------- */}
      <AppHeader
        title="Schedule"
        onMenuPress={() => {
          // later: open sidebar
        }}
      />

      {/* ---------------- CONTROLS HEADER ---------------- */}
      <ScheduleControlsHeader
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        rightSlot={
          <Pressable
            onPress={() => setSelectedDate(new Date())}
            style={({ pressed }) => [styles.todayBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.todayBtnText}>Today</Text>
          </Pressable>
        }
      />

      {/* ---------------- DATE STRIP (DAY VIEW ONLY) ---------------- */}
      {viewMode === "day" && (
        <ScheduleDateStrip
          selectedDate={selectedDate}
          today={today}
          onSelectDate={setSelectedDate}
          jobs={jobs}
        />
      )}

      {/* ---------------- MAIN CONTENT ---------------- */}
      <View style={styles.content}>
        {viewMode === "day" ? (
          <DayView
            jobs={dayJobs}
            onJobPress={(id) => router.push(`/jobs/${id}`)}
          />
        ) : (
          <TimelineView
            jobs={jobs}
            selectedDate={selectedDate}
            onJobPress={(id) => router.push(`/jobs/${id}`)}
          />
        )}
      </View>

      {/* ---------------- FAB ---------------- */}
      <RadialFAB variant="schedule" />
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1 },
  todayBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: Radius.full,
  },
  todayBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
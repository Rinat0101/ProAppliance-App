/**
 * Tech schedule screen.
 * TODO: filter jobs by current technician's ID once API is connected.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { LightColors, DarkColors } from "~/styles";

import { AppHeader } from "~/components/layout/AppHeader";
import { ScheduleControlsHeader } from "~/components/schedule/ScheduleControlsHeader";
import { ScheduleDateStrip } from "~/components/schedule/ScheduleDateStrip";
import { DayView } from "~/components/schedule/DayView";
import { TimelineView, TimelineViewHandle } from "~/components/schedule/TimelineView";

import { getAllJobs } from "~/data/store";
import { useAuth } from "~/contexts/AuthContext";

type ViewMode = "day" | "timeline";

function toDateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

export default function TechScheduleScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();

  const timelineRef = useRef<TimelineViewHandle>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");

  /* Scroll to today when user taps the Schedule tab while already on it */
  useEffect(() => {
    const unsub = navigation.addListener("tabPress" as any, () => {
      timelineRef.current?.scrollToToday();
    });
    return unsub;
  }, [navigation]);

  /* Scroll to a specific date when navigated from the dashboard */
  useEffect(() => {
    if (!dateParam) return;
    setTimeout(() => timelineRef.current?.scrollToDate(dateParam), 150);
  }, [dateParam]);

  const today = useMemo(() => new Date(), []);
  const { currentUserId } = useAuth();

  const jobs = useMemo(
    () => getAllJobs().filter((j) => j.technicianId === currentUserId),
    [currentUserId]
  );

  const dayJobs = useMemo(() => {
    const key = toDateKey(selectedDate);
    return jobs
      .filter((job) => job.scheduledDate === key)
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [jobs, selectedDate]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <AppHeader title="Schedule" hideMenu />

      <ScheduleControlsHeader
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
      />

      {viewMode === "day" && (
        <ScheduleDateStrip
          selectedDate={selectedDate}
          today={today}
          onSelectDate={setSelectedDate}
          jobs={jobs}
        />
      )}

      <View style={styles.content}>
        {viewMode === "day" ? (
          <DayView jobs={dayJobs} onJobPress={(id) => router.push(`/jobs/${id}`)} />
        ) : (
          <TimelineView
            ref={timelineRef}
            jobs={jobs}
            onJobPress={(id) => router.push(`/jobs/${id}`)}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1 },
});

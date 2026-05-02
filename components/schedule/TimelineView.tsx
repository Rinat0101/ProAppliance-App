import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { LightColors, DarkColors, Spacing, Radius } from "~/styles";
import { ScheduleDayJobCard } from "~/components/schedule/ScheduleDayJobCard";
import type { Job } from "~/types";

/* ─── helpers ──────────────────────────────────────────────── */

function toLocalKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function buildInitialDates(center: Date, range: number): Date[] {
  const dates: Date[] = [];
  for (let i = -range; i <= range; i++) dates.push(addDays(center, i));
  return dates;
}

function groupJobsByDate(jobs: Job[]): Map<string, Job[]> {
  const map = new Map<string, Job[]>();
  for (const job of jobs) {
    if (!map.has(job.scheduledDate)) map.set(job.scheduledDate, []);
    map.get(job.scheduledDate)!.push(job);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }
  return map;
}

function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/* ─── constants ──────────────────────────────────────────────── */

const INITIAL_RANGE = 7;  // days in each direction from today
const LOAD_CHUNK    = 7;  // days to load per fetch
const SPINE_W       = 40;
const DOT_SIZE      = 10;
const DOT_NOW       = 16;
const LOAD_THRESHOLD = 120; // px from top/bottom to trigger load

/* ─── types ─────────────────────────────────────────────────── */

type Colors = typeof LightColors | typeof DarkColors;

type Props = {
  jobs: Job[];
  selectedDate?: Date;
  onJobPress?: (jobId: string) => void;
};

/* ─── DateHeader ─────────────────────────────────────────────── */

function DateHeader({ date, isToday, colors }: { date: Date; isToday: boolean; colors: Colors }) {
  return (
    <View style={styles.dateHeader}>
      <View style={styles.dateLeft}>
        <Text style={[styles.weekday, { color: isToday ? colors.primary : colors.textTertiary }]}>
          {date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
        </Text>
        <Text
          style={[
            styles.dayNum,
            { color: isToday ? colors.primary : colors.textPrimary, fontWeight: isToday ? "900" : "700" },
          ]}
        >
          {date.getDate()}
        </Text>
        <Text style={[styles.monthShort, { color: colors.textTertiary }]}>
          {date.toLocaleDateString("en-US", { month: "short" })}
        </Text>
      </View>
    </View>
  );
}

/* ─── DayItem ─────────────────────────────────────────────────── */

function DayItem({
  date,
  isFirst,
  isLast,
  dayJobs,
  isToday,
  colors,
  onJobPress,
}: {
  date: Date;
  isFirst: boolean;
  isLast: boolean;
  dayJobs: Job[];
  isToday: boolean;
  colors: Colors;
  onJobPress?: (id: string) => void;
}) {
  if (!isToday) {
    return (
      <View style={styles.row}>
        <View style={styles.spine}>
          <View style={[styles.line, { backgroundColor: isFirst ? "transparent" : colors.border, minHeight: 20 }]} />
          <View style={[styles.dot, { backgroundColor: colors.border, borderColor: colors.background }]} />
          <View style={[styles.line, { backgroundColor: isLast ? "transparent" : colors.border, minHeight: 20 }]} />
        </View>
        <View style={styles.body}>
          <DateHeader date={date} isToday={false} colors={colors} />
          {dayJobs.length > 0 ? (
            <View style={styles.cards}>
              {dayJobs.map((job) => (
                <ScheduleDayJobCard key={job.id} job={job} onPress={() => onJobPress?.(job.id)} />
              ))}
            </View>
          ) : (
            <View style={[styles.emptyDay, { borderColor: colors.border }]}>
              <Text style={[styles.emptyDayText, { color: colors.textTertiary }]}>No jobs scheduled</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  /* ── Today: show "now" dot near active/upcoming job ── */
  const now     = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const activeJob      = dayJobs.find(j => timeToMins(j.scheduledTime) <= nowMins && nowMins < timeToMins(j.scheduledEndTime)) ?? null;
  const firstUpcoming  = dayJobs.find(j => timeToMins(j.scheduledTime) > nowMins) ?? null;
  const dotJob         = activeJob ?? firstUpcoming ?? (dayJobs.length > 0 ? dayJobs[dayJobs.length - 1] : null);

  return (
    <View>
      {/* Date header row */}
      <View style={[styles.row, { paddingBottom: 0 }]}>
        <View style={styles.spine}>
          <View style={[styles.line, { backgroundColor: isFirst ? "transparent" : colors.border, minHeight: 20 }]} />
          <View style={[styles.dot, { backgroundColor: colors.border, borderColor: colors.background }]} />
          <View style={[styles.line, { backgroundColor: colors.border, minHeight: 8, flex: 1 }]} />
        </View>
        <View style={[styles.body, { paddingBottom: Spacing.sm }]}>
          <DateHeader date={date} isToday={true} colors={colors} />
        </View>
      </View>

      {/* Job rows */}
      {dayJobs.length > 0 ? (
        dayJobs.map((job, i) => {
          const isDotJob  = job.id === dotJob?.id;
          const isActive  = job.id === activeJob?.id;
          const isLastJob = isLast && i === dayJobs.length - 1;

          return (
            <View key={job.id} style={styles.subRow}>
              <View style={{ width: SPINE_W, alignItems: "center" }}>
                {isDotJob ? (
                  <>
                    <View style={{ width: 2, flex: 1, backgroundColor: colors.border }} />
                    <View style={[styles.dotNow, { backgroundColor: colors.primary }]}>
                      <View style={styles.dotNowInner} />
                    </View>
                    <View style={{ width: 2, flex: 1, backgroundColor: isLastJob ? "transparent" : colors.border }} />
                  </>
                ) : (
                  <View style={{ width: 2, flex: 1, backgroundColor: isLastJob ? "transparent" : colors.border }} />
                )}
              </View>
              <View style={[styles.subBody, { paddingBottom: i < dayJobs.length - 1 ? Spacing.sm : Spacing.lg }]}>
                <ScheduleDayJobCard job={job} isActive={isActive} onPress={() => onJobPress?.(job.id)} />
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.subRow}>
          <View style={{ width: SPINE_W, alignItems: "center" }}>
            <View style={{ width: 2, flex: 1, backgroundColor: isLast ? "transparent" : colors.border }} />
          </View>
          <View style={[styles.subBody, { paddingBottom: Spacing.lg }]}>
            <View style={[styles.emptyDay, { borderColor: colors.border }]}>
              <Text style={[styles.emptyDayText, { color: colors.textTertiary }]}>No jobs scheduled</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

/* ─── public handle ──────────────────────────────────────────── */

export type TimelineViewHandle = {
  scrollToToday: () => void;
  scrollToDate: (dateKey: string) => void;
};

/* ─── main component ─────────────────────────────────────────── */

export const TimelineView = forwardRef<TimelineViewHandle, Props>(function TimelineView({ jobs, onJobPress }: Props, ref) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const today    = useMemo(() => new Date(), []);
  const todayKey = toLocalKey(today);

  const [dates, setDates]               = useState<Date[]>(() => buildInitialDates(today, INITIAL_RANGE));
  const [loadingPast, setLoadingPast]   = useState(false);
  const [loadingFuture, setLoadingFuture] = useState(false);

  const byDate = useMemo(() => groupJobsByDate(jobs), [jobs]);

  const listRef           = useRef<FlatList<Date>>(null);
  const scrolledRef       = useRef(false);
  const pendingPrependRef = useRef(0);
  const isLoadingPastRef  = useRef(false);

  /* ── Shared helper to scroll to today's index ── */
  const scrollToToday = useCallback((animated = true) => {
    const idx = dates.findIndex(d => toLocalKey(d) === todayKey);
    if (idx >= 0) {
      listRef.current?.scrollToIndex({ index: idx, animated, viewPosition: 0 });
    }
  }, [dates, todayKey]);

  /* ── Expose scrollToToday to parent via ref ── */
  useImperativeHandle(ref, () => ({
    scrollToToday: () => scrollToToday(true),
    scrollToDate: (dateKey: string) => {
      const idx = dates.findIndex(d => toLocalKey(d) === dateKey);
      if (idx >= 0) listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0 });
    },
  }), [scrollToToday, dates]);

  /* ── Scroll to today on first render ── */
  const handleLayout = useCallback(() => {
    if (scrolledRef.current) return;
    scrolledRef.current = true;
    setTimeout(() => scrollToToday(false), 80);
  }, [scrollToToday]);

  /* ── Fallback: if scrollToIndex fails (items unmeasured) ── */
  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
      listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
    },
    []
  );

  /* ── Load past days (prepend) ── */
  const loadPast = useCallback(() => {
    if (isLoadingPastRef.current) return;
    isLoadingPastRef.current = true;
    setLoadingPast(true);

    setDates(prev => {
      const oldest = prev[0];
      const extra: Date[] = [];
      for (let i = LOAD_CHUNK; i >= 1; i--) extra.push(addDays(oldest, -i));
      pendingPrependRef.current = extra.length;
      return [...extra, ...prev];
    });

    setTimeout(() => {
      setLoadingPast(false);
      isLoadingPastRef.current = false;
    }, 300);
  }, []);

  /* ── Load future days (append) ── */
  const loadFuture = useCallback(() => {
    if (loadingFuture) return;
    setLoadingFuture(true);

    setDates(prev => {
      const newest = prev[prev.length - 1];
      const extra: Date[] = [];
      for (let i = 1; i <= LOAD_CHUNK; i++) extra.push(addDays(newest, i));
      return [...prev, ...extra];
    });

    setTimeout(() => setLoadingFuture(false), 300);
  }, [loadingFuture]);

  /* ── Detect near-top on scroll to trigger past load ── */
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      if (offsetY < LOAD_THRESHOLD && !isLoadingPastRef.current) {
        loadPast();
      }
    },
    [loadPast]
  );

  /* ── Render each day ── */
  const renderItem = useCallback(
    ({ item: date, index }: { item: Date; index: number }) => {
      const dateKey = toLocalKey(date);
      const dayJobs = byDate.get(dateKey) ?? [];
      const isToday = dateKey === todayKey;
      const isFirst = index === 0;
      const isLast  = index === dates.length - 1;

      return (
        <DayItem
          date={date}
          isFirst={isFirst}
          isLast={isLast}
          dayJobs={dayJobs}
          isToday={isToday}
          colors={colors}
          onJobPress={onJobPress}
        />
      );
    },
    [colors, byDate, todayKey, dates.length, onJobPress]
  );

  const ListHeader = loadingPast ? (
    <View style={styles.loadingRow}>
      <ActivityIndicator size="small" color={colors.textTertiary} />
    </View>
  ) : null;

  const ListFooter = loadingFuture ? (
    <View style={styles.loadingRow}>
      <ActivityIndicator size="small" color={colors.textTertiary} />
    </View>
  ) : null;

  return (
    <FlatList
      ref={listRef}
      data={dates}
      keyExtractor={d => toLocalKey(d)}
      renderItem={renderItem}
      onLayout={handleLayout}
      onEndReached={loadFuture}
      onEndReachedThreshold={0.3}
      onScroll={handleScroll}
      scrollEventThrottle={100}
      onScrollToIndexFailed={handleScrollToIndexFailed}
      /* Prevents scroll jump when prepending past items (iOS + RN ≥0.66 Android) */
      maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={ListFooter}
      removeClippedSubviews
      maxToRenderPerBatch={8}
      windowSize={5}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.listContent}
    />
  );
});

/* ─── styles ─────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  listContent: { paddingBottom: Spacing.xl },

  loadingRow: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },

  row: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
  },
  subRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
  },

  spine: {
    width: SPINE_W,
    alignItems: "center",
    flexShrink: 0,
  },
  line: { width: 2, flex: 1 },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    flexShrink: 0,
  },
  dotNow: {
    width: DOT_NOW,
    height: DOT_NOW,
    borderRadius: DOT_NOW / 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dotNowInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },

  body: {
    flex: 1,
    paddingLeft: Spacing.sm,
    paddingTop: 14,
    paddingBottom: Spacing.lg,
  },
  subBody: {
    flex: 1,
    paddingLeft: Spacing.sm,
  },

  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dateLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    flex: 1,
  },
  weekday:    { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  dayNum:     { fontSize: 22, lineHeight: 26 },
  monthShort: { fontSize: 12, fontWeight: "600" },

  cards:    { gap: Spacing.sm },
  emptyDay: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: Radius.lg,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
  },
  emptyDayText: { fontSize: 13, fontWeight: "500" },
});

import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { LightColors, DarkColors, Spacing, Radius } from "~/styles";
import type { Job } from "~/types";

type Props = {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  today: Date;
  jobs?: Job[];
};

function toKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeekDates(center: Date): Date[] {
  const start = new Date(center);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function shiftWeek(date: Date, direction: 1 | -1): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + direction * 7);
  return d;
}

export function ScheduleDateStrip({ selectedDate, onSelectDate, today, jobs = [] }: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const countByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const job of jobs) {
      const key = job.scheduledDate;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [jobs]);

  const monthLabel = useMemo(() => {
    const first = weekDates[0];
    const last = weekDates[6];
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    if (first.getMonth() === last.getMonth()) return fmt(first);
    return `${first.toLocaleDateString("en-US", { month: "short" })} – ${fmt(last)}`;
  }, [weekDates]);

  return (
    <View style={[styles.wrap, { borderBottomColor: colors.border }]}>
      {/* Month nav row */}
      <View style={styles.monthRow}>
        <Pressable
          onPress={() => onSelectDate(shiftWeek(selectedDate, -1))}
          hitSlop={10}
          style={styles.navBtn}
        >
          <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        </Pressable>

        <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>{monthLabel}</Text>

        <Pressable
          onPress={() => onSelectDate(shiftWeek(selectedDate, 1))}
          hitSlop={10}
          style={styles.navBtn}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Day columns */}
      <View style={styles.daysRow}>
        {weekDates.map((date) => {
          const key = toKey(date);
          const selected = date.toDateString() === selectedDate.toDateString();
          const isToday = date.toDateString() === today.toDateString();
          const count = countByDate.get(key) ?? 0;

          return (
            <Pressable
              key={key}
              onPress={() => onSelectDate(date)}
              style={[
                styles.dayBtn,
                selected && { backgroundColor: colors.primary, borderRadius: Radius.lg },
              ]}
            >
              {/* Job count badge */}
              {count > 0 && (
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: selected ? "rgba(255,255,255,0.3)" : colors.primary + "22" },
                  ]}
                >
                  <Text style={[styles.countText, { color: selected ? "#fff" : colors.primary }]}>
                    {count}
                  </Text>
                </View>
              )}
              {count === 0 && <View style={styles.countPlaceholder} />}

              {/* Weekday label */}
              <Text style={[styles.weekday, { color: selected ? "#fff" : colors.textTertiary }]}>
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </Text>

              {/* Day number */}
              <View
                style={[
                  styles.dayCircle,
                  isToday && !selected && { borderWidth: 1.5, borderColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    {
                      color: selected
                        ? "#fff"
                        : isToday
                        ? colors.primary
                        : colors.textPrimary,
                      fontWeight: isToday || selected ? "800" : "600",
                    },
                  ]}
                >
                  {date.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  navBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  daysRow: {
    flexDirection: "row",
    gap: 4,
  },
  dayBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  countPlaceholder: {
    height: 18,
  },
  countText: {
    fontSize: 10,
    fontWeight: "800",
  },
  weekday: {
    fontSize: 11,
    fontWeight: "600",
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNum: {
    fontSize: 15,
  },
});

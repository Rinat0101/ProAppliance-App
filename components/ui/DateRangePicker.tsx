/**
 * Inline date range picker — no external dependencies.
 * Renders a month grid. Tap once to set start, tap again to set end.
 * Shows up to 2 months at a time with prev/next navigation.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { LightColors, DarkColors, Spacing, Radius } from "~/styles";
import { useAppTheme } from "~/components/theme/AppThemeContext";

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function isoDate(date: Date) {
  // Use local date parts to avoid UTC offset shifting the day
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function sameDay(a: Date, b: Date) {
  return isoDate(a) === isoDate(b);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// Returns 0=Mon … 6=Sun offset for first day of month
function firstDayOffset(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function addMonths(year: number, month: number, delta: number) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

function formatHeader(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatRange(from: Date | null, to: Date | null) {
  if (!from) return "Select dates";
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (!to || sameDay(from, to)) return fmt(from);
  return `${fmt(from)} – ${fmt(to)}`;
}

type Props = {
  visible: boolean;
  initialFrom?: string; // ISO date
  initialTo?: string;
  onConfirm: (from: string, to: string) => void;
  onClose: () => void;
};

export function DateRangePicker({
  visible,
  initialFrom,
  initialTo,
  onConfirm,
  onClose,
}: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const [selecting, setSelecting] = useState<"from" | "to">("from");
  // Parse ISO string as local date (not UTC) to avoid day shift
  function parseLocal(iso: string): Date {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  const [from, setFrom] = useState<Date | null>(
    initialFrom ? parseLocal(initialFrom) : null
  );
  const [to, setTo] = useState<Date | null>(
    initialTo ? parseLocal(initialTo) : null
  );

  function handleDayPress(date: Date) {
    if (selecting === "from") {
      setFrom(date);
      setTo(null);
      setSelecting("to");
    } else {
      if (from && date < from) {
        // tapped before start — swap
        setTo(from);
        setFrom(date);
      } else {
        setTo(date);
      }
      setSelecting("from");
    }
  }

  function handleConfirm() {
    if (!from) return;
    const f = isoDate(from);
    const t = to ? isoDate(to) : f;
    onConfirm(f, t);
  }

  function goMonth(delta: number) {
    const { year, month } = addMonths(viewYear, viewMonth, delta);
    setViewYear(year);
    setViewMonth(month);
  }

  function isInRange(date: Date) {
    if (!from || !to) return false;
    return date > from && date < to;
  }

  function isStart(date: Date) {
    return from !== null && sameDay(date, from);
  }

  function isEnd(date: Date) {
    return to !== null && sameDay(date, to);
  }

  function isToday(date: Date) {
    return sameDay(date, today);
  }

  function renderMonth(year: number, month: number) {
    const offset = firstDayOffset(year, month);
    const days = daysInMonth(year, month);
    const cells: (Date | null)[] = [
      ...Array(offset).fill(null),
      ...Array.from({ length: days }, (_, i) => new Date(year, month, i + 1)),
    ];
    // pad to full rows
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <View key={`${year}-${month}`} style={styles.monthBlock}>
        <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>
          {formatHeader(year, month)}
        </Text>

        {/* Day headers */}
        <View style={styles.weekRow}>
          {DAYS.map((d) => (
            <Text key={d} style={[styles.dayHeader, { color: colors.textTertiary }]}>
              {d}
            </Text>
          ))}
        </View>

        {/* Day cells */}
        {Array.from({ length: cells.length / 7 }, (_, row) => (
          <View key={row} style={styles.weekRow}>
            {cells.slice(row * 7, row * 7 + 7).map((date, col) => {
              if (!date) return <View key={col} style={styles.dayCell} />;

              const start = isStart(date);
              const end = isEnd(date);
              const inRange = isInRange(date);
              const todayMark = isToday(date);
              const selected = start || end;

              return (
                <Pressable
                  key={col}
                  style={[
                    styles.dayCell,
                    inRange && { backgroundColor: colors.primary + "22" },
                    start && styles.rangeStart,
                    end && styles.rangeEnd,
                  ]}
                  onPress={() => handleDayPress(date)}
                >
                  <View
                    style={[
                      styles.dayInner,
                      selected && { backgroundColor: colors.primary },
                      todayMark && !selected && {
                        borderWidth: 1.5,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: selected ? "#fff" : colors.textPrimary },
                        todayMark && !selected && { color: colors.primary, fontWeight: "700" },
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>

          {/* Month nav */}
          <View style={styles.nav}>
            <Pressable onPress={() => goMonth(-1)} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.navTitle, { color: colors.textPrimary }]}>
              {formatHeader(viewYear, viewMonth)}
            </Text>
            <Pressable onPress={() => goMonth(1)} hitSlop={12}>
              <Ionicons name="chevron-forward" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {renderMonth(viewYear, viewMonth)}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <View style={styles.footerRange}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.footerRangeText, { color: colors.textSecondary }]}>
                {formatRange(from, to)}
              </Text>
              {(from || to) && (
                <Pressable
                  hitSlop={8}
                  onPress={() => { setFrom(null); setTo(null); setSelecting("from"); }}
                >
                  <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
                </Pressable>
              )}
            </View>

            <Pressable
              style={[
                styles.confirmBtn,
                { backgroundColor: from ? colors.primary : colors.muted },
              ]}
              disabled={!from}
              onPress={handleConfirm}
            >
              <Text style={[styles.confirmText, { color: from ? "#fff" : colors.textTertiary }]}>
                Apply
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: Spacing.lg,
  },
  sheet: {
    width: "100%",
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    maxHeight: "80%",
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  navTitle: { fontSize: 16, fontWeight: "700" },

  monthBlock: { marginBottom: Spacing.lg },
  monthTitle: { fontSize: 14, fontWeight: "600", marginBottom: Spacing.sm },

  weekRow: { flexDirection: "row" },
  dayHeader: {
    width: CELL_SIZE,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    paddingBottom: 6,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  rangeStart: { borderTopLeftRadius: CELL_SIZE / 2, borderBottomLeftRadius: CELL_SIZE / 2 },
  rangeEnd: { borderTopRightRadius: CELL_SIZE / 2, borderBottomRightRadius: CELL_SIZE / 2 },
  dayInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { fontSize: 14 },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  footerRange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  footerRangeText: { fontSize: 14, fontWeight: "500" },
  confirmBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  confirmText: { fontSize: 15, fontWeight: "700" },
});

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import {
  LightColors,
  DarkColors,
  Spacing,
  Radius,
  Typography,
} from "~/styles";

type Job = {
  id: string;
  title: string;
  scheduledTime: string;
  scheduledEndTime: string;
  clientName: string;
};

type Props = {
  date: Date;
  jobs: Job[];
  isToday: boolean;
  isTimeOff?: boolean;
  timeOffStatus?: "approved" | "pending";
  onPressJob: (jobId: string) => void;
};

export function ScheduleTimelineRow({
  date,
  jobs,
  isToday,
  isTimeOff,
  timeOffStatus,
  onPressJob,
}: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const dayNumber = date.getDate();

  return (
    <View style={styles.row}>
      {/* LEFT DATE COLUMN */}
      <View style={styles.dateColumn}>
        <Text
          style={[
            styles.dayName,
            { color: colors.textSecondary },
          ]}
        >
          {dayName}
        </Text>

        <View
          style={[
            styles.dayNumberWrapper,
            isToday && {
              backgroundColor: colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.dayNumber,
              {
                color: isToday
                  ? "#FFF"
                  : colors.textPrimary,
              },
            ]}
          >
            {dayNumber}
          </Text>
        </View>
      </View>

      {/* RIGHT CONTENT */}
      <View style={styles.contentColumn}>
        {isTimeOff ? (
          <View
            style={[
              styles.timeOffCard,
              { backgroundColor: colors.muted },
            ]}
          >
            <Text style={styles.timeOffText}>
              Time Off
            </Text>

            {timeOffStatus && (
              <Text
                style={[
                  styles.timeOffBadge,
                  {
                    color:
                      timeOffStatus === "approved"
                        ? colors.primary
                        : colors.warning,
                  },
                ]}
              >
                {timeOffStatus === "approved"
                  ? "Approved"
                  : "Pending"}
              </Text>
            )}
          </View>
        ) : jobs.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.muted },
            ]}
          >
            <Text style={styles.emptyText}>
              No jobs scheduled
            </Text>
          </View>
        ) : (
          <View style={styles.jobsList}>
            {jobs.map((job) => (
              <Pressable
                key={job.id}
                onPress={() => onPressJob(job.id)}
                style={[
                  styles.jobCard,
                  {
                    backgroundColor: colors.surface,
                    borderLeftColor: colors.info,
                  },
                ]}
              >
                <Text style={styles.jobTitle}>
                  {job.scheduledTime} – {job.scheduledEndTime} •{" "}
                  {job.title}
                </Text>

                <Text style={styles.jobClient}>
                  {job.clientName}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: Spacing.md,
  },

  /* LEFT */
  dateColumn: {
    width: 56,
    alignItems: "center",
    paddingTop: 2,
  },

  dayName: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
  },

  dayNumberWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  dayNumber: {
    fontSize: 16,
    fontWeight: "700",
  },

  /* RIGHT */
  contentColumn: {
    flex: 1,
    paddingLeft: Spacing.sm,
  },

  jobsList: {
    gap: Spacing.sm,
  },

  jobCard: {
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderLeftWidth: 3,
  },

  jobTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },

  jobClient: {
    fontSize: 11,
    color: "#6B7280",
  },

  emptyCard: {
    borderRadius: Radius.md,
    padding: Spacing.md,
  },

  emptyText: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#6B7280",
  },

  timeOffCard: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  timeOffText: {
    fontSize: 12,
    fontWeight: "600",
  },

  timeOffBadge: {
    fontSize: 11,
    fontWeight: "700",
  },
});
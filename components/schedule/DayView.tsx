import { View, ScrollView, StyleSheet } from "react-native";

import { ScheduleEmptyState } from "./ScheduleEmptyState";
import { ScheduleDayJobCard } from "./ScheduleDayJobCard";
import { Spacing } from "~/styles";
import type { Job } from "~/types";

type Props = {
  jobs: Job[];
  onJobPress?: (jobId: string) => void;
};

export function DayView({ jobs, onJobPress }: Props) {
  if (!jobs || jobs.length === 0) {
    return <ScheduleEmptyState />;
  }

  const sortedJobs = [...jobs].sort((a, b) =>
    a.scheduledTime.localeCompare(b.scheduledTime)
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {sortedJobs.map((job) => (
        <ScheduleDayJobCard
          key={job.id}
          job={job}
          onPress={() => onJobPress?.(job.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
});

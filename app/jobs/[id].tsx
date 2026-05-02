import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { useAuth } from "~/contexts/AuthContext";
import { DarkColors, LightColors, Spacing } from "~/styles";

import { JobDetailsHeader } from "~/components/jobs/details/details/JobDetailsHeader";
import { JobDetailsTab } from "~/components/jobs/details/tabs/JobDetailsTab";
import { JobDetailsTechTab } from "~/components/jobs/details/tabs/JobDetailsTechTab";
import { JobFinanceTab } from "~/components/jobs/details/tabs/JobFinanceTab";
import { JobTimelineTab } from "~/components/jobs/details/tabs/JobTimelineTab";

import { getJobById, getClientForJob } from "~/data/store";

type TabKey = "details" | "finance" | "timeline";

export default function JobDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;
  const { role } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>("details");

  const job = getJobById(id ?? "");
  const client = job ? getClientForJob(job) : undefined;

  const isTech = role === "technician" || role === "tech_lead";

  if (!job) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.textSecondary }}>Job not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <View style={{ backgroundColor: colors.header, paddingTop: insets.top }} />
      <JobDetailsHeader
        jobNumber={job.jobNumber}
        onBack={() => router.back()}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        hideTabs={isTech}
      />

      <View style={styles.content}>
        {isTech ? (
          <JobDetailsTechTab job={job} client={client} />
        ) : (
          <>
            {activeTab === "details" && <JobDetailsTab job={job} client={client} />}
            {activeTab === "finance" && <JobFinanceTab job={job} client={client} />}
            {activeTab === "timeline" && <JobTimelineTab />}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flex: 1,
    paddingTop: Spacing.md,
  },
});

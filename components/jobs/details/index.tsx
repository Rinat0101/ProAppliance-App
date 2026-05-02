import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { DarkColors, LightColors, Spacing } from "~/styles";

import { JobDetailsHeader } from "~/components/jobs/details/details/JobDetailsHeader";
import { JobDetailsTabs } from "~/components/jobs/details/details/JobDetailsTabs";
import { AppHeader } from "~/components/layout/AppHeader";

// TEMP tab placeholders (we’ll replace these next)
import { JobDetailsDetailsTab } from "~/components/jobs/details/details/tabs/JobDetailsTab";
import { JobDetailsFinanceTab } from "~/components/jobs/details/tabs/JobDetailsFinanceTab";
import { JobDetailsTimelineTab } from "~/components/jobs/details/tabs/JobDetailsTimelineTab";

type TabKey = "details" | "finance" | "timeline";

export default function JobDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { mode } = useAppTheme();

  const colors = mode === "dark" ? DarkColors : LightColors;

  const [activeTab, setActiveTab] = useState<TabKey>("details");

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
      {/* ---------- COMMON APP HEADER ---------- */}
      <AppHeader title="ProAppliance" onMenuPress={() => {}} />

      {/* ---------- JOB HEADER (same color as app header) ---------- */}
      <JobDetailsHeader jobId={jobId} onBack={() => router.back()} />

      {/* ---------- TABS ---------- */}
      <JobDetailsTabs activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* ---------- TAB CONTENT ---------- */}
      <View style={styles.content}>
        {activeTab === "details" && <JobDetailsDetailsTab />}
        {activeTab === "finance" && <JobDetailsFinanceTab />}
        {activeTab === "timeline" && <JobDetailsTimelineTab />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
});

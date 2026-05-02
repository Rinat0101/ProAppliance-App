import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { DarkColors, LightColors, Radius, Spacing, Typography } from "~/styles";

import {
  JobDetailsTabKey,
  JobDetailsTabs,
} from "~/components/jobs/details/details/JobDetailsTabs";

type Props = {
  jobNumber?: string;
  titleOverride?: string;

  /** navigation */
  onBack: () => void;
  onShare?: () => void;

  /** tabs */
  activeTab: JobDetailsTabKey;
  onChangeTab: (tab: JobDetailsTabKey) => void;

  /** when true, hides the tab bar (used in tech view) */
  hideTabs?: boolean;
};

export function JobDetailsHeader({
  jobNumber,
  titleOverride,
  onBack,
  onShare,
  activeTab,
  onChangeTab,
  hideTabs = false,
}: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const headerBg = colors.header ?? colors.surface;

  const title =
    titleOverride ?? `Job #${String(jobNumber ?? "").toUpperCase() || "—"}`;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: headerBg,
          borderBottomLeftRadius: Radius.xl,
          borderBottomRightRadius: Radius.xl,
        },
      ]}
    >
      <View style={styles.inner}>
        {/* ---------------- TOP ROW ---------------- */}
        <View style={styles.topRow}>
          <Pressable
            onPress={onBack}
            hitSlop={10}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>

          <View style={styles.titleWrap}>
            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
          </View>

          <Pressable
            onPress={onShare}
            disabled={!onShare}
            hitSlop={10}
            style={({ pressed }) => [
              styles.iconBtn,
              !onShare && { opacity: 0.35 },
              pressed && onShare ? styles.pressed : null,
            ]}
          >
            <Ionicons name="share-social-outline" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* ---------------- TABS ---------------- */}
        {!hideTabs && (
          <View style={styles.tabsWrap}>
            <JobDetailsTabs value={activeTab} onChange={onChangeTab} />
          </View>
        )}
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },

  inner: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },

  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  pressed: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  titleWrap: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
  },

  title: {
    ...Typography.h2,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  tabsWrap: {
    marginTop: Spacing.md,
  },
});

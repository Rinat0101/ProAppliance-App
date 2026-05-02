import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

import { Spacing, Typography } from "~/styles";

export type JobDetailsTabKey = "details" | "finance" | "timeline";

type TabItem = {
  key: JobDetailsTabKey;
  label: string;
};

type Props = {
  value: JobDetailsTabKey;
  onChange: (next: JobDetailsTabKey) => void;
  tabs?: TabItem[]; // optional override
};

const DEFAULT_TABS: TabItem[] = [
  { key: "details", label: "Details" },
  { key: "finance", label: "Finance" },
  { key: "timeline", label: "Timeline" },
];

export function JobDetailsTabs({ value, onChange, tabs = DEFAULT_TABS }: Props) {
  return (
    <View style={styles.container}>
      {tabs.map((t) => {
        const active = t.key === value;

        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={styles.tab}
            hitSlop={8}
          >
            <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
              {t.label}
            </Text>

            {/* underline */}
            <View style={[styles.underline, active ? styles.underlineActive : styles.underlineInactive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  tab: {
    flex: 1,
    alignItems: "center",
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },

  label: {
    ...Typography.body,
    fontWeight: "700",
    fontSize: 13,
  },

  labelActive: {
    color: "#fff",
  },

  labelInactive: {
    color: "rgba(255,255,255,0.6)",
  },

  underline: {
    marginTop: 8,
    height: 2,
    width: "100%",
  },

  underlineActive: {
    backgroundColor: "#fff",
    opacity: 0.95,
  },

  underlineInactive: {
    backgroundColor: "transparent",
  },
});
/**
 * TeamContacts — department contact cards used on both Messages and Calls screens.
 */
import React from "react";
import { View, Text, Pressable, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { LightColors, DarkColors, Spacing, Radius } from "~/styles";

/* ------------------------------------------------------------------ */
/*  Department config                                                   */
/* ------------------------------------------------------------------ */

export type Department = {
  id: string;
  name: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  phone: string; // TODO: replace with real numbers from /api/v1/departments
};

export const DEPARTMENTS: Department[] = [
  {
    id: "dispatch",
    name: "Dispatch",
    subtitle: "Job scheduling & routing",
    icon: "radio-outline",
    color: "#3B82F6",
    phone: "5551000001",
  },
  {
    id: "parts",
    name: "Parts",
    subtitle: "Parts requests & availability",
    icon: "cube-outline",
    color: "#F59E0B",
    phone: "5551000002",
  },
  {
    id: "tech_support",
    name: "Tech Support",
    subtitle: "Repair guidance & diagnostics",
    icon: "build-outline",
    color: "#EC4899",
    phone: "5551000004",
  },
  {
    id: "finance",
    name: "Finance",
    subtitle: "Payouts & billing questions",
    icon: "cash-outline",
    color: "#10B981",
    phone: "5551000005",
  },
  {
    id: "sales",
    name: "Sales",
    subtitle: "Upsells, service plans & estimates",
    icon: "trending-up-outline",
    color: "#F97316",
    phone: "5551000007",
  },
  {
    id: "it_support",
    name: "IT Support",
    subtitle: "App & device issues",
    icon: "laptop-outline",
    color: "#8B5CF6",
    phone: "5551000003",
  },
  {
    id: "management",
    name: "Management",
    subtitle: "General inquiries & escalations",
    icon: "people-outline",
    color: "#6366F1",
    phone: "5551000006",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

type Props = {
  mode: "message" | "call";
  onMessage?: (dept: Department) => void;
};

export function TeamContacts({ mode, onMessage }: Props) {
  const { mode: themeMode } = useAppTheme();
  const colors = themeMode === "dark" ? DarkColors : LightColors;

  function handleAction(dept: Department) {
    if (mode === "call") {
      Linking.openURL(`tel:${dept.phone}`);
    } else {
      onMessage?.(dept);
    }
  }

  return (
    <View style={styles.list}>
      {DEPARTMENTS.map((dept) => (
        <Pressable
          key={dept.id}
          onPress={() => handleAction(dept)}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.75 },
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: dept.color + "18" }]}>
            <Ionicons name={dept.icon} size={22} color={dept.color} />
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{dept.name}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {dept.subtitle}
            </Text>
          </View>

          {/* Action button */}
          <View style={[styles.actionBtn, { backgroundColor: dept.color + "18" }]}>
            <Ionicons
              name={mode === "call" ? "call-outline" : "chatbubble-outline"}
              size={18}
              color={dept.color}
            />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 2 },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});

/**
 * Tech calls screen — client call log + team contacts.
 * TODO: replace mock data with GET /api/v1/calls
 */
import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { AppHeader } from "~/components/layout/AppHeader";
import { LightColors, DarkColors, Spacing, Radius } from "~/styles";
import { TeamContacts } from "~/components/team/TeamContacts";

type Tab = "clients" | "team";

// TODO: replace with GET /api/v1/calls
const MOCK_CALLS = [
  { id: "c1", name: "Sarah Martinez", phone: "(555) 234-5678", type: "incoming" as const, duration: "4m 12s", time: new Date(Date.now() - 1800000).toISOString() },
  { id: "c2", name: "John Davis",     phone: "(555) 345-6789", type: "outgoing" as const, duration: "1m 05s", time: new Date(Date.now() - 7200000).toISOString() },
  { id: "c3", name: "Emily Chen",     phone: "(555) 456-7890", type: "missed"   as const, duration: "",       time: new Date(Date.now() - 10800000).toISOString() },
  { id: "c4", name: "Sarah Martinez", phone: "(555) 234-5678", type: "outgoing" as const, duration: "0m 45s", time: new Date(Date.now() - 172800000).toISOString() },
];

const CALL_ICONS = {
  incoming: { name: "call-outline" as const,     color: "#10B981" },
  outgoing: { name: "arrow-up-outline" as const, color: "#3B82F6" },
  missed:   { name: "call-outline" as const,     color: "#EF4444" },
};

function timeLabel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Yesterday" : `${d}d ago`;
}

export default function TechCallsScreen() {
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;
  const [activeTab, setActiveTab] = useState<Tab>("clients");

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Calls" />

      {/* ── Tab switcher ── */}
      <View style={[styles.tabBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        {(["clients", "team"] as Tab[]).map((t) => {
          const active = activeTab === t;
          return (
            <Pressable
              key={t}
              onPress={() => setActiveTab(t)}
              style={[
                styles.tabBtn,
                active && { backgroundColor: colors.surface, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
              ]}
            >
              <Text style={[styles.tabLabel, { color: active ? colors.textPrimary : colors.textSecondary }]}>
                {t === "clients" ? "Clients" : "Team"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>
        {activeTab === "clients" ? (
          <View style={styles.list}>
            {MOCK_CALLS.map((call) => {
              const icon = CALL_ICONS[call.type];
              return (
                <View
                  key={call.id}
                  style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  {/* Type icon */}
                  <View style={[styles.iconWrap, { backgroundColor: icon.color + "18" }]}>
                    <Ionicons name={icon.name} size={18} color={icon.color} />
                  </View>

                  {/* Info */}
                  <View style={styles.info}>
                    <Text
                      style={[
                        styles.name,
                        { color: call.type === "missed" ? "#EF4444" : colors.textPrimary },
                      ]}
                    >
                      {call.name}
                    </Text>
                    <Text style={[styles.meta, { color: colors.textTertiary }]}>
                      {call.type.charAt(0).toUpperCase() + call.type.slice(1)}
                      {call.duration ? ` · ${call.duration}` : ""}
                      {" · "}{timeLabel(call.time)}
                    </Text>
                  </View>

                  {/* Call back */}
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${call.phone.replace(/\D/g, "")}`)}
                    style={[styles.callBtn, { borderColor: colors.border }]}
                    hitSlop={8}
                  >
                    <Ionicons name="call-outline" size={18} color={colors.primary} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : (
          <TeamContacts mode="call" />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  tabBar: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.full,
    padding: 3,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.full,
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
  },

  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

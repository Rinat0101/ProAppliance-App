import React from "react";
import { StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTab } from "~/components/haptic-tab";
import { IconSymbol } from "~/components/ui/icon-symbol";
import { useAppTheme } from "~/components/theme/AppThemeContext";

import {
  LightColors,
  DarkColors,
  Spacing as spacing,
  Radius as radii,
  Typography as typography,
  Shadows as shadows,
} from "~/styles";

function TabIcon({ icon }: { icon: React.ReactNode }) {
  return <View style={styles.iconWrapper}>{icon}</View>;
}

export default function TechTabLayout() {
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const theme = mode === "dark" ? DarkColors : LightColors;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingBottom: Math.max(insets.bottom, spacing.sm),
            height: 64 + Math.max(insets.bottom, spacing.sm),
          },
        ],
        tabBarLabelStyle: {
          ...styles.label,
          color: theme.textSecondary,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <TabIcon icon={<IconSymbol size={26} name="house.fill" color={color} />} />
          ),
        }}
      />

      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color }) => (
            <TabIcon icon={<IconSymbol size={26} name="calendar" color={color} />} />
          ),
        }}
      />

      <Tabs.Screen
        name="clients"
        options={{
          title: "Clients",
          tabBarIcon: ({ color }) => (
            <TabIcon icon={<IconSymbol size={26} name="person.2.fill" color={color} />} />
          ),
        }}
      />

      <Tabs.Screen
        name="support"
        options={{
          title: "Support",
          tabBarIcon: ({ color }) => (
            <TabIcon icon={<IconSymbol size={26} name="headphones" color={color} />} />
          ),
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: "Account",
          tabBarIcon: ({ color }) => (
            <TabIcon icon={<Ionicons name="person-circle-outline" size={26} color={color} />} />
          ),
        }}
      />

      {/* Hidden from tab bar */}
      <Tabs.Screen name="map"      options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="calls"    options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopLeftRadius: radii.nav,
    borderTopRightRadius: radii.nav,
    position: "absolute",
    ...shadows.sheet,
  },
  label: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
});

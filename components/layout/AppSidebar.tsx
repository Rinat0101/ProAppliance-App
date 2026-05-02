import React from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  LightColors,
  DarkColors,
  Spacing,
  Radius,
  Typography,
} from "~/styles";
import { useAppTheme } from "~/components/theme/AppThemeContext";

type SidebarItem = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
};

type AppSidebarProps = {
  visible: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
};

const MAIN_ITEMS: SidebarItem[] = [
  { title: "Jobs", icon: "briefcase-outline", route: "/jobs" },
  { title: "Leads", icon: "sparkles-outline", route: "/leads" },
  { title: "Invoices", icon: "receipt-outline", route: "/invoices" },
  { title: "Estimates", icon: "document-text-outline", route: "/estimates" },
  { title: "Expenses", icon: "wallet-outline", route: "/expenses" },
];

const SECONDARY_ITEMS: SidebarItem[] = [
  { title: "Settings", icon: "settings-outline", route: "/settings" },
  { title: "Help", icon: "help-circle-outline", route: "/help" },
];

export function AppSidebar({
  visible,
  onClose,
  onNavigate,
}: AppSidebarProps) {
  const { mode, toggleTheme } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const userName = "Anastasiia Husieva";
  const companyName = "ProAppliance";

  const renderItem = (item: SidebarItem) => (
    <Pressable
      key={item.title}
      style={styles.item}
      onPress={() => {
        if (item.route && onNavigate) onNavigate(item.route);
        onClose();
      }}
    >
      <View style={styles.itemLeft}>
        <Ionicons
          name={item.icon}
          size={20}
          color={colors.textPrimary}
        />
        <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
          {item.title}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.textTertiary}
      />
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      {/* OVERLAY */}
      <Pressable style={styles.overlay} onPress={onClose} />

      {/* DRAWER */}
      <View style={[styles.drawer, { backgroundColor: colors.surface }]}>
        {/* BRAND HEADER — extends to top */}
        <View style={[styles.brandHeader, { backgroundColor: colors.header }]}>
          <SafeAreaView edges={["top"]}>
            <Text
              style={[
                styles.brandTitle,
                { color: colors.headerForeground },
              ]}
            >
              {companyName}
            </Text>
          </SafeAreaView>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          {MAIN_ITEMS.map(renderItem)}

          <View
            style={[
              styles.divider,
              { backgroundColor: colors.divider },
            ]}
          />

          {SECONDARY_ITEMS.map(renderItem)}
        </View>

        {/* FOOTER */}
        <SafeAreaView
          edges={["bottom"]}
          style={[
            styles.footer,
            { borderTopColor: colors.divider },
          ]}
        >
          <View style={styles.accountRow}>
            <View style={styles.accountLeft}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>

              <Text
                style={[
                  styles.userName,
                  { color: colors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {userName}
              </Text>
            </View>

            <View style={styles.accountActions}>
              {/* THEME TOGGLE */}
              <Pressable style={styles.footerBtn} onPress={toggleTheme}>
                <Ionicons
                  name={mode === "dark" ? "sunny-outline" : "moon-outline"}
                  size={18}
                  color={colors.textPrimary}
                />
              </Pressable>

              {/* LOGOUT */}
              <Pressable
                style={styles.footerBtn}
                onPress={() => console.log("Logout")}
              >
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color={colors.textPrimary}
                />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "82%",
    maxWidth: 360,
  },

  /* BRAND */
  brandHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  brandTitle: {
    ...Typography.h1,
  },

  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
  },

  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },

  itemTitle: {
    ...Typography.body,
    fontSize: 22,   
    lineHeight: 30,
    fontWeight: "500",
  },

  divider: {
    height: 1,
    marginVertical: Spacing.lg,
  },

  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
  },

  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  accountLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },

  userName: {
    ...Typography.body,
    fontWeight: "600",
    flexShrink: 1,
  },

  accountActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  footerBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
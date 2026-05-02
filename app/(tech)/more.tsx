import React, { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { useAuth } from "~/contexts/AuthContext";
import { AppHeader } from "~/components/layout/AppHeader";
import { mockUser } from "~/data/mockData";
import { DarkColors, LightColors, Spacing, Radius } from "~/styles";

/* ------------------------------------------------------------------ */
/*  Row component                                                       */
/* ------------------------------------------------------------------ */

function Row({
  icon,
  iconBg,
  label,
  onPress,
  isLast,
  right,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  label: string;
  onPress?: () => void;
  isLast?: boolean;
  right?: React.ReactNode;
  colors: typeof LightColors | typeof DarkColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
        pressed && onPress && { opacity: 0.65 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg + "18" }]}>
        <Ionicons name={icon} size={20} color={iconBg} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
      {right ?? (
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen                                                              */
/* ------------------------------------------------------------------ */

export default function AccountScreen() {
  const { mode, toggleTheme } = useAppTheme();
  const { logout } = useAuth();
  const colors = mode === "dark" ? DarkColors : LightColors;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [photo, setPhoto] = useState<string | null>(null);

  const initials = mockUser.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Allow access to your photos to set a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  }

  const themeToggle = (
    <Pressable onPress={toggleTheme} style={styles.themeToggleBtn}>
      <View style={[styles.themeBtn, mode === "light" && styles.themeBtnActive]}>
        <Ionicons name="sunny" size={17} color={mode === "light" ? "#F59E0B" : "rgba(255,255,255,0.45)"} />
      </View>
      <View style={[styles.themeBtn, mode === "dark" && styles.themeBtnActive]}>
        <Ionicons name="moon" size={17} color={mode === "dark" ? "#6366F1" : "rgba(255,255,255,0.45)"} />
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Account" hideMenu rightElement={themeToggle} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + "22" }]}>
                <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
              </View>
            )}
            <Pressable
              onPress={pickPhoto}
              style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}
            >
              <Ionicons name="pencil" size={12} color="#fff" />
            </Pressable>
          </View>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{mockUser.name}</Text>
          <Text style={[styles.userSub, { color: colors.textSecondary }]}>Technician</Text>
        </View>

        {/* Block 1: Personal */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row icon="calendar-outline"   iconBg="#3B82F6" label="My Schedule"        colors={colors} onPress={() => router.push("/my-schedule")} />
          <Row icon="map-outline"        iconBg="#10B981" label="My Service Area"     colors={colors} onPress={() => {}} />
          <Row icon="person-outline"     iconBg="#8B5CF6" label="My Data"            colors={colors} onPress={() => {}} isLast />
        </View>

        {/* Block 2: Preferences */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row icon="notifications-outline" iconBg="#F59E0B" label="Notifications"   colors={colors} onPress={() => router.push("/notifications")} />
          <Row icon="shield-checkmark-outline" iconBg="#EF4444" label="Security"     colors={colors} onPress={() => {}} isLast />
        </View>

        {/* Block 3: Info */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row icon="document-text-outline" iconBg="#6B7280" label="Terms & Conditions" colors={colors} onPress={() => {}} />
          <Row icon="lock-closed-outline"   iconBg="#6B7280" label="Privacy Policy"     colors={colors} onPress={() => {}} />
          <Row icon="help-circle-outline"   iconBg="#6B7280" label="FAQ"                colors={colors} onPress={() => {}} isLast />
        </View>

        {/* Logout */}
        <Pressable
          onPress={() => {
            Alert.alert("Log Out", "Are you sure you want to log out?", [
              { text: "Cancel", style: "cancel" },
              { text: "Log Out", style: "destructive", onPress: logout },
            ]);
          }}
          style={({ pressed }) => [
            styles.card,
            styles.logoutCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <View style={[styles.rowIcon, { backgroundColor: "#EF444418" }]}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </View>
          <Text style={styles.logoutLabel}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  themeToggleBtn: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 22,
    padding: 3,
    gap: 2,
  },
  themeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  themeBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },

  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },

  // Avatar
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: 6,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 4,
  },
  avatarImg: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontSize: 32,
    fontWeight: "700",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  userSub: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Card
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: "hidden",
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },

  // Logout
  logoutCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
  },
  logoutLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#EF4444",
  },
});

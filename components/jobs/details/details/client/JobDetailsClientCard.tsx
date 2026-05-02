import React, { useRef, useState } from "react";
import {
  Animated,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { DarkColors, LightColors, Radius, Spacing, Typography } from "~/styles";
import type { JobClient } from "./types";

type Props = {
  client: JobClient;
  onViewDetails: () => void;
};

const MAP_OPTIONS = [
  {
    key: "apple",
    label: "Open with Maps",
    icon: "map-outline" as const,
    getUrl: (q: string) => `maps://?q=${q}`,
    fallback: (q: string) => `https://maps.apple.com/?q=${q}`,
  },
  {
    key: "google",
    label: "Open with Google Maps",
    icon: "navigate-outline" as const,
    getUrl: (q: string) => `comgooglemaps://?q=${q}`,
    fallback: (q: string) => `https://maps.google.com/?q=${q}`,
  },
  {
    key: "waze",
    label: "Open with Waze",
    icon: "car-outline" as const,
    getUrl: (q: string) => `waze://?q=${q}&navigate=yes`,
    fallback: (q: string) => `https://waze.com/ul?q=${q}`,
  },
];

export function JobDetailsClientCard({ client, onViewDetails }: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const [mapsOpen, setMapsOpen] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const fullAddress = [client.address, client.city, client.state, client.zip]
    .filter(Boolean)
    .join(", ");
  const encodedAddress = encodeURIComponent(fullAddress);

  function openMapsSheet() {
    setMapsOpen(true);
    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }

  function closeMapsSheet(): Promise<void> {
    return new Promise((resolve) => {
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        setMapsOpen(false);
        setTimeout(resolve, 40);
      });
    });
  }

  async function openMap(opt: (typeof MAP_OPTIONS)[number]) {
    await closeMapsSheet();
    const url = opt.getUrl(encodedAddress);
    const canOpen = await Linking.canOpenURL(url);
    Linking.openURL(canOpen ? url : opt.fallback(encodedAddress));
  }

  const sheetTranslate = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });
  const overlayOpacity = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });

  function callClient() {
    Linking.openURL(`tel:${client.phone.replace(/\D/g, "")}`);
  }

  function messageClient() {
    Linking.openURL(`sms:${client.phone.replace(/\D/g, "")}`);
  }

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Client</Text>
          <Pressable onPress={onViewDetails} hitSlop={8}>
            <Text style={[styles.viewLink, { color: colors.primary }]}>View client details</Text>
          </Pressable>
        </View>

        {/* Name row */}
        <Pressable onPress={onViewDetails} style={styles.row}>
          <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.rowText, { color: colors.textPrimary }]} numberOfLines={1}>
            {client.name}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </Pressable>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Address row — tapping opens maps picker */}
        <Pressable onPress={openMapsSheet} style={styles.row}>
          <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.rowText, { color: colors.textPrimary }]} numberOfLines={2}>
            {fullAddress}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </Pressable>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Phone row */}
        <View style={styles.row}>
          <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.rowText, { color: colors.textPrimary }]}>{client.phone}</Text>
          <Pressable onPress={callClient} style={[styles.iconBtn, { borderColor: colors.border }]}>
            <Ionicons name="call-outline" size={17} color={colors.textPrimary} />
          </Pressable>
          <Pressable onPress={messageClient} style={[styles.iconBtn, { borderColor: colors.border }]}>
            <Ionicons name="chatbubble-outline" size={17} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Add service plan */}
        <Pressable style={styles.addRow} hitSlop={8}>
          <Text style={[styles.addLink, { color: colors.primary }]}>+ Add service plan</Text>
        </Pressable>
      </View>

      {/* Maps picker sheet — plain Modal, not inside another Modal */}
      {mapsOpen && (
        <Modal transparent animationType="none" onRequestClose={closeMapsSheet}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeMapsSheet} />
          </Animated.View>
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                transform: [{ translateY: sheetTranslate }],
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            {MAP_OPTIONS.map((opt, i) => (
              <React.Fragment key={opt.key}>
                {i > 0 && <View style={[styles.sheetDivider, { backgroundColor: colors.border }]} />}
                <Pressable
                  onPress={() => openMap(opt)}
                  style={({ pressed }) => [
                    styles.sheetRow,
                    pressed && { backgroundColor: colors.muted },
                  ]}
                >
                  <Ionicons name={opt.icon} size={22} color={colors.textPrimary} />
                  <Text style={[styles.sheetLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                </Pressable>
              </React.Fragment>
            ))}

            <View style={{ height: Spacing.xl }} />
          </Animated.View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    ...Typography.sectionTitle,
    fontWeight: "700",
  },
  viewLink: { fontSize: 13, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  rowText: { ...Typography.body, flex: 1 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { height: 1, marginHorizontal: Spacing.md },
  addRow: { paddingHorizontal: Spacing.md, paddingVertical: 10 },
  addLink: { fontSize: 14, fontWeight: "600" },

  /* maps sheet */
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  sheetDivider: { height: 1, marginHorizontal: Spacing.sm },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  sheetLabel: { fontSize: 16, fontWeight: "500" },
});

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { DarkColors, LightColors, Radius, Spacing, Typography } from "~/styles";
import type { AppColors } from "~/styles/colors";
import {
  SHEET_HEIGHT_PX,
  SHEET_HEIGHT_STYLE,
} from "~/components/sheets/sheetConstants";

import type { JobClient } from "./types";

type Props = {
  visible: boolean;
  client: JobClient;
  onClose: () => void;
  onEdit: () => void;
};

const ANIM_MS = 220;

export function JobDetailsClientViewModal({
  visible,
  client,
  onClose,
  onEdit,
}: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const [mounted, setMounted] = useState(visible);

  /** Backdrop fade */
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  /** Sheet slide */
  const sheetTranslate = useRef(new Animated.Value(SHEET_HEIGHT_PX)).current;

  const close = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: ANIM_MS,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslate, {
        toValue: SHEET_HEIGHT_PX,
        duration: ANIM_MS,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
        onClose();
      }
    });
  };

  useEffect(() => {
    if (visible) {
      setMounted(true);

      overlayOpacity.setValue(0);
      sheetTranslate.setValue(SHEET_HEIGHT_PX);

      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: ANIM_MS,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslate, {
          toValue: 0,
          duration: ANIM_MS,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const fullAddress = useMemo(() => {
    return [client.address, client.city, client.state, client.zip]
      .filter(Boolean)
      .join(", ");
  }, [client]);

  if (!mounted) return null;

  return (
    <Modal transparent visible={mounted} animationType="none">
      {/* ---------- BACKDROP ---------- */}
      <Pressable style={styles.backdrop} onPress={close}>
        <Animated.View
          style={[styles.backdropFill, { opacity: overlayOpacity }]}
        />
      </Pressable>

      {/* ---------- SHEET ---------- */}
      <Animated.View
        style={[
          styles.sheet,
          {
            height: SHEET_HEIGHT_STYLE,
            backgroundColor: colors.background,
            transform: [{ translateY: sheetTranslate }],
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Ionicons
              name="person-outline"
              size={22}
              color={colors.textPrimary}
            />
            <Text
              numberOfLines={1}
              style={[styles.headerTitle, { color: colors.textPrimary }]}
            >
              {client.name}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              onPress={() => {
                close();
                requestAnimationFrame(onEdit);
              }}
              hitSlop={10}
              style={({ pressed }) => [
                styles.squareIconBtn,
                {
                  backgroundColor:
                    mode === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "#F2F4F6",
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons name="pencil" size={18} color={colors.textPrimary} />
            </Pressable>

            <Pressable
              onPress={close}
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeBtn,
                { opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={{ paddingBottom: Spacing.lg }}
          showsVerticalScrollIndicator
        >
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <InfoRow
              icon="person-outline"
              text={client.name}
              colors={colors}
            />
            <InfoRow
              icon="location-outline"
              text={fullAddress}
              colors={colors}
            />
            <InfoRow
              icon="call-outline"
              text={client.phone}
              colors={colors}
            />
          </View>

          <NavItem
            icon="hammer-outline"
            title="Jobs"
            subtitle={`${client.jobsCount ?? 0} jobs`}
            onPress={() => console.log("Client jobs")}
            iconColor={colors.primary}
            colors={colors}
          />

          <NavItem
            icon="receipt-outline"
            title="Invoices"
            subtitle={`${client.invoicesCount ?? 0} invoices`}
            onPress={() => console.log("Client invoices")}
            iconColor={colors.textSecondary}
            colors={colors}
          />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

/* ---------- HELPERS ---------- */

function InfoRow({
  icon,
  text,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  colors: AppColors;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text style={[styles.rowText, { color: colors.textPrimary }]}>{text}</Text>
    </View>
  );
}

function NavItem({
  icon,
  title,
  subtitle,
  onPress,
  iconColor,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  iconColor: string;
  colors: AppColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navItem,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.navLeft}>
        <Ionicons name={icon} size={20} color={iconColor} />
        <View>
          <Text style={[styles.navTitle, { color: colors.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.navSub, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.textSecondary}
      />
    </Pressable>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: "hidden",
  },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },

  headerTitle: {
    ...Typography.h2,
    fontWeight: "700",
  },

  headerRight: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },

  squareIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  body: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  infoCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 6,
  },

  rowText: {
    ...Typography.body,
    flex: 1,
  },

  navItem: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  navLeft: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "center",
  },

  navTitle: {
    ...Typography.body,
    fontWeight: "700",
  },

  navSub: {
    ...Typography.caption,
    marginTop: 2,
  },
});
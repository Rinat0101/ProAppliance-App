import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { LightColors, DarkColors, Spacing, Typography, Radius } from "~/styles";
import { Card } from "~/styles/cards"; // <-- make sure this exports Card.card

import {
  SHEET_HEIGHT_PX,
  SHEET_HEIGHT_STYLE,
} from "~/components/sheets/sheetConstants";

import {
  getAllStatusesInOrder,
  getStatusColor,
} from "~/config/jobs/jobStatuses";

type Props = {
  value: string;
  onChange: (next: string) => void;
};

const ANIM_MS = 220;

export function JobDetailsStatus({ value, onChange }: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslate = useRef(new Animated.Value(SHEET_HEIGHT_PX)).current;

  const rows = getAllStatusesInOrder();

  const selectedBg =
    mode === "dark" ? "rgba(51,166,140,0.18)" : colors.primaryLight;

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
        setOpen(false);
      }
    });
  };

  useEffect(() => {
    if (open) {
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
    }
  }, [open]);

  return (
    <>
      {/* ---------- Status Card ---------- */}
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          Card.card, // ✅ corrected usage
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.cardTop}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Status
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </View>

        <View
          style={[
            styles.statusPill,
            { backgroundColor: getStatusColor(value) },
          ]}
        >
          <Text style={styles.statusPillText}>{value}</Text>
        </View>
      </Pressable>

      {/* ---------- Bottom Sheet ---------- */}
      {mounted && (
        <Modal transparent visible animationType="none">
          {/* Backdrop */}
          <Pressable style={styles.backdrop} onPress={close}>
            <Animated.View
              style={[
                styles.backdropFill,
                {
                  opacity: overlayOpacity,
                  backgroundColor:
                    mode === "dark"
                      ? "rgba(0,0,0,0.6)"
                      : "rgba(0,0,0,0.45)",
                },
              ]}
            />
          </Pressable>

          {/* Sheet */}
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
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                Select Status
              </Text>
              <Pressable onPress={close} hitSlop={10}>
                <Ionicons
                  name="close"
                  size={22}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            {/* Rows */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetContent}
            >
              {rows.map((row, i) => {
                if (row.type === "groupHeader") {
                  return (
                    <View key={`header-${i}`} style={styles.groupHeader}>
                      <View
                        style={[styles.groupDot, { backgroundColor: row.color }]}
                      />
                      <Text
                        style={[
                          styles.groupTitle,
                          {
                            color:
                              mode === "dark"
                                ? colors.textTertiary
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        {row.label}
                      </Text>
                    </View>
                  );
                }

                const isSelected = value === row.status;

                return (
                  <Pressable
                    key={`status-${i}`}
                    onPress={() => {
                      onChange(row.status);
                      close();
                    }}
                    style={[
                      styles.row,
                      {
                        backgroundColor: isSelected
                          ? selectedBg
                          : mode === "dark"
                          ? colors.muted
                          : colors.surface,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[styles.leftDot, { backgroundColor: row.color }]}
                    />
                    <Text
                      style={[styles.rowLabel, { color: colors.textPrimary }]}
                    >
                      {row.status}
                    </Text>
                    <View
                      style={[
                        styles.radio,
                        {
                          borderColor: isSelected
                            ? colors.primary
                            : colors.textTertiary,
                        },
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={[
                            styles.radioInner,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },

  cardTitle: {
    ...Typography.sectionTitle,
    fontWeight: "700",
  },

  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  statusPillText: {
    ...Typography.body,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  backdropFill: {
    ...StyleSheet.absoluteFillObject,
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

  sheetHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sheetTitle: {
    ...Typography.h2,
    fontWeight: "800",
  },

  sheetContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  row: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },

  leftDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
  },

  rowLabel: {
    flex: 1,
    ...Typography.body,
    fontWeight: "600",
  },

  radio: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },

  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  groupDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },

  groupTitle: {
    ...Typography.body,
    fontWeight: "700",
  },
});
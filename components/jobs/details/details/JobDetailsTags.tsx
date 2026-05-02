import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { LightColors, DarkColors, Spacing, Typography, Radius } from "~/styles";
import {
  SHEET_HEIGHT_PX,
  SHEET_HEIGHT_STYLE,
} from "~/components/sheets/sheetConstants";

import { JOB_TAGS, JobTagCategory } from "~/config/jobs/jobTags";

type Props = {
  value: string[]; // selected tag keys
  onChange: (next: string[]) => void;
};

const ANIM_MS = 220;

export function JobDetailsTags({ value, onChange }: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslate = useRef(
    new Animated.Value(SHEET_HEIGHT_PX)
  ).current;

  const selectedSet = useMemo(() => new Set(value), [value]);

  const grouped = useMemo(() => {
    const map: Record<JobTagCategory, string[]> = {
      jobType: [],
      appliance: [],
      special: [],
    };

    Object.entries(JOB_TAGS).forEach(([key, cfg]) => {
      map[cfg.category].push(key);
    });

    return map;
  }, []);

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

  const toggleTag = (tag: string) => {
    const next = new Set(selectedSet);
    next.has(tag) ? next.delete(tag) : next.add(tag);
    onChange([...next]);
  };

  return (
    <>
      {/* ---------- CARD ---------- */}
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Tags
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </View>

        <View style={styles.pills}>
          {value.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>
              No tags selected
            </Text>
          ) : (
            value.map((key) => {
              const cfg = JOB_TAGS[key];
              const palette = mode === "dark" ? cfg.dark : cfg.light;

              return (
                <View
                  key={key}
                  style={[
                    styles.pill,
                    { backgroundColor: palette.bg },
                  ]}
                >
                  <Text style={[styles.pillText, { color: palette.text }]}>
                    {cfg.label}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </Pressable>

      {/* ---------- SHEET ---------- */}
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
                Select Tags
              </Text>
              <Pressable onPress={close}>
                <Ionicons
                  name="close"
                  size={22}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.sheetContent}
              showsVerticalScrollIndicator
            >
              {Object.entries(grouped).map(([category, tags]) => (
                <View key={category}>
                  <Text
                    style={[
                      styles.groupTitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {category === "jobType"
                      ? "Job Types"
                      : category === "appliance"
                      ? "Appliances"
                      : "Special"}
                  </Text>

                  {tags.map((key) => {
                    const cfg = JOB_TAGS[key];
                    const palette = mode === "dark" ? cfg.dark : cfg.light;
                    const selected = selectedSet.has(key);

                    return (
                      <Pressable
                        key={key}
                        onPress={() => toggleTag(key)}
                        style={[
                          styles.row,
                          {
                            borderColor: selected
                              ? colors.primary
                              : colors.border,
                            backgroundColor: colors.surface,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.pill,
                            { backgroundColor: palette.bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.pillText,
                              { color: palette.text },
                            ]}
                          >
                            {cfg.label}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.checkbox,
                            {
                              borderColor: colors.primary,
                              backgroundColor: selected
                                ? colors.primary
                                : "transparent",
                            },
                          ]}
                        >
                          {selected && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="#fff"
                            />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        </Modal>
      )}
    </>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },

  title: {
    ...Typography.sectionTitle,
  },

  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },

  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  pillText: {
    ...Typography.body,
    fontWeight: "600",
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

  groupTitle: {
    ...Typography.body,
    fontWeight: "700",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  row: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
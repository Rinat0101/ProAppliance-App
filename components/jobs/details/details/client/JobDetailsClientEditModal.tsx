import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { DarkColors, LightColors, Radius, Spacing, Typography } from "~/styles";
import type { AppColors } from "~/styles/colors";
import { ButtonBase, ButtonVariants } from "~/styles/buttons";
import {
  SHEET_HEIGHT_PX,
  SHEET_HEIGHT_STYLE,
} from "~/components/sheets/sheetConstants";

import type { JobClient } from "./types";

type Props = {
  visible: boolean;
  client: JobClient;
  onClose: () => void;
  onSave: (next: JobClient) => void;
};

const ANIM_MS = 220;

export function JobDetailsClientEditModal({
  visible,
  client,
  onClose,
  onSave,
}: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;
  const insets = useSafeAreaInsets(); // ✅ SAFE AREA FIX

  const [mounted, setMounted] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslate = useRef(
    new Animated.Value(SHEET_HEIGHT_PX)
  ).current;

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  /* ---------- OPEN / CLOSE ---------- */

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setName(client.name ?? "");
      setAddress(client.address ?? "");
      setPhone(client.phone ?? "");

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

  const close = () => {
    Keyboard.dismiss();

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

  const canSave = useMemo(() => name.trim().length > 0, [name]);

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none">
      {/* ---------- BACKDROP ---------- */}
      <Pressable style={styles.backdrop} onPress={close}>
        <Animated.View
          style={[
            styles.backdropFill,
            { opacity: overlayOpacity },
          ]}
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
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* ---------- HEADER ---------- */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Ionicons
                name="pencil-outline"
                size={22}
                color={colors.textPrimary}
              />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Edit Client
              </Text>
            </View>

            <Pressable onPress={close} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* ---------- CONTENT ---------- */}
          <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
            <ScrollView
              style={styles.body}
              contentContainerStyle={{ paddingBottom: Spacing.lg }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <Field
                label="Name"
                value={name}
                onChangeText={setName}
                colors={colors}
              />
              <Field
                label="Address"
                value={address}
                onChangeText={setAddress}
                colors={colors}
              />
              <Field
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                colors={colors}
              />
            </ScrollView>
          </Pressable>

          {/* ---------- FOOTER ---------- */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: colors.border,
                paddingBottom: Spacing.md + insets.bottom, // ✅ HOME BAR FIX
              },
            ]}
          >
            <Pressable
              disabled={!canSave}
              onPress={() => {
                onSave({
                  ...client,
                  name: name.trim(),
                  address: address.trim(),
                  phone: phone.trim(),
                });
                close();
              }}
              style={[
                ButtonBase,
                ButtonVariants.primary(colors),
                !canSave && { opacity: 0.5 },
              ]}
            >
              <Text style={styles.saveText}>Save Changes</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

/* ---------- FIELD ---------- */

function Field({
  label,
  value,
  onChangeText,
  colors,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  colors: AppColors;
  keyboardType?: "default" | "phone-pad";
}) {
  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
        placeholder={label}
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.textPrimary,
          },
        ]}
      />
    </View>
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
  },

  headerTitle: {
    ...Typography.h2,
    fontWeight: "800",
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

  label: {
    ...Typography.body,
    fontWeight: "700",
    marginBottom: 8,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
  },

  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },

  saveText: {
    ...Typography.h2,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
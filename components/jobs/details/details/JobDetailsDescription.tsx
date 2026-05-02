import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Easing,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { LightColors, DarkColors, Spacing, Typography, Radius } from "~/styles";
import { ButtonBase, ButtonVariants } from "~/styles/buttons";

type Props = {
  value?: string;
  placeholder?: string;
  onSave?: (nextValue: string) => void;

  /** optional */
  title?: string;
  sheetTitle?: string;
  saveLabel?: string;
};

export function JobDetailsDescription({
  value = "",
  placeholder = "No description",
  onSave,
  title = "Description",
  sheetTitle = "Edit Description",
  saveLabel = "Save Description",
}: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!open) setDraft(value);
  }, [value, open]);

  const translateY = useRef(new Animated.Value(40)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      translateY.setValue(40);
      sheetOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sheetOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [open, translateY, sheetOpacity]);

  const canSave = useMemo(() => {
    const a = (draft ?? "").trim();
    const b = (value ?? "").trim();
    return a !== b;
  }, [draft, value]);

  const closeSheet = () => {
    setOpen(false);
    setDraft(value);
  };

  const handleSave = () => {
    const next = (draft ?? "").trim();
    onSave?.(next);
    setOpen(false);
  };

  return (
    <>
      {/* ---------- CARD ---------- */}
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <View style={styles.cardTop}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {title}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </View>

        <Text
          numberOfLines={2}
          style={[
            styles.cardText,
            { color: colors.textSecondary },
          ]}
        >
          {value?.trim() ? value : placeholder}
        </Text>
      </Pressable>

      {/* ---------- SHEET ---------- */}
      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={closeSheet} />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <Animated.View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  transform: [{ translateY }],
                  opacity: sheetOpacity,
                },
              ]}
            >
              {/* Header */}
              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderLeft}>
                  <Ionicons
                    name="create-outline"
                    size={22}
                    color={colors.textPrimary}
                  />
                  <Text
                    style={[styles.sheetTitle, { color: colors.textPrimary }]}
                  >
                    {sheetTitle}
                  </Text>
                </View>

                <Pressable
                  onPress={closeSheet}
                  hitSlop={10}
                  style={styles.closeBtn}
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>

              {/* Input */}
              <View
                style={[
                  styles.inputWrap,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={placeholder}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  textAlignVertical="top"
                  style={[
                    styles.input,
                    { color: colors.textPrimary },
                  ]}
                />
              </View>

              {/* ---------- SAVE BUTTON (UNIFIED) ---------- */}
              <Pressable
                onPress={handleSave}
                disabled={!onSave || !canSave}
                style={[
                  ButtonBase,
                  ButtonVariants.primary(colors),
                  {
                    marginTop: Spacing.lg,
                    opacity: !onSave || !canSave ? 0.45 : 1,
                  },
                ]}
              >
                <Text style={styles.saveText}>{saveLabel}</Text>
              </Pressable>

              <View style={{ height: Spacing.md }} />
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  cardTitle: {
    ...Typography.sectionTitle,
    fontWeight: "700",
  },

  cardText: {
    ...Typography.body,
    fontSize: 15,
    lineHeight: 22,
  },

  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
  },

  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },

  sheetHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  sheetTitle: {
    ...Typography.h2,
    fontWeight: "800",
  },

  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  inputWrap: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    minHeight: 230,
  },

  input: {
    ...Typography.body,
    fontSize: 16,
    flex: 1,
  },

  saveText: {
    ...Typography.h2,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
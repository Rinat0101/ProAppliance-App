import React, { useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { LightColors, DarkColors, Spacing, Radius } from "~/styles";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type ActionKey = "start" | "eta" | "pay" | "note" | "attach";

type AttachedFile = {
  uri: string;
  name: string;
  mimeType?: string;
  isImage: boolean;
};

type Props = {
  onStart?: () => void;
  onETA?: () => void;
  onPay?: () => void;
  onNote?: () => void;
  onAttachFiles?: (files: AttachedFile[]) => void;
};

/* ------------------------------------------------------------------ */
/*  Attach sheet options                                                */
/* ------------------------------------------------------------------ */

const ATTACH_OPTIONS = [
  { key: "camera", label: "Open camera", icon: "camera-outline" as const },
  { key: "gallery", label: "Choose from gallery", icon: "image-outline" as const },
  { key: "file", label: "Choose a file", icon: "document-outline" as const },
];

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function JobDetailsQuickActions({
  onStart,
  onETA,
  onPay,
  onNote,
  onAttachFiles,
}: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;
  const insets = useSafeAreaInsets();

  const [attachOpen, setAttachOpen] = React.useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  function openAttach() {
    setAttachOpen(true);
    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }

  function closeAttach(): Promise<void> {
    return new Promise((resolve) => {
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setAttachOpen(false);
        // Give React one extra frame to unmount the Modal before the picker opens
        setTimeout(resolve, 50);
      });
    });
  }

  async function handleAttachOption(key: string) {
    await closeAttach();

    if (key === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Camera access is needed to take photos.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets.length > 0) {
        const files: AttachedFile[] = result.assets.map((a) => ({
          uri: a.uri,
          name: a.fileName ?? `photo_${Date.now()}.jpg`,
          mimeType: a.mimeType ?? "image/jpeg",
          isImage: true,
        }));
        onAttachFiles?.(files);
      }
      return;
    }

    if (key === "gallery") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Photo library access is needed to attach photos.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsMultipleSelection: true,
        selectionLimit: 10,
      });
      if (!result.canceled && result.assets.length > 0) {
        const files: AttachedFile[] = result.assets.map((a) => ({
          uri: a.uri,
          name: a.fileName ?? `photo_${Date.now()}.jpg`,
          mimeType: a.mimeType ?? "image/jpeg",
          isImage: true,
        }));
        onAttachFiles?.(files);
      }
      return;
    }

    if (key === "file") {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const files: AttachedFile[] = result.assets.map((a) => ({
          uri: a.uri,
          name: a.name,
          mimeType: a.mimeType ?? undefined,
          isImage: (a.mimeType ?? "").startsWith("image/"),
        }));
        onAttachFiles?.(files);
      }
      return;
    }
  }

  const sheetTranslate = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const overlayOpacity = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  /* ── Action definitions ── */
  type ActionDef = {
    key: ActionKey;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    onPress: () => void;
  };

  const ACTIONS: ActionDef[] = [
    {
      key: "start",
      label: "Start",
      icon: "play-circle-outline",
      color: colors.primary,
      onPress: onStart ?? (() => {}),
    },
    {
      key: "eta",
      label: "ETA",
      icon: "navigate-outline",
      color: colors.primary,
      onPress: onETA ?? (() => {}),
    },
    {
      key: "pay",
      label: "Pay",
      icon: "cash-outline",
      color: colors.accent,
      onPress: onPay ?? (() => {}),
    },
    {
      key: "note",
      label: "Add note",
      icon: "create-outline",
      color: colors.info,
      onPress: onNote ?? (() => {}),
    },
    {
      key: "attach",
      label: "Attach",
      icon: "attach-outline",
      color: colors.textSecondary,
      onPress: openAttach,
    },
  ];

  return (
    <>
      <View style={styles.row}>
        {ACTIONS.map((a) => (
          <Pressable
            key={a.key}
            onPress={a.onPress}
            style={({ pressed }) => [
              styles.bubble,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name={a.icon} size={22} color={a.color} />
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {a.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Attach bottom sheet ── */}
      {attachOpen && (
        <Modal transparent animationType="none" onRequestClose={closeAttach}>
          {/* Overlay */}
          <Animated.View
            style={[styles.overlay, { opacity: overlayOpacity }]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={closeAttach} />
          </Animated.View>

          {/* Sheet */}
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: insets.bottom + Spacing.md,
                transform: [{ translateY: sheetTranslate }],
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
              Select attachments
            </Text>

            {ATTACH_OPTIONS.map((opt, i) => (
              <React.Fragment key={opt.key}>
                {i > 0 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
                <Pressable
                  onPress={() => handleAttachOption(opt.key)}
                  style={({ pressed }) => [
                    styles.optionRow,
                    pressed && { backgroundColor: colors.muted },
                  ]}
                >
                  <Ionicons name={opt.icon} size={22} color={colors.primary} />
                  <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              </React.Fragment>
            ))}
          </Animated.View>
        </Modal>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  bubble: {
    flex: 1,
    height: 64,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  pressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.85,
  },

  label: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },

  /* sheet */
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

  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },

  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },

  divider: {
    height: 1,
    marginHorizontal: Spacing.sm,
  },
});

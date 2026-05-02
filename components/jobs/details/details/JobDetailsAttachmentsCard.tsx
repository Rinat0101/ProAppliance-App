import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { DarkColors, LightColors, Radius, Spacing } from "~/styles";
import { ButtonBase, ButtonVariants } from "~/styles/buttons";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type AttachedFile = {
  uri: string;
  name: string;
  displayName: string;
  description: string;
  mimeType?: string;
  isImage: boolean;
  addedAt: number;
};

export type AttachmentsCardRef = {
  /** Opens the full attachments list page with add-sheet pre-shown */
  openAddSheet: () => void;
  /** Opens just the 3-option picker popup (no list page) */
  openPickerOnly: () => void;
};

type Props = {
  files: AttachedFile[];
  onFilesChange: (files: AttachedFile[]) => void;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function makeFile(raw: {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
}): AttachedFile {
  const name = raw.name ?? `file_${Date.now()}`;
  const mime = raw.mimeType ?? "";
  return {
    uri: raw.uri,
    name,
    displayName: "Mobile upload",
    description: "",
    mimeType: mime || undefined,
    isImage: mime.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(name),
    addedAt: Date.now(),
  };
}

/* ------------------------------------------------------------------ */
/*  Animated sheet hook (no Modal — rendered inline)                   */
/* ------------------------------------------------------------------ */

function useSheet() {
  const [visible, setVisible] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  function open() {
    setVisible(true);
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }

  function close(): Promise<void> {
    return new Promise((resolve) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        setTimeout(resolve, 40);
      });
    });
  }

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [320, 0] });
  const overlayOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] });

  return { visible, open, close, translateY, overlayOpacity };
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export const JobDetailsAttachmentsCard = forwardRef<AttachmentsCardRef, Props>(
function JobDetailsAttachmentsCard({ files, onFilesChange }, ref) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const [listOpen, setListOpen] = useState(false);

  // Which inline sheet is showing inside the modal
  const actionSheet = useSheet();
  const addSheet = useSheet();

  // Standalone picker sheet (used by the Attach quick-action button)
  const standaloneSheet = useSheet();

  useImperativeHandle(ref, () => ({
    openAddSheet() {
      setListOpen(true);
      setTimeout(() => addSheet.open(), 120);
    },
    openPickerOnly() {
      standaloneSheet.open();
    },
  }));

  // Row being acted on
  const [actionTarget, setActionTarget] = useState<number | null>(null);

  // Edit state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  /* ── helpers ── */

  function openActionSheet(index: number) {
    setActionTarget(index);
    actionSheet.open();
  }

  function openEdit(index: number) {
    setEditName(files[index].displayName);
    setEditDesc(files[index].description);
    setEditingIndex(index);
  }

  function saveEdit() {
    if (editingIndex === null) return;
    onFilesChange(
      files.map((f, i) =>
        i === editingIndex
          ? { ...f, displayName: editName.trim() || f.name, description: editDesc }
          : f
      )
    );
    setEditingIndex(null);
  }

  function confirmDelete(index: number) {
    Alert.alert("Remove attachment", "Are you sure you want to remove this attachment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          onFilesChange(files.filter((_, i) => i !== index));
          setEditingIndex(null);
        },
      },
    ]);
  }

  async function handleAddOption(key: string) {
    if (addSheet.visible) await addSheet.close();
    if (standaloneSheet.visible) await standaloneSheet.close();

    if (key === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Camera access is needed.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.85,
      });
      if (!result.canceled) {
        onFilesChange([
          ...files,
          ...result.assets.map((a) =>
            makeFile({ uri: a.uri, name: a.fileName, mimeType: a.mimeType ?? "image/jpeg" })
          ),
        ]);
      }
      return;
    }

    if (key === "gallery") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Photo library access is needed.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsMultipleSelection: true,
        selectionLimit: 10,
      });
      if (!result.canceled) {
        onFilesChange([
          ...files,
          ...result.assets.map((a) =>
            makeFile({ uri: a.uri, name: a.fileName, mimeType: a.mimeType ?? "image/jpeg" })
          ),
        ]);
      }
      return;
    }

    if (key === "file") {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (!result.canceled) {
        onFilesChange([
          ...files,
          ...result.assets.map((a) =>
            makeFile({ uri: a.uri, name: a.name, mimeType: a.mimeType })
          ),
        ]);
      }
    }
  }

  const count = files.length;
  const countLabel =
    count === 0 ? "No attachments" : `${count} attachment${count !== 1 ? "s" : ""}`;
  const editingFile = editingIndex !== null ? files[editingIndex] : null;

  /* ============================================================ */
  return (
    <>
      {/* ── Summary card ── */}
      <Pressable
        onPress={() => setListOpen(true)}
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
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Attachments</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="attach-outline" size={17} color={colors.textSecondary} />
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{countLabel}</Text>
        </View>
      </Pressable>

      {/* ============================================================ */}
      {/* FULL-SCREEN MODAL — list + edit + inline sheets               */}
      {/* ============================================================ */}
      <Modal
        visible={listOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (addSheet.visible) { addSheet.close(); return; }
          if (actionSheet.visible) { actionSheet.close(); return; }
          if (editingIndex !== null) { setEditingIndex(null); return; }
          setListOpen(false);
        }}
      >
        <SafeAreaView style={[styles.screen, { backgroundColor: colors.header }]}>

          {/* ── EDIT VIEW ── */}
          {editingFile !== null && editingIndex !== null ? (
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <View
                style={[
                  styles.header,
                  { backgroundColor: colors.header, borderBottomColor: colors.border },
                ]}
              >
                <Pressable
                  onPress={() => setEditingIndex(null)}
                  hitSlop={10}
                  style={styles.headerBtn}
                >
                  <Ionicons name="chevron-back" size={22} color={colors.primary} />
                </Pressable>
                <Text
                  numberOfLines={1}
                  style={[styles.headerTitle, { color: colors.primary }]}
                >
                  {editName || editingFile.displayName}
                </Text>
                <Pressable
                  onPress={() => confirmDelete(editingIndex)}
                  hitSlop={10}
                  style={styles.headerBtn}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.primary} />
                </Pressable>
              </View>

              <ScrollView
                style={{ flex: 1, backgroundColor: colors.background }}
                contentContainerStyle={styles.editContent}
                keyboardShouldPersistTaps="handled"
              >
                <View
                  style={[
                    styles.inputWrap,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                >
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    File name
                  </Text>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View
                  style={[
                    styles.textareaWrap,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                >
                  <TextInput
                    value={editDesc}
                    onChangeText={setEditDesc}
                    placeholder="Description"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    textAlignVertical="top"
                    style={[styles.textarea, { color: colors.textPrimary }]}
                  />
                </View>

                {editingFile.isImage && (
                  <Image
                    source={{ uri: editingFile.uri }}
                    style={styles.editPreview}
                    resizeMode="cover"
                  />
                )}
              </ScrollView>

              <View
                style={[
                  styles.saveBar,
                  { backgroundColor: colors.background, borderTopColor: colors.border },
                ]}
              >
                <Pressable
                  onPress={saveEdit}
                  style={[ButtonBase, ButtonVariants.primary(colors), styles.saveBtn]}
                >
                  <Text style={styles.saveBtnText}>Save</Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>

          ) : (
            /* ── LIST VIEW ── */
            <>
              <View
                style={[
                  styles.header,
                  { backgroundColor: colors.header, borderBottomColor: colors.border },
                ]}
              >
                <Pressable
                  onPress={() => setListOpen(false)}
                  hitSlop={10}
                  style={styles.headerBtn}
                >
                  <Ionicons name="close" size={22} color={colors.primary} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.primary }]}>
                  Attachments
                </Text>
                <Pressable
                  onPress={addSheet.open}
                  hitSlop={10}
                  style={styles.headerBtn}
                >
                  <Ionicons name="add" size={26} color={colors.primary} />
                </Pressable>
              </View>

              <ScrollView
                style={{ flex: 1, backgroundColor: colors.background }}
              >
                {files.length === 0 ? (
                  <View style={styles.empty}>
                    <Ionicons name="attach-outline" size={40} color={colors.textSecondary} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      No attachments yet
                    </Text>
                  </View>
                ) : (
                  files.map((file, i) => (
                    <View key={i}>
                      {i > 0 && (
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                      )}
                      <View style={styles.row}>
                        {file.isImage ? (
                          <Image source={{ uri: file.uri }} style={styles.thumb} />
                        ) : (
                          <View style={[styles.fileThumb, { backgroundColor: colors.muted }]}>
                            <Ionicons name="document-outline" size={28} color={colors.primary} />
                          </View>
                        )}
                        <View style={styles.rowInfo}>
                          <Text
                            numberOfLines={1}
                            style={[styles.rowName, { color: colors.textPrimary }]}
                          >
                            {file.displayName}
                          </Text>
                          <Text style={[styles.rowDate, { color: colors.textSecondary }]}>
                            {formatDate(file.addedAt)}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => openActionSheet(i)}
                          hitSlop={12}
                          style={styles.menuBtn}
                        >
                          <Ionicons
                            name="ellipsis-vertical"
                            size={20}
                            color={colors.textSecondary}
                          />
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </>
          )}

          {/* ── ACTION SHEET — absolutely positioned inside modal ── */}
          {actionSheet.visible && (
            <>
              <Animated.View
                style={[styles.overlay, { opacity: actionSheet.overlayOpacity }]}
                pointerEvents="box-none"
              >
                <Pressable style={StyleSheet.absoluteFill} onPress={actionSheet.close} />
              </Animated.View>
              <Animated.View
                style={[
                  styles.inlineSheet,
                  {
                    backgroundColor: colors.surface,
                    transform: [{ translateY: actionSheet.translateY }],
                  },
                ]}
              >
                <View style={[styles.handle, { backgroundColor: colors.border }]} />

                <Pressable
                  onPress={async () => {
                    const idx = actionTarget;
                    await actionSheet.close();
                    if (idx !== null) openEdit(idx);
                  }}
                  style={({ pressed }) => [
                    styles.optionRow,
                    pressed && { backgroundColor: colors.muted },
                  ]}
                >
                  <Ionicons name="create-outline" size={22} color={colors.textPrimary} />
                  <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>Edit</Text>
                </Pressable>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <Pressable
                  onPress={async () => {
                    const idx = actionTarget;
                    await actionSheet.close();
                    if (idx !== null) confirmDelete(idx);
                  }}
                  style={({ pressed }) => [
                    styles.optionRow,
                    pressed && { backgroundColor: colors.muted },
                  ]}
                >
                  <Ionicons name="trash-outline" size={22} color={colors.destructive} />
                  <Text style={[styles.optionLabel, { color: colors.destructive }]}>Remove</Text>
                </Pressable>

                <View style={{ height: Spacing.xl }} />
              </Animated.View>
            </>
          )}

          {/* ── ADD SHEET — absolutely positioned inside modal ── */}
          {addSheet.visible && (
            <>
              <Animated.View
                style={[styles.overlay, { opacity: addSheet.overlayOpacity }]}
                pointerEvents="box-none"
              >
                <Pressable style={StyleSheet.absoluteFill} onPress={addSheet.close} />
              </Animated.View>
              <Animated.View
                style={[
                  styles.inlineSheet,
                  {
                    backgroundColor: colors.surface,
                    transform: [{ translateY: addSheet.translateY }],
                  },
                ]}
              >
                <View style={[styles.handle, { backgroundColor: colors.border }]} />
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                  Select attachments
                </Text>

                {(
                  [
                    { key: "camera", label: "Open camera", icon: "camera-outline" as const },
                    { key: "gallery", label: "Choose from gallery", icon: "image-outline" as const },
                    { key: "file", label: "Choose a file", icon: "document-outline" as const },
                  ] as const
                ).map((opt, i) => (
                  <React.Fragment key={opt.key}>
                    {i > 0 && (
                      <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    )}
                    <Pressable
                      onPress={() => handleAddOption(opt.key)}
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

                <View style={{ height: Spacing.xl }} />
              </Animated.View>
            </>
          )}

        </SafeAreaView>
      </Modal>

      {/* ── STANDALONE PICKER (Attach quick-action button) ── */}
      {standaloneSheet.visible && (
        <Modal transparent animationType="none" onRequestClose={standaloneSheet.close}>
          <Animated.View
            style={[styles.overlay, { opacity: standaloneSheet.overlayOpacity }]}
            pointerEvents="box-none"
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={standaloneSheet.close} />
          </Animated.View>
          <Animated.View
            style={[
              styles.inlineSheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: Spacing.xl,
                transform: [{ translateY: standaloneSheet.translateY }],
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Add Attachment</Text>

            {(
              [
                { key: "camera",  label: "Open camera",        sub: "Take a new photo",            icon: "camera-outline"   as const, color: colors.primary },
                { key: "gallery", label: "Choose from gallery", sub: "Pick from your photo library", icon: "image-outline"    as const, color: "#8B5CF6" },
                { key: "file",    label: "Attach a file",       sub: "Documents, PDFs, and more",   icon: "document-outline" as const, color: "#F59E0B" },
              ] as const
            ).map((opt, i) => (
              <React.Fragment key={opt.key}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <Pressable
                  onPress={() => handleAddOption(opt.key)}
                  style={({ pressed }) => [styles.standaloneRow, pressed && { backgroundColor: colors.muted }]}
                >
                  <View style={[styles.standaloneIcon, { backgroundColor: opt.color + "18" }]}>
                    <Ionicons name={opt.icon} size={22} color={opt.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.standaloneLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                    <Text style={[styles.standaloneSub, { color: colors.textSecondary }]}>{opt.sub}</Text>
                  </View>
                </Pressable>
              </React.Fragment>
            ))}
          </Animated.View>
        </Modal>
      )}
    </>
  );
});

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  /* summary card */
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
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardSub: { fontSize: 14 },

  /* modal shell */
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 36, alignItems: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },

  /* list */
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: Spacing.sm,
  },
  emptyText: { fontSize: 15 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  thumb: { width: 56, height: 56, borderRadius: Radius.md },
  fileThumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: { flex: 1, gap: 4 },
  rowName: { fontSize: 15, fontWeight: "600" },
  rowDate: { fontSize: 13 },
  menuBtn: { padding: 4 },
  divider: { height: 1, marginHorizontal: Spacing.lg },

  /* edit view */
  editContent: { padding: Spacing.lg, gap: Spacing.md },
  inputWrap: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: 8,
    paddingBottom: Spacing.md,
  },
  inputLabel: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  input: { fontSize: 16, padding: 0 },
  textareaWrap: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    minHeight: 100,
  },
  textarea: { fontSize: 16, minHeight: 80 },
  editPreview: { width: "100%", height: 280, borderRadius: Radius.lg },
  saveBar: { padding: Spacing.lg, borderTopWidth: 1 },
  saveBtn: { height: 50, borderRadius: Radius.full },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  /* inline sheets (absolutely positioned inside modal) */
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  inlineSheet: {
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
  sheetTitle: { fontSize: 17, fontWeight: "700", marginBottom: Spacing.md },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  optionLabel: { fontSize: 16, fontWeight: "500" },

  /* standalone picker rows */
  standaloneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  standaloneIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  standaloneLabel: { fontSize: 15, fontWeight: "600" },
  standaloneSub: { fontSize: 12, marginTop: 1 },
});

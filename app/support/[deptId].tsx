/**
 * Support department screen — list of tickets (open + closed).
 * FAB opens "New Request" sheet: pick a job + write an initial message.
 */
import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { useAuth } from "~/contexts/AuthContext";
import { AppHeader } from "~/components/layout/AppHeader";
import { LightColors, DarkColors, Spacing, Radius } from "~/styles";
import { DEPARTMENTS } from "~/components/team/TeamContacts";
import { getSupportTicketsByDept } from "~/data/store";
import { getAllJobs } from "~/data/store";
import type { SupportTicket } from "~/types";

type SheetStep = "job" | "message";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Yesterday" : `${d}d ago`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function DeptTicketsScreen() {
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;
  const router = useRouter();
  const { currentUserId } = useAuth();

  const { deptId, name, color, preJobId, preJobNumber, preClientName } = useLocalSearchParams<{
    deptId: string;
    name: string;
    color: string;
    preJobId?: string;
    preJobNumber?: string;
    preClientName?: string;
  }>();
  const dept = DEPARTMENTS.find((d) => d.id === deptId);
  const accentColor = color ?? dept?.color ?? "#3B82F6";

  const tickets = useMemo(() => getSupportTicketsByDept(deptId), [deptId]);
  const openTickets   = tickets.filter((t) => t.status === "open");
  const closedTickets = tickets.filter((t) => t.status === "closed");

  // New request sheet
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetStep, setSheetStep] = useState<SheetStep>("job");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const sheetAnim = useRef(new Animated.Value(0)).current;

  // My jobs (for job picker)
  const myJobs = useMemo(
    () => getAllJobs().filter((j) => j.technicianId === currentUserId),
    [currentUserId]
  );

  function openSheet() {
    // If arrived from a job page, pre-select that job and skip to message step
    if (preJobId) {
      setSelectedJobId(preJobId);
      setSheetStep("message");
    } else {
      setSheetStep("job");
      setSelectedJobId(null);
    }
    setSubject("");
    setSheetVisible(true);
    Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
  }
  function closeSheet() {
    Animated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setSheetVisible(false)
    );
  }
  function handleJobSelect(jobId: string) {
    setSelectedJobId(jobId);
    setSheetStep("message");
  }
  function handleSubmit() {
    if (!subject.trim()) return;
    closeSheet();
    // TODO: POST /api/v1/support/tickets → then navigate to the new ticket
    // For now just close
  }

  function openTicket(ticket: SupportTicket) {
    router.push({
      pathname: "/support/ticket/[ticketId]",
      params: { ticketId: ticket.id, deptColor: accentColor },
    });
  }

  // Auto-open sheet when arriving from a job page
  React.useEffect(() => {
    if (preJobId) {
      // slight delay so the screen has time to render first
      const t = setTimeout(openSheet, 350);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedJob = myJobs.find((j) => j.id === selectedJobId)
    ?? (preJobId ? { id: preJobId, jobNumber: preJobNumber ?? "", clientName: preClientName ?? "" } as any : undefined);

  const sheetTranslate = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [500, 0] });
  const overlayOpacity = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title={name ?? "Support"} showBack />

      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: 100 + insets.bottom }]}>
        {/* Open tickets */}
        {openTickets.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>OPEN</Text>
            {openTickets.map((t) => <TicketCard key={t.id} ticket={t} accentColor={accentColor} colors={colors} onPress={() => openTicket(t)} />)}
          </View>
        )}

        {/* Closed tickets */}
        {closedTickets.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>CLOSED</Text>
            {closedTickets.map((t) => <TicketCard key={t.id} ticket={t} accentColor={accentColor} colors={colors} onPress={() => openTicket(t)} />)}
          </View>
        )}

        {tickets.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={36} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No requests yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Tap the button below to open a new support request with {name}.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <Pressable
        onPress={openSheet}
        style={[styles.fab, { backgroundColor: accentColor, bottom: insets.bottom + 24 }]}
      >
        <Ionicons name="add" size={26} color="#fff" />
        <Text style={styles.fabLabel}>New Request</Text>
      </Pressable>

      {/* ── New request sheet ── */}
      {sheetVisible && (
        <Modal transparent animationType="none" onRequestClose={closeSheet}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
          </Animated.View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.kavContainer}
            pointerEvents="box-none"
          >
            <Animated.View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.surface,
                  paddingBottom: insets.bottom + Spacing.lg,
                  transform: [{ translateY: sheetTranslate }],
                },
              ]}
            >
              <View style={[styles.handle, { backgroundColor: colors.border }]} />

              {/* Header */}
              <View style={styles.sheetHeader}>
                {sheetStep === "message" ? (
                  <Pressable onPress={() => setSheetStep("job")} hitSlop={8} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
                  </Pressable>
                ) : (
                  <View style={styles.backBtn} />
                )}
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                  {sheetStep === "job" ? "Select a job" : "New request"}
                </Text>
                <Pressable onPress={closeSheet} hitSlop={8} style={styles.backBtn}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>

              {/* Step 1 — Job picker */}
              {sheetStep === "job" && (
                <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                  {/* "Not related to a job" option */}
                  <Pressable
                    onPress={() => { setSelectedJobId(null); setSheetStep("message"); }}
                    style={({ pressed }) => [
                      styles.jobRow,
                      { borderColor: colors.border, backgroundColor: colors.muted },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <View style={[styles.jobIcon, { backgroundColor: colors.border }]}>
                      <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.jobTitle, { color: colors.textPrimary }]}>General question</Text>
                      <Text style={[styles.jobSub, { color: colors.textTertiary }]}>Not related to a specific job</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  </Pressable>

                  <Text style={[styles.pickerSectionLabel, { color: colors.textTertiary }]}>MY JOBS</Text>

                  {myJobs.map((job) => (
                    <Pressable
                      key={job.id}
                      onPress={() => handleJobSelect(job.id)}
                      style={({ pressed }) => [
                        styles.jobRow,
                        { borderColor: colors.border, backgroundColor: colors.surface },
                        pressed && { opacity: 0.75 },
                      ]}
                    >
                      <View style={[styles.jobIcon, { backgroundColor: accentColor + "18" }]}>
                        <Ionicons name="briefcase-outline" size={18} color={accentColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.jobTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                          {job.title}
                        </Text>
                        <Text style={[styles.jobSub, { color: colors.textTertiary }]} numberOfLines={1}>
                          #{job.jobNumber} · {job.clientName}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              {/* Step 2 — Message */}
              {sheetStep === "message" && (
                <View style={{ gap: Spacing.md }}>
                  {/* Selected job chip */}
                  {selectedJob ? (
                    <View style={[styles.selectedJobChip, { backgroundColor: accentColor + "15", borderColor: accentColor + "40" }]}>
                      <Ionicons name="briefcase-outline" size={14} color={accentColor} />
                      <Text style={[styles.selectedJobChipText, { color: accentColor }]} numberOfLines={1}>
                        #{selectedJob.jobNumber} · {selectedJob.clientName}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.selectedJobChip, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                      <Ionicons name="help-circle-outline" size={14} color={colors.textSecondary} />
                      <Text style={[styles.selectedJobChipText, { color: colors.textSecondary }]}>
                        General question
                      </Text>
                    </View>
                  )}

                  <TextInput
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Describe your request…"
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={5}
                    autoFocus
                    style={[
                      styles.messageInput,
                      { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.muted },
                    ]}
                  />

                  <Pressable
                    onPress={handleSubmit}
                    style={({ pressed }) => [
                      styles.submitBtn,
                      { backgroundColor: accentColor, opacity: pressed ? 0.88 : 1 },
                      !subject.trim() && { opacity: 0.4 },
                    ]}
                    disabled={!subject.trim()}
                  >
                    <Ionicons name="send-outline" size={18} color="#fff" />
                    <Text style={styles.submitBtnLabel}>Send Request</Text>
                  </Pressable>
                </View>
              )}
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Ticket card                                                         */
/* ------------------------------------------------------------------ */

function TicketCard({
  ticket,
  accentColor,
  colors,
  onPress,
}: {
  ticket: SupportTicket;
  accentColor: string;
  colors: typeof LightColors;
  onPress: () => void;
}) {
  const isClosed = ticket.status === "closed";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ticketCard,
        {
          backgroundColor: colors.surface,
          borderColor: isClosed ? colors.border : accentColor + "55",
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {/* Status indicator strip */}
      <View style={[styles.ticketStrip, { backgroundColor: isClosed ? colors.border : accentColor }]} />

      <View style={styles.ticketBody}>
        {/* Job + client */}
        {(ticket.jobNumber || ticket.clientName) && (
          <View style={styles.ticketMeta}>
            {ticket.jobNumber && (
              <View style={[styles.metaChip, { backgroundColor: accentColor + "15" }]}>
                <Text style={[styles.metaChipText, { color: accentColor }]}>#{ticket.jobNumber}</Text>
              </View>
            )}
            {ticket.clientName && (
              <View style={[styles.metaChip, { backgroundColor: colors.muted }]}>
                <Ionicons name="person-outline" size={11} color={colors.textSecondary} />
                <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>{ticket.clientName}</Text>
              </View>
            )}
          </View>
        )}

        <Text style={[styles.ticketSubject, { color: isClosed ? colors.textSecondary : colors.textPrimary }]} numberOfLines={2}>
          {ticket.subject}
        </Text>

        <View style={styles.ticketFooter}>
          <Text style={[styles.ticketTime, { color: colors.textTertiary }]}>{timeAgo(ticket.updatedAt)}</Text>
          {ticket.unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: accentColor }]}>
              <Text style={styles.unreadBadgeText}>{ticket.unreadCount}</Text>
            </View>
          )}
          {isClosed && (
            <View style={[styles.closedTag, { backgroundColor: colors.muted }]}>
              <Text style={[styles.closedTagText, { color: colors.textTertiary }]}>Closed</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.md },
  section: { gap: Spacing.sm },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },

  emptyState: { alignItems: "center", gap: Spacing.sm, paddingVertical: Spacing.xl * 2 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySubtitle: { fontSize: 13, textAlign: "center", lineHeight: 18, paddingHorizontal: Spacing.lg },

  // Ticket card
  ticketCard: { flexDirection: "row", borderRadius: Radius.xl, borderWidth: 1, overflow: "hidden" },
  ticketStrip: { width: 4, flexShrink: 0 },
  ticketBody: { flex: 1, padding: Spacing.md, gap: 6 },
  ticketMeta: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  metaChipText: { fontSize: 11, fontWeight: "600" },
  ticketSubject: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  ticketFooter: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginTop: 2 },
  ticketTime: { fontSize: 11, flex: 1 },
  unreadBadge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  unreadBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  closedTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  closedTagText: { fontSize: 11, fontWeight: "600" },

  // FAB
  fab: {
    position: "absolute",
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: Radius.full,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabLabel: { fontSize: 15, fontWeight: "700", color: "#fff" },

  // Sheet
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#000" },
  kavContainer: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  sheetHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  sheetTitle: { fontSize: 17, fontWeight: "700", flex: 1, textAlign: "center" },
  backBtn: { width: 32, alignItems: "center" },

  // Job picker
  pickerSectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginTop: Spacing.sm, marginBottom: 4 },
  jobRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  jobIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  jobTitle: { fontSize: 14, fontWeight: "600" },
  jobSub: { fontSize: 12, marginTop: 1 },

  // Message step
  selectedJobChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  selectedJobChipText: { fontSize: 13, fontWeight: "600" },
  messageInput: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 120,
    textAlignVertical: "top",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.full,
  },
  submitBtnLabel: { fontSize: 16, fontWeight: "700", color: "#fff" },
});

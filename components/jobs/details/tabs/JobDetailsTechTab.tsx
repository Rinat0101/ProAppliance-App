import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRouter } from "expo-router";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { DarkColors, LightColors, Radius, Spacing } from "~/styles";
import { JobDetailsAttachmentsCard, type AttachedFile, type AttachmentsCardRef } from "../details/JobDetailsAttachmentsCard";
import { DEPARTMENTS } from "~/components/team/TeamContacts";
import { JobDetailsMapPreview } from "~/components/jobs/details/details/JobDetailsMapPreview";
import type { Job, Client, TechWorkflowStatus } from "~/types";

/* ──────────────────────────────────────────────────────────────
   Workflow config
────────────────────────────────────────────────────────────── */

type StatusConfig = {
  label: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const TECH_STATUS: Record<TechWorkflowStatus, StatusConfig> = {
  on_the_way:               { label: "On the Way",               color: "#F59E0B", icon: "navigate" },
  diagnostic:               { label: "Diagnostic",               color: "#3B82F6", icon: "search-outline" },
  need_parts:               { label: "Need Parts",               color: "#EC4899", icon: "construct-outline" },
  parts_received:           { label: "Parts Received",           color: "#8B5CF6", icon: "cube-outline" },
  need_new_parts:           { label: "Need New Parts",           color: "#EC4899", icon: "alert-circle-outline" },
  parts_installed:          { label: "Parts Installed",          color: "#10B981", icon: "checkmark-circle-outline" },
  estimate_follow_up:       { label: "Estimate Follow Up",       color: "#6366F1", icon: "document-text-outline" },
  get_service_call_payment: { label: "Get Service Call Payment", color: "#F59E0B", icon: "card-outline" },
  get_full_payment:         { label: "Get Full Payment",         color: "#10B981", icon: "cash-outline" },
  completed:                { label: "Completed",                color: "#10B981", icon: "checkmark-circle" },
};

/** State machine: which statuses are available from each state */
const NEXT_STEPS: Record<TechWorkflowStatus, TechWorkflowStatus[]> = {
  on_the_way:               ["diagnostic"],
  diagnostic:               ["need_parts", "parts_installed", "estimate_follow_up", "get_service_call_payment"],
  need_parts:               ["parts_received"],
  parts_received:           ["parts_installed", "need_new_parts"],
  need_new_parts:           ["parts_received"],
  parts_installed:          ["get_service_call_payment", "get_full_payment"],
  estimate_follow_up:       ["need_parts", "parts_installed", "get_service_call_payment"],
  get_service_call_payment: ["get_full_payment", "completed"],
  get_full_payment:         ["completed"],
  completed:                [],
};

/* ──────────────────────────────────────────────────────────────
   Navigation options
────────────────────────────────────────────────────────────── */

const NAV_OPTIONS = [
  { key: "apple",  label: "Apple Maps",  icon: "map-outline" as const },
  { key: "google", label: "Google Maps", icon: "logo-google" as const },
  { key: "waze",   label: "Waze",        icon: "car-sport-outline" as const },
];

/* ──────────────────────────────────────────────────────────────
   ETA config
────────────────────────────────────────────────────────────── */

type EtaType = "on_my_way" | "late";
type EtaDelay = 30 | 45 | 60 | "custom";

const DELAY_OPTIONS: { value: EtaDelay; label: string }[] = [
  { value: 30,       label: "30 min"  },
  { value: 45,       label: "45 min"  },
  { value: 60,       label: "1 hour"  },
  { value: "custom", label: "Custom"  },
];

function addMinutes(mins: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + mins);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function buildEtaMessage(type: EtaType, clientName: string, techName: string, delayMins: number, customMins?: string): string {
  const arrivalTime = addMinutes(type === "on_my_way" ? 0 : delayMins);

  if (type === "on_my_way") {
    return `Hi ${clientName}, this is ${techName}. I'm on my way to your location and should arrive around ${addMinutes(0)}. Please let me know if you have any questions. See you soon!`;
  }

  const delayLabel = delayMins === 60 ? "about an hour" : `approximately ${delayMins} minutes`;
  return `Hi ${clientName}, this is ${techName}. I wanted to give you a heads-up that I'm running ${delayLabel} behind schedule. I sincerely apologize for the inconvenience — I'll be at your location around ${arrivalTime}. Thank you for your patience!`;
}

/* ──────────────────────────────────────────────────────────────
   Component
────────────────────────────────────────────────────────────── */

type Props = {
  job: Job;
  client?: Client;
};

export function JobDetailsTechTab({ job, client }: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Tech workflow state — starts from job's saved state or null (not yet started)
  const [techStatus, setTechStatus] = useState<TechWorkflowStatus | null>(
    job.techWorkflowStatus ?? null
  );
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const attachCardRef = useRef<AttachmentsCardRef>(null);

  // Nav sheet
  const [navVisible, setNavVisible] = useState(false);
  const navAnim = useRef(new Animated.Value(0)).current;

  // Status picker sheet
  const [pickerVisible, setPickerVisible] = useState(false);
  const pickerAnim = useRef(new Animated.Value(0)).current;

  // ETA sheet
  const [etaVisible,  setEtaVisible]  = useState(false);
  const [etaStep,     setEtaStep]     = useState<"type" | "delay" | "message">("type");
  const [etaType,     setEtaType]     = useState<EtaType>("on_my_way");
  const [etaDelay,    setEtaDelay]    = useState<EtaDelay>(30);
  const [customMins,  setCustomMins]  = useState("");
  const [etaMessage,  setEtaMessage]  = useState("");
  const etaAnim = useRef(new Animated.Value(0)).current;

  // Contact dept sheet
  const [contactVisible, setContactVisible] = useState(false);
  const contactAnim = useRef(new Animated.Value(0)).current;

  /* ── nav sheet helpers ── */
  function openNav() {
    setNavVisible(true);
    Animated.spring(navAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
  }
  function closeNav() {
    Animated.timing(navAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setNavVisible(false)
    );
  }
  function openNavigationApp(key: string) {
    const addr = `${client?.address ?? job.address}, ${client?.city ?? job.city}, ${client?.state ?? job.state}`;
    const encoded = encodeURIComponent(addr);
    let url = "";
    if (key === "apple")  url = `maps://?q=${encoded}`;
    if (key === "google") url = `comgooglemaps://?q=${encoded}`;
    if (key === "waze")   url = `waze://?q=${encoded}`;
    closeNav();
    setTimeout(() => Linking.openURL(url).catch(() => Linking.openURL(`https://maps.google.com/?q=${encoded}`)), 200);
  }

  /* ── status picker helpers ── */
  function openPicker() {
    setPickerVisible(true);
    Animated.spring(pickerAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
  }
  function closePicker() {
    Animated.timing(pickerAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setPickerVisible(false)
    );
  }
  function applyStatus(next: TechWorkflowStatus) {
    setTechStatus(next);
    closePicker();
  }

  /* ── photo ── */
  /* ── derived values ── */
  const clientName   = client?.name ?? job.clientName;
  const clientPhone  = client?.phone ?? job.clientPhone;
  const fullAddress  = `${client?.address ?? job.address}, ${client?.city ?? job.city}, ${client?.state ?? job.state} ${client?.zip ?? job.zip}`;

  const currentCfg   = techStatus ? TECH_STATUS[techStatus] : null;
  const nextSteps    = techStatus ? NEXT_STEPS[techStatus] : [];
  const isDone       = techStatus === "completed";

  // Single next step → direct CTA; multiple → open picker
  const singleNext   = nextSteps.length === 1 ? nextSteps[0] : null;

  /* ── contact sheet helpers ── */
  function openContact() {
    setContactVisible(true);
    Animated.spring(contactAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
  }
  function closeContact() {
    Animated.timing(contactAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setContactVisible(false)
    );
  }
  function goToDept(deptId: string, deptName: string, deptColor: string) {
    closeContact();
    setTimeout(() => {
      router.push({
        pathname: "/support/[deptId]",
        params: { deptId, name: deptName, color: deptColor, preJobId: job.id, preJobNumber: job.jobNumber, preClientName: job.clientName },
      });
    }, 220);
  }

  /* ── ETA sheet helpers ── */
  function openEta() {
    setEtaStep("type");
    setEtaType("on_my_way");
    setEtaDelay(30);
    setCustomMins("");
    setEtaMessage("");
    setEtaVisible(true);
    Animated.spring(etaAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
  }
  function closeEta() {
    Animated.timing(etaAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setEtaVisible(false)
    );
  }
  function handleEtaTypeSelect(type: EtaType) {
    setEtaType(type);
    if (type === "on_my_way") {
      setEtaMessage(buildEtaMessage("on_my_way", clientName, "your technician", 0));
      setEtaStep("message");
    } else {
      setEtaStep("delay");
    }
  }
  function handleEtaDelaySelect(delay: EtaDelay) {
    setEtaDelay(delay);
    if (delay !== "custom") {
      setEtaMessage(buildEtaMessage("late", clientName, "your technician", delay as number));
      setEtaStep("message");
    }
  }
  function handleCustomMinutesConfirm() {
    const mins = parseInt(customMins, 10);
    if (!mins || mins < 1) return;
    setEtaMessage(buildEtaMessage("late", clientName, "your technician", mins));
    setEtaStep("message");
  }
  function sendEtaSms() {
    const url = `sms:${clientPhone}?body=${encodeURIComponent(etaMessage)}`;
    closeEta();
    setTimeout(() => Linking.openURL(url).catch(() => {}), 250);
  }

  const navTranslate       = navAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });
  const navOverlayOpacity  = navAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] });
  const pickerTranslate    = pickerAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });
  const pickerOverlay      = pickerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] });
  const etaTranslate       = etaAnim.interpolate({ inputRange: [0, 1], outputRange: [500, 0] });
  const etaOverlay         = etaAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] });
  const contactTranslate   = contactAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });
  const contactOverlay     = contactAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] });

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      >
        {/* ── MAP ── */}
        <View style={styles.mapWrapper}>
          <JobDetailsMapPreview
            address={client?.address ?? job.address}
            city={client?.city ?? job.city}
            state={client?.state ?? job.state}
            zip={client?.zip ?? job.zip}
            clientName={client?.name ?? job.clientName}
            latitude={job.latitude}
            longitude={job.longitude}
          />
        </View>

        {/* ── STATUS CARD ── */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>

          {/* Current status row */}
          <View style={styles.statusRow}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Current Status</Text>
            {currentCfg ? (
              <View style={[styles.statusPill, { backgroundColor: currentCfg.color + "20" }]}>
                <View style={[styles.statusDot, { backgroundColor: currentCfg.color }]} />
                <Text style={[styles.statusText, { color: currentCfg.color }]}>{currentCfg.label}</Text>
              </View>
            ) : (
              <View style={[styles.statusPill, { backgroundColor: "#3B82F620" }]}>
                <View style={[styles.statusDot, { backgroundColor: "#3B82F6" }]} />
                <Text style={[styles.statusText, { color: "#3B82F6" }]}>Scheduled</Text>
              </View>
            )}
          </View>

          {/* ── Not started yet ── */}
          {!techStatus && (
            <Pressable
              onPress={() => applyStatus("on_the_way")}
              style={({ pressed }) => [
                styles.ctaButton,
                { backgroundColor: "#F59E0B", opacity: pressed ? 0.88 : 1 },
              ]}
            >
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.ctaLabel}>On the Way</Text>
            </Pressable>
          )}

          {/* ── Single next step → direct CTA ── */}
          {techStatus && singleNext && !isDone && (
            <Pressable
              onPress={() => applyStatus(singleNext)}
              style={({ pressed }) => [
                styles.ctaButton,
                { backgroundColor: TECH_STATUS[singleNext].color, opacity: pressed ? 0.88 : 1 },
              ]}
            >
              <Ionicons name={TECH_STATUS[singleNext].icon} size={20} color="#fff" />
              <Text style={styles.ctaLabel}>{TECH_STATUS[singleNext].label}</Text>
            </Pressable>
          )}

          {/* ── Multiple next steps → Update Status button ── */}
          {techStatus && !singleNext && !isDone && nextSteps.length > 0 && (
            <Pressable
              onPress={openPicker}
              style={({ pressed }) => [
                styles.ctaButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
              ]}
            >
              <Ionicons name="sync-outline" size={20} color="#fff" />
              <Text style={styles.ctaLabel}>Update Status</Text>
            </Pressable>
          )}

          {/* ── Completed ── */}
          {isDone && (
            <View style={[styles.closedBanner, { backgroundColor: "#10B98115" }]}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={[styles.closedText, { color: "#10B981" }]}>Job completed</Text>
            </View>
          )}
        </View>

        {/* ── QUICK ACTIONS ── */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={openEta}
            style={({ pressed }) => [
              styles.actionBubble,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="time-outline" size={22} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>ETA</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionBubble,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="create-outline" size={22} color={colors.info} />
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Note</Text>
          </Pressable>

          <Pressable
            onPress={() => attachCardRef.current?.openPickerOnly()}
            style={({ pressed }) => [
              styles.actionBubble,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="attach-outline" size={22} color={colors.textSecondary} />
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Attach</Text>
          </Pressable>
        </View>

        {/* ── CLIENT ── */}
        <Pressable
          onPress={openNav}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.92 : 1 },
          ]}
        >
          <View style={styles.clientCardTop}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Client</Text>
            <View style={[styles.navHint, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="navigate-outline" size={13} color={colors.primary} />
              <Text style={[styles.navHintText, { color: colors.primary }]}>Navigate</Text>
            </View>
          </View>

          <Text style={[styles.clientName, { color: colors.textPrimary }]}>{clientName}</Text>

          <Pressable
            onPress={() => Linking.openURL(`tel:${clientPhone}`)}
            style={[styles.contactBtn, { backgroundColor: colors.primaryLight, alignSelf: "flex-start" }]}
          >
            <Ionicons name="call-outline" size={16} color={colors.primary} />
            <Text style={[styles.contactBtnLabel, { color: colors.primary }]}>{clientPhone}</Text>
          </Pressable>

          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={15} color={colors.textTertiary} style={{ marginTop: 1 }} />
            <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={2}>
              {fullAddress}
            </Text>
          </View>
        </Pressable>

        {/* ── SCHEDULE ── */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Schedule</Text>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={[styles.scheduleValue, { color: colors.textPrimary }]}>
                {new Date(job.scheduledDate).toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric",
                })}
              </Text>
            </View>
            <View style={[styles.scheduleDivider, { backgroundColor: colors.border }]} />
            <View style={styles.scheduleItem}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={[styles.scheduleValue, { color: colors.textPrimary }]}>
                {job.scheduledTime}{job.scheduledEndTime ? ` – ${job.scheduledEndTime}` : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* ── JOB INFO ── */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Job</Text>
          <Text style={[styles.jobTitle, { color: colors.textPrimary }]}>{job.title}</Text>
          {job.description ? (
            <Text style={[styles.jobDesc, { color: colors.textSecondary }]}>{job.description}</Text>
          ) : null}
          {job.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {job.tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── ATTACHMENTS ── */}
        <JobDetailsAttachmentsCard
          ref={attachCardRef}
          files={attachedFiles}
          onFilesChange={setAttachedFiles}
        />
      </ScrollView>

      {/* ── CONTACT DEPT FAB ── */}
      <Pressable
        onPress={openContact}
        style={({ pressed }) => [
          styles.contactFab,
          { bottom: insets.bottom + 8, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Ionicons name="headset-outline" size={26} color="#fff" />
      </Pressable>

      {/* ── NAVIGATE SHEET ── */}
      {navVisible && (
        <Modal transparent animationType="none" onRequestClose={closeNav}>
          <Animated.View style={[styles.overlay, { opacity: navOverlayOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeNav} />
          </Animated.View>
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: insets.bottom + Spacing.md,
                transform: [{ translateY: navTranslate }],
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Open in…</Text>
            {NAV_OPTIONS.map((opt, i) => (
              <React.Fragment key={opt.key}>
                {i > 0 && <View style={[styles.sheetDivider, { backgroundColor: colors.border }]} />}
                <Pressable
                  onPress={() => openNavigationApp(opt.key)}
                  style={({ pressed }) => [styles.sheetRow, pressed && { backgroundColor: colors.muted }]}
                >
                  <Ionicons name={opt.icon} size={22} color={colors.primary} />
                  <Text style={[styles.sheetRowLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                </Pressable>
              </React.Fragment>
            ))}
          </Animated.View>
        </Modal>
      )}

      {/* ── STATUS PICKER SHEET ── */}
      {pickerVisible && (
        <Modal transparent animationType="none" onRequestClose={closePicker}>
          <Animated.View style={[styles.overlay, { opacity: pickerOverlay }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closePicker} />
          </Animated.View>
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: insets.bottom + Spacing.md,
                transform: [{ translateY: pickerTranslate }],
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Update Status</Text>
            <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
              Select the next step for this job
            </Text>

            {nextSteps.map((step, i) => {
              const cfg = TECH_STATUS[step];
              return (
                <React.Fragment key={step}>
                  {i > 0 && <View style={[styles.sheetDivider, { backgroundColor: colors.border }]} />}
                  <Pressable
                    onPress={() => applyStatus(step)}
                    style={({ pressed }) => [styles.statusRow2, pressed && { backgroundColor: colors.muted }]}
                  >
                    <View style={[styles.statusIconBox, { backgroundColor: cfg.color + "18" }]}>
                      <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.statusRowLabel, { color: colors.textPrimary }]}>{cfg.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  </Pressable>
                </React.Fragment>
              );
            })}
          </Animated.View>
        </Modal>
      )}

      {/* ── ETA SHEET ── */}
      {etaVisible && (
        <Modal transparent animationType="none" onRequestClose={closeEta}>
          <Animated.View style={[styles.overlay, { opacity: etaOverlay }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeEta} />
          </Animated.View>
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: insets.bottom + Spacing.md,
                transform: [{ translateY: etaTranslate }],
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            {/* Header row with back button on delay/message steps */}
            <View style={styles.etaHeaderRow}>
              {etaStep !== "type" ? (
                <Pressable
                  onPress={() => setEtaStep(etaStep === "message" && etaType === "late" ? "delay" : "type")}
                  hitSlop={8}
                  style={styles.etaBackBtn}
                >
                  <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
                </Pressable>
              ) : (
                <View style={styles.etaBackBtn} />
              )}
              <Text style={[styles.sheetTitle, { color: colors.textPrimary, flex: 1, textAlign: "center" }]}>
                {etaStep === "type"    ? "Send ETA"
                : etaStep === "delay"  ? "How late?"
                : "Your Message"}
              </Text>
              <Pressable onPress={closeEta} hitSlop={8} style={styles.etaBackBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* ── Step 1: Type selection ── */}
            {etaStep === "type" && (
              <View style={styles.etaTypeRow}>
                <Pressable
                  onPress={() => handleEtaTypeSelect("on_my_way")}
                  style={({ pressed }) => [
                    styles.etaTypeCard,
                    { borderColor: "#F59E0B", backgroundColor: "#F59E0B12", opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <View style={[styles.etaTypeIconBox, { backgroundColor: "#F59E0B20" }]}>
                    <Ionicons name="navigate" size={26} color="#F59E0B" />
                  </View>
                  <Text style={[styles.etaTypeLabel, { color: "#F59E0B" }]}>On My Way</Text>
                  <Text style={[styles.etaTypeHint, { color: colors.textTertiary }]}>
                    Let the client know you're headed over
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleEtaTypeSelect("late")}
                  style={({ pressed }) => [
                    styles.etaTypeCard,
                    { borderColor: "#EF4444", backgroundColor: "#EF444412", opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <View style={[styles.etaTypeIconBox, { backgroundColor: "#EF444420" }]}>
                    <Ionicons name="warning-outline" size={26} color="#EF4444" />
                  </View>
                  <Text style={[styles.etaTypeLabel, { color: "#EF4444" }]}>Running Late</Text>
                  <Text style={[styles.etaTypeHint, { color: colors.textTertiary }]}>
                    Apologize and share a new arrival time
                  </Text>
                </Pressable>
              </View>
            )}

            {/* ── Step 2: Delay selection ── */}
            {etaStep === "delay" && (
              <View style={{ gap: Spacing.md }}>
                <View style={styles.etaDelayRow}>
                  {DELAY_OPTIONS.map((opt) => (
                    <Pressable
                      key={String(opt.value)}
                      onPress={() => handleEtaDelaySelect(opt.value)}
                      style={({ pressed }) => [
                        styles.etaDelayChip,
                        {
                          borderColor: etaDelay === opt.value ? "#EF4444" : colors.border,
                          backgroundColor: etaDelay === opt.value ? "#EF444415" : colors.muted,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.etaDelayChipLabel,
                          { color: etaDelay === opt.value ? "#EF4444" : colors.textPrimary },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {etaDelay === "custom" && (
                  <View style={styles.etaCustomRow}>
                    <TextInput
                      value={customMins}
                      onChangeText={setCustomMins}
                      placeholder="Enter minutes"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="number-pad"
                      style={[
                        styles.etaCustomInput,
                        { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.muted },
                      ]}
                    />
                    <Pressable
                      onPress={handleCustomMinutesConfirm}
                      style={({ pressed }) => [
                        styles.etaCustomConfirm,
                        { backgroundColor: "#EF4444", opacity: pressed ? 0.88 : 1 },
                      ]}
                    >
                      <Text style={styles.etaCustomConfirmLabel}>Next</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {/* ── Step 3: Message preview ── */}
            {etaStep === "message" && (
              <View style={{ gap: Spacing.md }}>
                <TextInput
                  value={etaMessage}
                  onChangeText={setEtaMessage}
                  multiline
                  numberOfLines={5}
                  style={[
                    styles.etaMessageInput,
                    {
                      borderColor: colors.border,
                      color: colors.textPrimary,
                      backgroundColor: colors.muted,
                    },
                  ]}
                />
                <Pressable
                  onPress={sendEtaSms}
                  style={({ pressed }) => [
                    styles.etaSendBtn,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
                  ]}
                >
                  <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                  <Text style={styles.etaSendBtnLabel}>Send via SMS</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </Modal>
      )}

      {/* ── CONTACT DEPT SHEET ── */}
      {contactVisible && (
        <Modal transparent animationType="none" onRequestClose={closeContact}>
          <Animated.View style={[styles.overlay, { opacity: contactOverlay }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeContact} />
          </Animated.View>
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: insets.bottom + Spacing.md,
                transform: [{ translateY: contactTranslate }],
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.contactSheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Contact Department</Text>
              <Pressable onPress={closeContact} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
              Select the team you need help from for job #{job.jobNumber}
            </Text>

            {DEPARTMENTS.map((dept, i) => (
              <React.Fragment key={dept.id}>
                {i > 0 && <View style={[styles.sheetDivider, { backgroundColor: colors.border }]} />}
                <Pressable
                  onPress={() => goToDept(dept.id, dept.name, dept.color)}
                  style={({ pressed }) => [styles.deptRow, pressed && { backgroundColor: colors.muted }]}
                >
                  <View style={[styles.deptIconBox, { backgroundColor: dept.color + "18" }]}>
                    <Ionicons name={dept.icon} size={20} color={dept.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.deptRowName, { color: colors.textPrimary }]}>{dept.name}</Text>
                    <Text style={[styles.deptRowSub, { color: colors.textSecondary }]} numberOfLines={1}>
                      {dept.subtitle}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </Pressable>
              </React.Fragment>
            ))}
          </Animated.View>
        </Modal>
      )}
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   Styles
────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },

  mapWrapper: {
    height: 200,
    width: "100%",
    borderRadius: Radius.xl,
    overflow: "hidden",
  },

  card: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },

  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // Status card
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  closedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.lg,
    marginTop: 4,
  },
  closedText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Client card
  clientName: {
    fontSize: 18,
    fontWeight: "700",
  },
  clientCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  navHintText: {
    fontSize: 12,
    fontWeight: "600",
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  contactBtnLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  // Schedule card
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  scheduleItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scheduleDivider: {
    width: 1,
    height: 28,
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },

  // Job info card
  jobTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  jobDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Quick actions
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionBubble: {
    flex: 1,
    height: 64,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: "700",
  },

  // Bottom sheets (shared)
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
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  sheetDivider: {
    height: 1,
    marginHorizontal: Spacing.sm,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  sheetRowLabel: {
    fontSize: 16,
    fontWeight: "500",
  },

  // ETA sheet
  etaHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  etaBackBtn: {
    width: 32,
    alignItems: "center",
  },
  etaTypeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  etaTypeCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    alignItems: "center",
    gap: 8,
  },
  etaTypeIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  etaTypeLabel: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  etaTypeHint: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  etaDelayRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  etaDelayChip: {
    flex: 1,
    minWidth: "40%",
    height: 48,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  etaDelayChipLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  etaCustomRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  etaCustomInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  etaCustomConfirm: {
    height: 44,
    paddingHorizontal: 24,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  etaCustomConfirmLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  etaMessageInput: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 130,
    textAlignVertical: "top",
  },
  etaSendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.full,
  },
  etaSendBtnLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },

  // Status picker rows
  statusRow2: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  statusIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statusRowLabel: {
    fontSize: 15,
    fontWeight: "600",
  },

  // Contact dept FAB
  contactFab: {
    position: "absolute",
    right: Spacing.lg,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  // Contact dept sheet
  contactSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  deptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  deptIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  deptRowName: {
    fontSize: 15,
    fontWeight: "600",
  },
  deptRowSub: {
    fontSize: 12,
    marginTop: 1,
  },
});

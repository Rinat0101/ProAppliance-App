import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
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
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { LightColors, DarkColors, Spacing, Radius } from "~/styles";

/* ─── mock data ──────────────────────────────────────────────── */

const WORK_HOURS = { start: "8:00 AM", end: "5:00 PM" };

const ALL_REQUESTS = [
  { id: "1", dates: "May 26 – May 27, 2026", time: null,                    type: "Vacation", status: "approved" as const },
  { id: "2", dates: "Jun 19, 2026",           time: null,                    type: "Day Off",  status: "approved" as const },
  { id: "3", dates: "Jul 4, 2026",            time: "1:00 PM – 5:00 PM",    type: "Time Off", status: "pending"  as const },
];

/* ─── request types ──────────────────────────────────────────── */

type RequestType = "vacation" | "day_off" | "partial_day" | "schedule_change";

const REQUEST_TYPES: {
  key: RequestType;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { key: "vacation",        label: "Vacation",                subtitle: "Request multiple days off in a row",              icon: "airplane-outline", color: "#10B981" },
  { key: "day_off",         label: "Day Off",                 subtitle: "Request a single full day off",                   icon: "sunny-outline",    color: "#F59E0B" },
  { key: "partial_day",     label: "Partial Day Off",         subtitle: "Leave early or arrive late on a specific day",    icon: "time-outline",     color: "#3B82F6" },
  { key: "schedule_change", label: "Regular Schedule Change", subtitle: "Change your recurring working days or hours",     icon: "repeat-outline",   color: "#8B5CF6" },
];

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/* ─── helpers ────────────────────────────────────────────────── */

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

/* ─── picker field ───────────────────────────────────────────── */

type PickerMode = "date" | "time";

type ActivePicker = { mode: PickerMode; target: string } | null;

/* ─── component ─────────────────────────────────────────────── */

export default function MySchedulePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  // Main request sheet
  const [sheetVisible, setSheetVisible] = useState(false);
  const [step, setStep] = useState<"pick" | RequestType>("pick");
  const sheetAnim = useRef(new Animated.Value(0)).current;

  // Form state — store as Date objects, display formatted
  const [date,      setDate]      = useState<Date | null>(null);
  const [endDate,   setEndDate]   = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime,   setEndTime]   = useState<Date | null>(null);
  const [newStart,  setNewStart]  = useState<Date | null>(null);
  const [newEnd,    setNewEnd]    = useState<Date | null>(null);
  const [note,      setNote]      = useState("");
  const [days,      setDays]      = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);

  // Inline picker state (shown below the tapped field)
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  /* ── sheet helpers ── */

  function openSheet() {
    setStep("pick");
    resetForm();
    setSheetVisible(true);
    Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 12 }).start();
  }

  function closeSheet() {
    setActivePicker(null);
    Animated.timing(sheetAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setSheetVisible(false);
      setStep("pick");
      resetForm();
    });
  }

  function resetForm() {
    setDate(null); setEndDate(null); setStartTime(null); setEndTime(null);
    setNewStart(null); setNewEnd(null); setNote("");
    setDays(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    setActivePicker(null);
  }

  function toggleDay(d: string) {
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }

  function togglePicker(target: string, pickerMode: PickerMode) {
    setActivePicker((prev) =>
      prev?.target === target ? null : { mode: pickerMode, target }
    );
  }

  function handlePickerChange(_: DateTimePickerEvent, selected?: Date) {
    if (!selected || !activePicker) return;
    const { target } = activePicker;
    if (target === "date")      setDate(selected);
    if (target === "endDate")   setEndDate(selected);
    if (target === "startTime") setStartTime(selected);
    if (target === "endTime")   setEndTime(selected);
    if (target === "newStart")  setNewStart(selected);
    if (target === "newEnd")    setNewEnd(selected);
    // On Android the picker closes itself; on iOS keep open until user taps elsewhere
    if (Platform.OS === "android") setActivePicker(null);
  }

  function submitRequest() {
    closeSheet();
    setTimeout(() =>
      Alert.alert("Request Submitted", "Your request has been sent to your dispatcher for review."),
      300
    );
  }

  function canSubmit() {
    if (step === "vacation")        return !!date && !!endDate;
    if (step === "day_off")         return !!date;
    if (step === "partial_day")     return !!date && !!startTime && !!endTime;
    if (step === "schedule_change") return days.length > 0 && !!newStart && !!newEnd;
    return false;
  }

  const sheetTranslate = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });
  const overlayOpacity = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });
  const selectedTypeCfg = step !== "pick" ? REQUEST_TYPES.find((t) => t.key === step) : null;

  /* ── picker value for the currently active field ── */
  function pickerValue(): Date {
    if (!activePicker) return new Date();
    const { target } = activePicker;
    if (target === "date")      return date      ?? new Date();
    if (target === "startTime") return startTime ?? new Date();
    if (target === "endTime")   return endTime   ?? new Date();
    if (target === "newStart")  return newStart  ?? new Date();
    if (target === "newEnd")    return newEnd    ?? new Date();
    return new Date();
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* ── page header ── */}
      <View style={[styles.header, { backgroundColor: colors.header, paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerSide}>
          <Ionicons name="chevron-back" size={22} color={colors.headerForeground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>My Schedule</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── working days ── */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>WORKING DAYS</Text>
          </View>
          <View style={styles.daysRow}>
            {ALL_DAYS.map((d) => {
              const active = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(d);
              return (
                <View key={d} style={[styles.dayChip, {
                  backgroundColor: active ? colors.primary + "18" : colors.muted,
                  borderColor:     active ? colors.primary + "40" : colors.border,
                }]}>
                  <Text style={[styles.dayChipText, { color: active ? colors.primary : colors.textTertiary }]}>{d}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── working hours ── */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>WORKING HOURS</Text>
          </View>
          <View style={styles.hoursRow}>
            <View style={[styles.timeBlock, { backgroundColor: colors.muted }]}>
              <Text style={[styles.timeBlockLabel, { color: colors.textTertiary }]}>Start</Text>
              <Text style={[styles.timeBlockValue, { color: colors.textPrimary }]}>{WORK_HOURS.start}</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.textTertiary} />
            <View style={[styles.timeBlock, { backgroundColor: colors.muted }]}>
              <Text style={[styles.timeBlockLabel, { color: colors.textTertiary }]}>End</Text>
              <Text style={[styles.timeBlockValue, { color: colors.textPrimary }]}>{WORK_HOURS.end}</Text>
            </View>
          </View>
        </View>

        {/* ── upcoming time off ── */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="airplane-outline" size={16} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>UPCOMING TIME OFF</Text>
          </View>
          {ALL_REQUESTS.map((item, i) => (
            <View key={item.id}>
              {i > 0 && <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />}
              <View style={styles.timeOffRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.timeOffType, { color: colors.textPrimary }]}>{item.type}</Text>
                  <Text style={[styles.timeOffDates, { color: colors.textSecondary }]}>{item.dates}</Text>
                  {item.time && (
                    <View style={styles.timeOffTimeRow}>
                      <Ionicons name="time-outline" size={11} color={colors.textTertiary} />
                      <Text style={[styles.timeOffTime, { color: colors.textTertiary }]}>{item.time}</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.statusPill, { backgroundColor: item.status === "approved" ? "#10B98118" : "#F59E0B18" }]}>
                  <Text style={[styles.statusPillText, { color: item.status === "approved" ? "#10B981" : "#F59E0B" }]}>
                    {item.status === "approved" ? "Approved" : "Pending"}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── sticky footer ── */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + Spacing.sm }]}>
        <Pressable
          onPress={openSheet}
          style={({ pressed }) => [styles.requestBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.requestBtnText}>Make a Request</Text>
        </Pressable>
      </View>

      {/* ── request sheet ── */}
      {sheetVisible && (
        <Modal transparent animationType="none" onRequestClose={closeSheet}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
          </Animated.View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.sheetWrapper}
            pointerEvents="box-none"
          >
            <Animated.View style={[styles.sheet, {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + Spacing.md,
              transform: [{ translateY: sheetTranslate }],
            }]}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />

              {/* Step 1: pick type */}
              {step === "pick" && (
                <>
                  <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>What do you need?</Text>
                  <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                    Choose the type of request to submit to your dispatcher.
                  </Text>
                  <View style={styles.typeList}>
                    {REQUEST_TYPES.map((t) => (
                      <Pressable
                        key={t.key}
                        onPress={() => setStep(t.key)}
                        style={({ pressed }) => [styles.typeCard, {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          opacity: pressed ? 0.75 : 1,
                        }]}
                      >
                        <View style={[styles.typeIcon, { backgroundColor: t.color + "18" }]}>
                          <Ionicons name={t.icon} size={22} color={t.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.typeLabel, { color: colors.textPrimary }]}>{t.label}</Text>
                          <Text style={[styles.typeSubtitle, { color: colors.textSecondary }]}>{t.subtitle}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {/* Step 2: form */}
              {step !== "pick" && selectedTypeCfg && (
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <View style={styles.formHeader}>
                    <Pressable onPress={() => { setStep("pick"); setActivePicker(null); }} hitSlop={8} style={styles.backArrow}>
                      <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
                    </Pressable>
                    <View style={[styles.typeIcon, { backgroundColor: selectedTypeCfg.color + "18" }]}>
                      <Ionicons name={selectedTypeCfg.icon} size={18} color={selectedTypeCfg.color} />
                    </View>
                    <Text style={[styles.sheetTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                      {selectedTypeCfg.label}
                    </Text>
                  </View>

                  <View style={styles.formBody}>
                    {/* Vacation */}
                    {step === "vacation" && (
                      <>
                        <View style={styles.twoCol}>
                          <View style={{ flex: 1 }}>
                            <PickerField
                              label="From"
                              value={date ? fmtDate(date) : null}
                              placeholder="Start date"
                              icon="calendar-outline"
                              active={activePicker?.target === "date"}
                              onPress={() => togglePicker("date", "date")}
                              colors={colors}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <PickerField
                              label="Until"
                              value={endDate ? fmtDate(endDate) : null}
                              placeholder="End date"
                              icon="calendar-outline"
                              active={activePicker?.target === "endDate"}
                              onPress={() => togglePicker("endDate", "date")}
                              colors={colors}
                            />
                          </View>
                        </View>
                        {(activePicker?.target === "date" || activePicker?.target === "endDate") && (
                          <InlinePicker mode="date" value={pickerValue()} onChange={handlePickerChange} colors={colors} />
                        )}
                        <NoteField value={note} onChangeText={setNote} colors={colors} />
                      </>
                    )}

                    {/* Day Off */}
                    {step === "day_off" && (
                      <>
                        <PickerField
                          label="Date"
                          value={date ? fmtDate(date) : null}
                          placeholder="Select date"
                          icon="calendar-outline"
                          active={activePicker?.target === "date"}
                          onPress={() => togglePicker("date", "date")}
                          colors={colors}
                        />
                        {activePicker?.target === "date" && (
                          <InlinePicker
                            mode="date"
                            value={pickerValue()}
                            onChange={handlePickerChange}
                            colors={colors}
                          />
                        )}
                        <NoteField value={note} onChangeText={setNote} colors={colors} />
                      </>
                    )}

                    {/* Partial Day Off */}
                    {step === "partial_day" && (
                      <>
                        <PickerField
                          label="Date"
                          value={date ? fmtDate(date) : null}
                          placeholder="Select date"
                          icon="calendar-outline"
                          active={activePicker?.target === "date"}
                          onPress={() => togglePicker("date", "date")}
                          colors={colors}
                        />
                        {activePicker?.target === "date" && (
                          <InlinePicker mode="date" value={pickerValue()} onChange={handlePickerChange} colors={colors} />
                        )}

                        <View style={styles.twoCol}>
                          <View style={{ flex: 1 }}>
                            <PickerField
                              label="From"
                              value={startTime ? fmtTime(startTime) : null}
                              placeholder="Start time"
                              icon="time-outline"
                              active={activePicker?.target === "startTime"}
                              onPress={() => togglePicker("startTime", "time")}
                              colors={colors}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <PickerField
                              label="Until"
                              value={endTime ? fmtTime(endTime) : null}
                              placeholder="End time"
                              icon="time-outline"
                              active={activePicker?.target === "endTime"}
                              onPress={() => togglePicker("endTime", "time")}
                              colors={colors}
                            />
                          </View>
                        </View>
                        {(activePicker?.target === "startTime" || activePicker?.target === "endTime") && (
                          <InlinePicker mode="time" value={pickerValue()} onChange={handlePickerChange} colors={colors} />
                        )}

                        <NoteField value={note} onChangeText={setNote} colors={colors} />
                      </>
                    )}

                    {/* Regular Schedule Change */}
                    {step === "schedule_change" && (
                      <>
                        <View style={styles.fieldGroup}>
                          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>New Working Days</Text>
                          <View style={styles.daysRow}>
                            {ALL_DAYS.map((d) => {
                              const selected = days.includes(d);
                              return (
                                <Pressable
                                  key={d}
                                  onPress={() => toggleDay(d)}
                                  style={[styles.dayChip, {
                                    backgroundColor: selected ? colors.primary + "18" : colors.muted,
                                    borderColor:     selected ? colors.primary + "40" : colors.border,
                                  }]}
                                >
                                  <Text style={[styles.dayChipText, { color: selected ? colors.primary : colors.textTertiary }]}>{d}</Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>

                        <View style={styles.twoCol}>
                          <View style={{ flex: 1 }}>
                            <PickerField
                              label="New Start"
                              value={newStart ? fmtTime(newStart) : null}
                              placeholder="Start time"
                              icon="time-outline"
                              active={activePicker?.target === "newStart"}
                              onPress={() => togglePicker("newStart", "time")}
                              colors={colors}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <PickerField
                              label="New End"
                              value={newEnd ? fmtTime(newEnd) : null}
                              placeholder="End time"
                              icon="time-outline"
                              active={activePicker?.target === "newEnd"}
                              onPress={() => togglePicker("newEnd", "time")}
                              colors={colors}
                            />
                          </View>
                        </View>
                        {(activePicker?.target === "newStart" || activePicker?.target === "newEnd") && (
                          <InlinePicker mode="time" value={pickerValue()} onChange={handlePickerChange} colors={colors} />
                        )}

                        <NoteField value={note} onChangeText={setNote} colors={colors} label="Reason (optional)" placeholder="Explain why you need this change…" />
                      </>
                    )}

                    <Pressable
                      onPress={submitRequest}
                      disabled={!canSubmit()}
                      style={({ pressed }) => [styles.submitBtn, {
                        backgroundColor: canSubmit() ? colors.primary : colors.muted,
                        opacity: pressed ? 0.88 : 1,
                      }]}
                    >
                      <Text style={[styles.submitBtnText, { color: canSubmit() ? "#fff" : colors.textTertiary }]}>
                        Submit Request
                      </Text>
                    </Pressable>
                  </View>
                </ScrollView>
              )}
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </View>
  );
}

/* ─── sub-components ─────────────────────────────────────────── */

function PickerField({
  label, value, placeholder, icon, active, onPress, colors,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  colors: typeof LightColors;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={[
          styles.pickerBtn,
          {
            backgroundColor: colors.background,
            borderColor: active ? colors.primary : colors.border,
          },
        ]}
      >
        <Ionicons name={icon} size={16} color={active ? colors.primary : colors.textTertiary} />
        <Text style={[styles.pickerBtnText, { color: value ? colors.textPrimary : colors.textTertiary }]}>
          {value ?? placeholder}
        </Text>
        <Ionicons
          name={active ? "chevron-up" : "chevron-down"}
          size={14}
          color={colors.textTertiary}
          style={{ marginLeft: "auto" }}
        />
      </Pressable>
    </View>
  );
}

function InlinePicker({
  mode, value, onChange, colors,
}: {
  mode: "date" | "time";
  value: Date;
  onChange: (e: DateTimePickerEvent, d?: Date) => void;
  colors: typeof LightColors;
}) {
  return (
    <View style={[styles.inlinePicker, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      <DateTimePicker
        value={value}
        mode={mode}
        display={Platform.OS === "ios" ? "spinner" : "default"}
        onChange={onChange}
        style={styles.nativePicker}
        textColor={colors.textPrimary}
        accentColor={colors.primary}
        minimumDate={mode === "date" ? new Date() : undefined}
      />
    </View>
  );
}

function NoteField({
  value, onChangeText, colors,
  label = "Note (optional)",
  placeholder = "Add a note for your dispatcher…",
}: {
  value: string;
  onChangeText: (v: string) => void;
  colors: typeof LightColors;
  label?: string;
  placeholder?: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline
        numberOfLines={3}
        style={[styles.input, {
          backgroundColor: colors.background,
          borderColor: colors.border,
          color: colors.textPrimary,
        }]}
      />
    </View>
  );
}

/* ─── styles ─────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  headerSide: { width: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700" },

  content: { padding: Spacing.lg, gap: Spacing.md },

  card: { borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.md, gap: Spacing.sm },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  cardTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },

  daysRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  dayChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  dayChipText: { fontSize: 12, fontWeight: "700" },

  hoursRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  timeBlock: { flex: 1, borderRadius: Radius.lg, padding: Spacing.md, alignItems: "center", gap: 2 },
  timeBlockLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  timeBlockValue: { fontSize: 16, fontWeight: "700" },

  rowDivider: { height: 1, marginVertical: 4 },
  timeOffRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingVertical: 4 },
  timeOffType: { fontSize: 14, fontWeight: "600" },
  timeOffDates: { fontSize: 12, marginTop: 1 },
  timeOffTimeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  timeOffTime: { fontSize: 11 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, flexShrink: 0 },
  statusPillText: { fontSize: 11, fontWeight: "700" },

  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1 },
  requestBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, height: 52, borderRadius: Radius.full },
  requestBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#000" },
  sheetWrapper: { flex: 1, justifyContent: "flex-end" } as any,
  sheet: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, maxHeight: "92%" },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: Spacing.md },
  sheetTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  sheetSubtitle: { fontSize: 14, lineHeight: 20, marginBottom: Spacing.md },

  typeList: { gap: Spacing.sm, paddingBottom: Spacing.md },
  typeCard: { flexDirection: "row", alignItems: "center", gap: Spacing.md, borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.md },
  typeIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  typeLabel: { fontSize: 15, fontWeight: "700" },
  typeSubtitle: { fontSize: 12, marginTop: 2, lineHeight: 16 },

  formHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.md },
  backArrow: { padding: 4 },
  formBody: { gap: Spacing.md, paddingBottom: Spacing.md },

  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3, textTransform: "uppercase" },

  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
  },
  pickerBtnText: { fontSize: 15, flex: 1 },

  inlinePicker: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: "hidden",
    alignItems: "center",
  },
  nativePicker: {
    width: "100%",
    height: 180,
  },

  twoCol: { flexDirection: "row", gap: Spacing.sm },

  input: { borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingTop: 10, paddingBottom: 10, fontSize: 15, height: 80, textAlignVertical: "top" },

  submitBtn: { height: 52, borderRadius: Radius.full, alignItems: "center", justifyContent: "center", marginTop: Spacing.sm },
  submitBtnText: { fontSize: 16, fontWeight: "700" },
});

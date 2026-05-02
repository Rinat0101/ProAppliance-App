/**
 * JobDetailsClientModal
 *
 * Single full-screen modal handling three states internally:
 *   "view"  — client profile (screenshot 2)
 *   "edit"  — edit form (screenshot 3)
 *   "menu"  — 3-dot action sheet (screenshot 5)
 *
 * No nested Modals — all states are rendered inside one pageSheet Modal.
 */

import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Linking,
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

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { DarkColors, LightColors, Radius, Spacing } from "~/styles";
import { ButtonBase, ButtonVariants } from "~/styles/buttons";
import type { JobClient } from "./types";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type ViewState = "view" | "edit" | "editAddress";

type Props = {
  visible: boolean;
  client: JobClient;
  onClose: () => void;
  onSave: (updated: JobClient) => void;
};

/* ------------------------------------------------------------------ */
/*  Floating-label input                                                */
/* ------------------------------------------------------------------ */

function FloatInput({
  label,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  style,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "phone-pad" | "email-address";
  autoCapitalize?: "none" | "words";
  style?: object;
  colors: typeof LightColors;
}) {
  return (
    <View style={[floatStyles.wrap, { borderColor: colors.border, backgroundColor: colors.surface }, style]}>
      <Text style={[floatStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "words"}
        style={[floatStyles.input, { color: colors.textPrimary }]}
        placeholderTextColor={colors.textSecondary}
      />
    </View>
  );
}

const floatStyles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: 8,
    paddingBottom: Spacing.md,
  },
  label: { fontSize: 11, fontWeight: "500", marginBottom: 3 },
  input: { fontSize: 15, padding: 0 },
});

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function JobDetailsClientModal({ visible, client, onClose, onSave }: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const [view, setView] = useState<ViewState>("view");
  const [menuVisible, setMenuVisible] = useState(false);
  const [mapsVisible, setMapsVisible] = useState(false);
  const [mapsTarget, setMapsTarget] = useState<string>("");

  // Maps animation (reuse menuAnim pattern)
  const mapsAnim = useRef(new Animated.Value(0)).current;

  // Edit draft state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneExt, setPhoneExt] = useState("");
  const [address, setAddress] = useState("");

  // Address edit sub-fields
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [zip, setZip] = useState("");

  // Menu animation
  const menuAnim = useRef(new Animated.Value(0)).current;

  function openEdit() {
    // Split name into first/last
    const parts = client.name.trim().split(" ");
    setFirstName(parts[0] ?? "");
    setLastName(parts.slice(1).join(" ") ?? "");
    setCompany(client.company ?? "");
    setEmail(client.email ?? "");
    setPhone(client.phone ?? "");
    setPhoneExt(client.phoneExt ?? "");
    setAddress(
      [client.address, client.city, client.state, client.zip].filter(Boolean).join(", ")
    );
    setView("edit");
  }

  function openMenu() {
    setMenuVisible(true);
    Animated.spring(menuAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }

  function closeMenu(): Promise<void> {
    return new Promise((resolve) => {
      Animated.timing(menuAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        setMenuVisible(false);
        setTimeout(resolve, 40);
      });
    });
  }

  function openMaps(addressStr: string) {
    setMapsTarget(encodeURIComponent(addressStr));
    setMapsVisible(true);
    Animated.spring(mapsAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
  }

  function closeMaps(): Promise<void> {
    return new Promise((resolve) => {
      Animated.timing(mapsAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
        setMapsVisible(false);
        setTimeout(resolve, 40);
      });
    });
  }

  async function openMapApp(key: string) {
    await closeMaps();
    const q = mapsTarget;
    if (key === "apple") {
      const url = `maps://?q=${q}`;
      Linking.openURL((await Linking.canOpenURL(url)) ? url : `https://maps.apple.com/?q=${q}`);
    } else if (key === "google") {
      const url = `comgooglemaps://?q=${q}`;
      Linking.openURL((await Linking.canOpenURL(url)) ? url : `https://maps.google.com/?q=${q}`);
    } else {
      const url = `waze://?q=${q}&navigate=yes`;
      Linking.openURL((await Linking.canOpenURL(url)) ? url : `https://waze.com/ul?q=${q}`);
    }
  }

  function openEditAddress() {
    setStreet(client.address ?? "");
    setCity(client.city ?? "");
    setStateVal(client.state ?? "");
    setZip(client.zip ?? "");
    setView("editAddress");
  }

  function saveAddress() {
    const formatted = [street, city, stateVal, zip].filter(Boolean).join(", ");
    setAddress(formatted);
    // Update client directly so view reflects changes
    onSave({
      ...client,
      address: street.trim(),
      city: city.trim(),
      state: stateVal.trim(),
      zip: zip.trim(),
    });
    setView("edit");
  }

  function handleSave() {
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
    onSave({
      ...client,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: fullName || client.name,
      company: company.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim(),
      phoneExt: phoneExt.trim() || undefined,
    });
    setView("view");
  }

  function handleRequestClose() {
    if (menuVisible) { closeMenu(); return; }
    if (mapsVisible) { closeMaps(); return; }
    if (view === "editAddress") { setView("edit"); return; }
    if (view === "edit") { setView("view"); return; }
    onClose();
  }

  const menuTranslate = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [280, 0] });
  const menuOverlay = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] });

  const fullAddress = [client.address, client.city, client.state, client.zip]
    .filter(Boolean).join(", ");

  const MENU_ITEMS = [
    { icon: "call-outline" as const, label: `Call ${client.firstName ?? client.name.split(" ")[0]}`, action: () => Linking.openURL(`tel:${client.phone.replace(/\D/g, "")}`) },
    { icon: "build-outline" as const, label: "Schedule a job", action: () => {} },
    { icon: "people-outline" as const, label: "Create lead", action: () => {} },
    { icon: "document-text-outline" as const, label: "Create invoice", action: () => {} },
    { icon: "shield-checkmark-outline" as const, label: "Add service plan", action: () => {} },
    { icon: "calculator-outline" as const, label: "Create estimate", action: () => {} },
  ];

  /* ============================================================ */
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleRequestClose}
    >
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.header }]}>

        {/* ── ADDRESS EDIT SUB-VIEW ── */}
        {view === "editAddress" ? (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={[styles.header, { backgroundColor: colors.header }]}>
              <Pressable onPress={() => setView("edit")} hitSlop={10} style={styles.headerBtn}>
                <Ionicons name="chevron-back" size={22} color={colors.primary} />
              </Pressable>
              <Text style={[styles.headerTitle, { color: colors.primary }]}>Address</Text>
              <View style={styles.headerBtn} />
            </View>

            <ScrollView
              style={{ flex: 1, backgroundColor: colors.background }}
              contentContainerStyle={styles.editContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <FloatInput label="Street address" value={street} onChangeText={setStreet} colors={colors} />
              <FloatInput label="City" value={city} onChangeText={setCity} colors={colors} />
              <View style={styles.twoCol}>
                <FloatInput label="State" value={stateVal} onChangeText={setStateVal} style={{ flex: 1 }} colors={colors} />
                <FloatInput label="ZIP code" value={zip} onChangeText={setZip} keyboardType="phone-pad" autoCapitalize="none" style={{ flex: 1 }} colors={colors} />
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={[styles.saveBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
              <Pressable
                onPress={saveAddress}
                style={[ButtonBase, ButtonVariants.primary(colors), styles.saveBtn]}
              >
                <Text style={styles.saveBtnText}>Save address</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>

        ) : view === "edit" ? (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.header }]}>
              <Pressable onPress={() => setView("view")} hitSlop={10} style={styles.headerBtn}>
                <Ionicons name="close" size={22} color={colors.primary} />
              </Pressable>
              <Text style={[styles.headerTitle, { color: colors.primary }]}>Client details</Text>
              <View style={styles.headerBtn} />
            </View>

            <ScrollView
              style={{ flex: 1, backgroundColor: colors.background }}
              contentContainerStyle={styles.editContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* First + Last name row */}
              <View style={styles.twoCol}>
                <FloatInput
                  label="First name"
                  value={firstName}
                  onChangeText={setFirstName}
                  style={{ flex: 1 }}
                  colors={colors}
                />
                <FloatInput
                  label="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                  style={{ flex: 1 }}
                  colors={colors}
                />
              </View>

              {/* Company */}
              <View style={[floatStyles.wrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <TextInput
                  value={company}
                  onChangeText={setCompany}
                  placeholder="Client company name"
                  placeholderTextColor={colors.textSecondary}
                  style={[floatStyles.input, { color: colors.textPrimary }]}
                />
              </View>

              {/* Email */}
              <FloatInput
                label="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                colors={colors}
              />

              {/* Phone + ext row */}
              <View style={styles.twoCol}>
                <FloatInput
                  label="Phone number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  style={{ flex: 2 }}
                  colors={colors}
                />
                <FloatInput
                  label="Ext #"
                  value={phoneExt}
                  onChangeText={setPhoneExt}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  style={{ flex: 1 }}
                  colors={colors}
                />
              </View>

              <Pressable hitSlop={8}>
                <Text style={[styles.addLink, { color: colors.primary }]}>+ Add number</Text>
              </Pressable>

              {/* Address — tapping goes to address edit sub-view */}
              <Pressable
                onPress={openEditAddress}
                style={[
                  floatStyles.wrap,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                ]}
              >
                <Text style={[floatStyles.label, { color: colors.textSecondary }]}>Address</Text>
                <View style={styles.addressRow}>
                  <Text style={[styles.addressValue, { color: address ? colors.textPrimary : colors.textSecondary }]} numberOfLines={1}>
                    {address || "Enter address"}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </View>
              </Pressable>

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Save */}
            <View style={[styles.saveBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
              <Pressable
                onPress={handleSave}
                style={[ButtonBase, ButtonVariants.primary(colors), styles.saveBtn]}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>

        ) : (
          /* ── VIEW STATE ── */
          <>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.header }]}>
              <Pressable onPress={onClose} hitSlop={10} style={styles.headerBtn}>
                <Ionicons name="chevron-back" size={22} color={colors.primary} />
              </Pressable>
              <Text style={[styles.headerTitle, { color: colors.primary }]} numberOfLines={1}>
                {client.name}
              </Text>
              <Pressable onPress={openMenu} hitSlop={10} style={styles.headerBtn}>
                <Ionicons name="ellipsis-vertical" size={20} color={colors.primary} />
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
              {/* Top info block */}
              <View style={[styles.infoBlock, { borderBottomColor: colors.border }]}>
                {/* Name row */}
                <Pressable onPress={openEdit} style={styles.infoRow}>
                  <Text style={[styles.infoName, { color: colors.textPrimary }]}>{client.name}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </Pressable>

                {/* Phone + email + actions */}
                <View style={styles.contactRow}>
                  <Text style={[styles.contactText, { color: colors.textSecondary }]}>{client.phone}</Text>
                  {client.email ? (
                    <>
                      <Text style={[styles.contactSep, { color: colors.border }]}>|</Text>
                      <Text style={[styles.contactText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {client.email}
                      </Text>
                    </>
                  ) : null}
                  <View style={{ flex: 1 }} />
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${client.phone.replace(/\D/g, "")}`)}
                    style={[styles.actionBtn, { borderColor: colors.border }]}
                  >
                    <Ionicons name="call-outline" size={17} color={colors.textPrimary} />
                  </Pressable>
                  <Pressable
                    onPress={() => Linking.openURL(`sms:${client.phone.replace(/\D/g, "")}`)}
                    style={[styles.actionBtn, { borderColor: colors.border }]}
                  >
                    <Ionicons name="chatbubble-outline" size={17} color={colors.textPrimary} />
                  </Pressable>
                </View>

                {/* Revenue */}
                <View style={styles.revenueRow}>
                  <Text style={[styles.revenueText, { color: colors.textPrimary }]}>
                    <Text style={{ fontWeight: "700" }}>Total revenue: </Text>
                    ${(client.totalRevenue ?? 0).toFixed(2)}
                    {"  "}
                    <Text style={{ fontWeight: "700" }}>Due: </Text>
                    ${(client.totalDue ?? 0).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Addresses */}
              <View style={[styles.section, { borderBottomColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Main address</Text>
                <Pressable onPress={() => openMaps(fullAddress)} style={styles.navRow}>
                  <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.navLabel, { color: colors.textPrimary }]} numberOfLines={2}>
                    {fullAddress}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </Pressable>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Billing address</Text>
                <Pressable
                  onPress={() => {
                    const billing = client.billingAddress
                      ? [client.billingAddress, client.billingCity, client.billingState, client.billingZip].filter(Boolean).join(", ")
                      : fullAddress;
                    openMaps(billing);
                  }}
                  style={styles.navRow}
                >
                  <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.navLabel, { color: colors.textPrimary }]} numberOfLines={2}>
                    {client.billingAddress
                      ? [client.billingAddress, client.billingCity, client.billingState, client.billingZip].filter(Boolean).join(", ")
                      : fullAddress}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </Pressable>
              </View>

              {/* Nav rows */}
              {[
                { icon: "people-outline" as const, label: "Additional contacts", count: 0 },
                { icon: "build-outline" as const, label: "Jobs", count: client.jobsCount ?? 0 },
                { icon: "person-add-outline" as const, label: "Leads", count: client.leadsCount ?? 0 },
                { icon: "document-text-outline" as const, label: "Invoices", count: client.invoicesCount ?? 0 },
                { icon: "calculator-outline" as const, label: "Estimates", count: client.estimatesCount ?? 0 },
                { icon: "create-outline" as const, label: "Client notes", count: client.notesCount ?? 0 },
              ].map((item) => (
                <View key={item.label}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.navRow,
                      styles.navRowPadded,
                      pressed && { backgroundColor: colors.muted },
                    ]}
                  >
                    <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
                    <Text style={[styles.navLabel, { color: colors.textPrimary }]}>
                      {item.label} ({item.count})
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                  </Pressable>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                </View>
              ))}

              <View style={{ height: 40 }} />
            </ScrollView>
          </>
        )}

        {/* ── MAPS SHEET (inline) ── */}
        {mapsVisible && (
          <>
            <Animated.View
              style={[styles.menuOverlay, { opacity: mapsAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) }]}
              pointerEvents="box-none"
            >
              <Pressable style={StyleSheet.absoluteFill} onPress={closeMaps} />
            </Animated.View>
            <Animated.View
              style={[
                styles.menuSheet,
                { backgroundColor: colors.surface, transform: [{ translateY: mapsAnim.interpolate({ inputRange: [0, 1], outputRange: [280, 0] }) }] },
              ]}
            >
              <View style={[styles.menuHandle, { backgroundColor: colors.border }]} />
              {[
                { key: "apple", label: "Open with Maps", icon: "map-outline" as const },
                { key: "google", label: "Open with Google Maps", icon: "navigate-outline" as const },
                { key: "waze", label: "Open with Waze", icon: "car-outline" as const },
              ].map((opt, i) => (
                <View key={opt.key}>
                  {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <Pressable
                    onPress={() => openMapApp(opt.key)}
                    style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: colors.muted }]}
                  >
                    <Ionicons name={opt.icon} size={20} color={colors.textPrimary} />
                    <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                  </Pressable>
                </View>
              ))}
              <View style={{ height: Spacing.xl }} />
            </Animated.View>
          </>
        )}

        {/* ── MENU SHEET (inline, no nested Modal) ── */}
        {menuVisible && (
          <>
            <Animated.View style={[styles.menuOverlay, { opacity: menuOverlay }]} pointerEvents="box-none">
              <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
            </Animated.View>
            <Animated.View
              style={[
                styles.menuSheet,
                { backgroundColor: colors.surface, transform: [{ translateY: menuTranslate }] },
              ]}
            >
              <View style={[styles.menuHandle, { backgroundColor: colors.border }]} />
              {MENU_ITEMS.map((item, i) => (
                <View key={item.label}>
                  {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <Pressable
                    onPress={async () => { await closeMenu(); item.action(); }}
                    style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: colors.muted }]}
                  >
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                    <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                  </Pressable>
                </View>
              ))}
              <View style={{ height: Spacing.xl }} />
            </Animated.View>
          </>
        )}

      </SafeAreaView>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerBtn: { width: 36, alignItems: "center" },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },

  /* view — top info block */
  infoBlock: {
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  infoName: { fontSize: 17, fontWeight: "700" },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  contactText: { fontSize: 13 },
  contactSep: { fontSize: 13 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  revenueRow: { paddingVertical: 8 },
  revenueText: { fontSize: 13 },

  /* view — sections */
  section: {
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: 10,
  },
  navRowPadded: {
    paddingHorizontal: Spacing.lg,
  },
  navLabel: { flex: 1, fontSize: 15 },
  divider: { height: 1, marginHorizontal: Spacing.lg },

  /* edit */
  editContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  twoCol: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  addLink: { fontSize: 14, fontWeight: "600" },
  addressRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  addressValue: { flex: 1, fontSize: 15 },
  saveBar: { padding: Spacing.lg, borderTopWidth: 1 },
  saveBtn: { height: 50, borderRadius: Radius.full },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  /* menu sheet */
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  menuSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  menuHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  menuLabel: { fontSize: 16, fontWeight: "500" },
});

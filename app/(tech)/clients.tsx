/**
 * Clients screen — inner tabs: Messages | Calls
 * Merges the old separate messages + calls screens into one.
 */
import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { useAuth } from "~/contexts/AuthContext";
import { AppHeader } from "~/components/layout/AppHeader";
import { LightColors, DarkColors, Spacing, Radius } from "~/styles";
import { mockThreads } from "~/data/mockData";
import { getAllJobs } from "~/data/store";
import type { MessageThread } from "~/types";

type InnerTab = "messages" | "calls";

/* ------------------------------------------------------------------ */
/*  Mock call log (TODO: replace with API)                              */
/* ------------------------------------------------------------------ */

const MOCK_CALLS = [
  { id: "c1", name: "Sarah Martinez", phone: "(555) 234-5678", type: "incoming" as const, duration: "4m 12s", time: new Date(Date.now() - 1800000).toISOString() },
  { id: "c2", name: "John Davis",     phone: "(555) 345-6789", type: "outgoing" as const, duration: "1m 05s", time: new Date(Date.now() - 7200000).toISOString() },
  { id: "c3", name: "Emily Chen",     phone: "(555) 456-7890", type: "missed"   as const, duration: "",       time: new Date(Date.now() - 10800000).toISOString() },
  { id: "c4", name: "Sarah Martinez", phone: "(555) 234-5678", type: "outgoing" as const, duration: "0m 45s", time: new Date(Date.now() - 172800000).toISOString() },
];

const CALL_ICONS = {
  incoming: { name: "call-outline" as const,     color: "#10B981" },
  outgoing: { name: "arrow-up-outline" as const, color: "#3B82F6" },
  missed:   { name: "call-outline" as const,     color: "#EF4444" },
};

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

function digits(s: string) { return s.replace(/\D/g, ""); }

function threadMatches(t: MessageThread, q: string) {
  const lower = q.toLowerCase();
  const d = digits(q);
  return (
    t.title.toLowerCase().includes(lower) ||
    (d.length > 0 && digits(t.phone ?? "").includes(d)) ||
    (t.phone ?? "").toLowerCase().includes(lower)
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function ClientsScreen() {
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;
  const { currentUserId } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<InnerTab>("messages");
  const [query, setQuery] = useState("");

  // New-contact modal
  const [newContactOpen, setNewContactOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const sheetAnim = useRef(new Animated.Value(0)).current;

  function openNewContact() {
    setNewName(""); setNewPhone("");
    setNewContactOpen(true);
    Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
  }
  function closeNewContact() {
    Animated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setNewContactOpen(false)
    );
  }

  // Unique clients from this tech's jobs
  const techClients = useMemo(() => {
    const seen = new Set<string>();
    const result: { clientId: string; name: string; phone: string }[] = [];
    getAllJobs()
      .filter((j) => j.technicianId === currentUserId)
      .forEach((j) => {
        if (!seen.has(j.clientId)) {
          seen.add(j.clientId);
          result.push({ clientId: j.clientId, name: j.clientName, phone: j.clientPhone });
        }
      });
    return result;
  }, [currentUserId]);

  const threadPhones = useMemo(
    () => new Set(mockThreads.map((t) => digits(t.phone ?? "")).filter(Boolean)),
    []
  );

  const { matchedThreads, matchedClients } = useMemo(() => {
    if (!query.trim()) return { matchedThreads: mockThreads, matchedClients: [] };
    const q = query.trim();
    const threads = mockThreads.filter((t) => threadMatches(t, q));
    const clients = techClients.filter((c) => {
      if (threadPhones.has(digits(c.phone))) return false;
      const lower = q.toLowerCase();
      const d = digits(q);
      return (
        c.name.toLowerCase().includes(lower) ||
        (d.length > 0 && digits(c.phone).includes(d)) ||
        c.phone.toLowerCase().includes(lower)
      );
    });
    return { matchedThreads: threads, matchedClients: clients };
  }, [query, techClients, threadPhones]);

  const nothingFound = query.trim().length > 0 && matchedThreads.length === 0 && matchedClients.length === 0;
  const isSearching = query.trim().length > 0;

  function openThread(thread: MessageThread) {
    router.push({ pathname: "/chat/[id]", params: { id: thread.id, name: thread.title, phone: thread.phone ?? "" } });
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Clients" hideMenu />

      {/* ── Inner tab switcher ── */}
      <View style={[styles.tabBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        {(["messages", "calls"] as InnerTab[]).map((t) => {
          const active = activeTab === t;
          return (
            <Pressable
              key={t}
              onPress={() => { setActiveTab(t); setQuery(""); }}
              style={[
                styles.tabBtn,
                active && { backgroundColor: colors.surface, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
              ]}
            >
              <Ionicons
                name={t === "messages" ? "chatbubble-outline" : "call-outline"}
                size={15}
                color={active ? colors.textPrimary : colors.textTertiary}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.tabLabel, { color: active ? colors.textPrimary : colors.textSecondary }]}>
                {t === "messages" ? "Messages" : "Calls"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Messages tab ── */}
      {activeTab === "messages" && (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 32 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search bar */}
          <View style={[styles.searchWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or phone…"
              placeholderTextColor={colors.textTertiary}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>

          {/* Existing threads */}
          {matchedThreads.length > 0 && (
            <View style={styles.section}>
              {isSearching && (
                <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>CONVERSATIONS</Text>
              )}
              {matchedThreads.map((thread) => (
                <Pressable
                  key={thread.id}
                  onPress={() => openThread(thread)}
                  style={({ pressed }) => [
                    styles.threadCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
                    <Text style={[styles.avatarLetter, { color: colors.primary }]}>
                      {thread.title[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.threadContent}>
                    <View style={styles.rowTop}>
                      <Text style={[styles.threadName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {thread.title}
                      </Text>
                      <Text style={[styles.rowTime, { color: colors.textTertiary }]}>
                        {timeAgo(thread.lastMessageTime)}
                      </Text>
                    </View>
                    {thread.phone && (
                      <Text style={[styles.phoneLabel, { color: colors.textTertiary }]}>{thread.phone}</Text>
                    )}
                    <Text style={[styles.lastMsg, { color: colors.textSecondary }]} numberOfLines={1}>
                      {thread.lastMessage}
                    </Text>
                  </View>
                  {thread.unreadCount > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.badgeText}>{thread.unreadCount > 9 ? "9+" : thread.unreadCount}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          )}

          {/* Known clients without a thread */}
          {matchedClients.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
                CLIENTS — NO CONVERSATION YET
              </Text>
              {matchedClients.map((c) => (
                <Pressable
                  key={c.clientId}
                  onPress={() => router.push({ pathname: "/chat/[id]", params: { id: "new", name: c.name, phone: c.phone } })}
                  style={({ pressed }) => [
                    styles.clientCard,
                    { backgroundColor: colors.muted, borderColor: colors.border },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <View style={[styles.avatar, { backgroundColor: colors.accent + "28" }]}>
                    <Text style={[styles.avatarLetter, { color: colors.accent }]}>{c.name[0].toUpperCase()}</Text>
                  </View>
                  <View style={styles.threadContent}>
                    <Text style={[styles.threadName, { color: colors.textPrimary }]} numberOfLines={1}>{c.name}</Text>
                    <Text style={[styles.phoneLabel, { color: colors.textTertiary }]}>{c.phone}</Text>
                    <Text style={[styles.lastMsg, { color: colors.textTertiary, fontStyle: "italic" }]}>No messages yet</Text>
                  </View>
                  <View style={[styles.startChatBtn, { backgroundColor: colors.primary }]}>
                    <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Nothing found */}
          {nothingFound && (
            <View style={styles.section}>
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={28} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No results for "{query}"</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Not in your client list yet.</Text>
              </View>
              <Pressable
                onPress={openNewContact}
                style={({ pressed }) => [
                  styles.newContactBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <View style={[styles.newContactBtnIcon, { backgroundColor: colors.primary + "18" }]}>
                  <Ionicons name="person-add-outline" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.newContactBtnLabel, { color: colors.textPrimary }]}>New contact</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Calls tab ── */}
      {activeTab === "calls" && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: 100 + insets.bottom, gap: Spacing.sm }}>
          {MOCK_CALLS.map((call) => {
            const icon = CALL_ICONS[call.type];
            return (
              <View key={call.id} style={[styles.callRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.callIconWrap, { backgroundColor: icon.color + "18" }]}>
                  <Ionicons name={icon.name} size={18} color={icon.color} />
                </View>
                <View style={styles.callInfo}>
                  <Text style={[styles.callName, { color: call.type === "missed" ? "#EF4444" : colors.textPrimary }]}>
                    {call.name}
                  </Text>
                  <Text style={[styles.callMeta, { color: colors.textTertiary }]}>
                    {call.type.charAt(0).toUpperCase() + call.type.slice(1)}
                    {call.duration ? ` · ${call.duration}` : ""}
                    {" · "}{timeAgo(call.time)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => Linking.openURL(`tel:${call.phone.replace(/\D/g, "")}`)}
                  style={[styles.callBackBtn, { borderColor: colors.border }]}
                  hitSlop={8}
                >
                  <Ionicons name="call-outline" size={18} color={colors.primary} />
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── New contact sheet ── */}
      {newContactOpen && (
        <Modal transparent animationType="none" onRequestClose={closeNewContact}>
          <Animated.View
            style={[styles.modalOverlay, { opacity: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={closeNewContact} />
          </Animated.View>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalKAV} pointerEvents="box-none">
            <Animated.View
              style={[
                styles.modalSheet,
                {
                  backgroundColor: colors.surface,
                  paddingBottom: insets.bottom + Spacing.lg,
                  transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [340, 0] }) }],
                },
              ]}
            >
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>New contact</Text>
                <Pressable onPress={closeNewContact} hitSlop={10}>
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </Pressable>
              </View>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Ionicons name="person-outline" size={16} color={colors.textTertiary} />
                <TextInput
                  value={newName} onChangeText={setNewName}
                  placeholder="Full name" placeholderTextColor={colors.textTertiary}
                  style={[styles.newContactInput, { color: colors.textPrimary }]}
                  autoCapitalize="words" autoFocus
                />
              </View>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Ionicons name="call-outline" size={16} color={colors.textTertiary} />
                <TextInput
                  value={newPhone} onChangeText={setNewPhone}
                  placeholder="Phone number" placeholderTextColor={colors.textTertiary}
                  style={[styles.newContactInput, { color: colors.textPrimary }]}
                  keyboardType="phone-pad"
                />
              </View>
              <Pressable
                onPress={() => {
                  const n = newName.trim() || newPhone.trim();
                  const p = newPhone.trim();
                  closeNewContact();
                  setTimeout(() => router.push({ pathname: "/chat/[id]", params: { id: "new", name: n, phone: p } }), 250);
                }}
                style={({ pressed }) => [
                  styles.modalSubmit,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
                  !newName.trim() && !newPhone.trim() && { opacity: 0.4 },
                ]}
                disabled={!newName.trim() && !newPhone.trim()}
              >
                <Ionicons name="chatbubble-outline" size={16} color="#fff" />
                <Text style={styles.modalSubmitLabel}>Start conversation</Text>
              </Pressable>
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { gap: 0 },

  tabBar: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.full,
    padding: 3,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 8,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: { fontSize: 14, fontWeight: "600" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  section: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 2 },

  threadCard: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarLetter: { fontSize: 18, fontWeight: "700" },
  threadContent: { flex: 1, gap: 1 },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  threadName: { fontSize: 15, fontWeight: "600", flex: 1 },
  rowTime: { fontSize: 11 },
  phoneLabel: { fontSize: 12 },
  lastMsg: { fontSize: 13 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 5, flexShrink: 0 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  clientCard: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1, borderStyle: "dashed",
  },
  startChatBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", flexShrink: 0 },

  emptyState: { alignItems: "center", gap: Spacing.sm, paddingVertical: Spacing.lg },
  emptyTitle: { fontSize: 15, fontWeight: "700" },
  emptySubtitle: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  newContactBtn: { flexDirection: "row", alignItems: "center", gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1 },
  newContactBtnIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  newContactBtnLabel: { flex: 1, fontSize: 15, fontWeight: "600" },

  // Calls
  callRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1 },
  callIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  callInfo: { flex: 1 },
  callName: { fontSize: 15, fontWeight: "600" },
  callMeta: { fontSize: 12, marginTop: 2 },
  callBackBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },

  // Modal
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  modalKAV: { flex: 1, justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.sm },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: Spacing.sm },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.sm },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 12 },
  newContactInput: { flex: 1, fontSize: 15, padding: 0 },
  modalSubmit: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, height: 50, borderRadius: Radius.full, marginTop: 4 },
  modalSubmitLabel: { fontSize: 15, fontWeight: "700", color: "#fff" },
});

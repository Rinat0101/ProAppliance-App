/**
 * Tech messages screen — client threads + team contacts.
 * TODO: replace mock data with GET /api/v1/messages/threads
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
import { TeamContacts } from "~/components/team/TeamContacts";
import type { MessageThread } from "~/types";

type Tab = "clients" | "team";

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
  return `${Math.floor(h / 24)}d ago`;
}

function digits(s: string) {
  return s.replace(/\D/g, "");
}

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

export default function TechMessagesScreen() {
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;
  const { currentUserId } = useAuth();

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("clients");
  const [query, setQuery] = useState("");

  // New-contact modal
  const [newContactOpen, setNewContactOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const sheetAnim = useRef(new Animated.Value(0)).current;

  function openNewContact() {
    setNewName("");
    setNewPhone("");
    setNewContactOpen(true);
    Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
  }

  function closeNewContact() {
    Animated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setNewContactOpen(false)
    );
  }

  // Unique clients from this tech's jobs (deduplicated by clientId)
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

  // IDs of clients who already have a thread (match by phone digits)
  const threadPhones = useMemo(
    () => new Set(mockThreads.map((t) => digits(t.phone ?? "")).filter(Boolean)),
    []
  );

  const { matchedThreads, matchedClients } = useMemo(() => {
    if (!query.trim()) {
      return { matchedThreads: mockThreads, matchedClients: [] };
    }
    const q = query.trim();
    const threads = mockThreads.filter((t) => threadMatches(t, q));
    const clients = techClients.filter((c) => {
      // exclude those already in threads
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

  const nothingFound =
    query.trim().length > 0 &&
    matchedThreads.length === 0 &&
    matchedClients.length === 0;

  function handleStartChat(name: string, phone: string) {
    closeNewContact();
    setTimeout(() => {
      router.push({ pathname: "/chat/[id]", params: { id: "new", name, phone } });
    }, 250);
  }

  function openThread(thread: MessageThread) {
    router.push({ pathname: "/chat/[id]", params: { id: thread.id, name: thread.title, phone: thread.phone ?? "" } });
  }

  function handleNewContactSubmit() {
    if (!newName.trim() && !newPhone.trim()) return;
    handleStartChat(newName.trim() || newPhone.trim(), newPhone.trim());
  }

  const isSearching = query.trim().length > 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Messages" />

      {/* ── Tab switcher ── */}
      <View style={[styles.tabBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        {(["clients", "team"] as Tab[]).map((t) => {
          const active = activeTab === t;
          return (
            <Pressable
              key={t}
              onPress={() => setActiveTab(t)}
              style={[
                styles.tabBtn,
                active && {
                  backgroundColor: colors.surface,
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 2,
                },
              ]}
            >
              <Text style={[styles.tabLabel, { color: active ? colors.textPrimary : colors.textSecondary }]}>
                {t === "clients" ? "Clients" : "Team"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 32 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === "clients" ? (
          <>
            {/* ── Search bar ── */}
            <View style={[styles.searchWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name or phone number…"
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

            {/* ── STATE 1: existing threads ── */}
            {matchedThreads.length > 0 && (
              <View style={styles.section}>
                {isSearching && (
                  <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
                    CONVERSATIONS
                  </Text>
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
                        <Text style={[styles.phoneLabel, { color: colors.textTertiary }]}>
                          {thread.phone}
                        </Text>
                      )}
                      <Text style={[styles.lastMsg, { color: colors.textSecondary }]} numberOfLines={1}>
                        {thread.lastMessage}
                      </Text>
                    </View>

                    {thread.unreadCount > 0 && (
                      <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.badgeText}>
                          {thread.unreadCount > 9 ? "9+" : thread.unreadCount}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            {/* ── STATE 2: known clients without a thread ── */}
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
                    {/* Avatar */}
                    <View style={[styles.avatar, { backgroundColor: colors.accent + "28" }]}>
                      <Text style={[styles.avatarLetter, { color: colors.accent }]}>
                        {c.name[0].toUpperCase()}
                      </Text>
                    </View>

                    {/* Info */}
                    <View style={styles.clientInfo}>
                      <Text style={[styles.threadName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {c.name}
                      </Text>
                      <Text style={[styles.phoneLabel, { color: colors.textTertiary }]}>
                        {c.phone}
                      </Text>
                      <Text style={[styles.lastMsg, { color: colors.textTertiary, fontStyle: "italic" }]}>
                        No messages yet
                      </Text>
                    </View>

                    {/* Start chat icon */}
                    <View style={[styles.startChatBtn, { backgroundColor: colors.primary }]}>
                      <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* ── STATE 3: nothing found — new contact button ── */}
            {nothingFound && (
              <View style={styles.section}>
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={28} color={colors.textTertiary} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No results for "{query}"</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    Not in your client list yet.
                  </Text>
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
          </>
        ) : (
          <TeamContacts
            mode="message"
            onMessage={(dept) =>
              router.push({ pathname: "/chat/[id]", params: { id: `team-${dept.id}`, name: dept.name, phone: "", accentColor: dept.color } })
            }
          />
        )}
      </ScrollView>

      {/* ── New contact modal ── */}
      {newContactOpen && (
        <Modal transparent animationType="none" onRequestClose={closeNewContact}>
          {/* Overlay */}
          <Animated.View
            style={[
              styles.modalOverlay,
              {
                opacity: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
              },
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={closeNewContact} />
          </Animated.View>

          {/* Sheet */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalKAV}
            pointerEvents="box-none"
          >
            <Animated.View
              style={[
                styles.modalSheet,
                {
                  backgroundColor: colors.surface,
                  paddingBottom: insets.bottom + Spacing.lg,
                  transform: [
                    {
                      translateY: sheetAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [340, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Handle */}
              <View style={[styles.handle, { backgroundColor: colors.border }]} />

              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>New contact</Text>
                <Pressable onPress={closeNewContact} hitSlop={10}>
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </Pressable>
              </View>

              {/* Inputs */}
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Ionicons name="person-outline" size={16} color={colors.textTertiary} />
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Full name"
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.newContactInput, { color: colors.textPrimary }]}
                  autoCapitalize="words"
                  autoFocus
                />
              </View>

              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Ionicons name="call-outline" size={16} color={colors.textTertiary} />
                <TextInput
                  value={newPhone}
                  onChangeText={setNewPhone}
                  placeholder="Phone number"
                  placeholderTextColor={colors.textTertiary}
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
    paddingVertical: 8,
    borderRadius: Radius.full,
    alignItems: "center",
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

  section: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 2,
  },

  /* ── Thread card (chat exists) ── */
  threadCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarLetter: { fontSize: 18, fontWeight: "700" },
  threadContent: { flex: 1, gap: 1 },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  threadName: { fontSize: 15, fontWeight: "600", flex: 1 },
  rowTime: { fontSize: 11 },
  phoneLabel: { fontSize: 12 },
  lastMsg: { fontSize: 13 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    flexShrink: 0,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  /* ── Client card (no chat yet) ── */
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  clientInfo: { flex: 1, gap: 2 },
  startChatBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  /* ── Empty + new contact form ── */
  emptyState: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700" },
  emptySubtitle: { fontSize: 13, textAlign: "center", lineHeight: 18 },

  newContactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  newContactBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  newContactBtnLabel: { flex: 1, fontSize: 15, fontWeight: "600" },

  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalKAV: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.sm,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  newContactInput: { flex: 1, fontSize: 15, padding: 0 },
  modalSubmit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 50,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  modalSubmitLabel: { fontSize: 15, fontWeight: "700", color: "#fff" },
});

/**
 * Support ticket chat screen.
 * Open ticket: can send messages.
 * Closed ticket: read-only with a "Closed" banner.
 */
import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { useAuth } from "~/contexts/AuthContext";
import { AppHeader } from "~/components/layout/AppHeader";
import { LightColors, DarkColors, Spacing, Radius } from "~/styles";
import { getSupportTicketById, getSupportMessages } from "~/data/store";
import type { SupportMessage } from "~/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDateSeparator(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const dKey = d.toDateString();
  if (dKey === today.toDateString()) return "Today";
  if (dKey === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function groupMessages(messages: SupportMessage[]): Array<{ type: "separator"; label: string } | { type: "msg"; msg: SupportMessage }> {
  const result: Array<{ type: "separator"; label: string } | { type: "msg"; msg: SupportMessage }> = [];
  let lastDay = "";
  for (const msg of messages) {
    const day = new Date(msg.timestamp).toDateString();
    if (day !== lastDay) {
      result.push({ type: "separator", label: formatDateSeparator(msg.timestamp) });
      lastDay = day;
    }
    result.push({ type: "msg", msg });
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function TicketChatScreen() {
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;
  const { currentUserId } = useAuth();

  const { ticketId, deptColor } = useLocalSearchParams<{ ticketId: string; deptColor: string }>();
  const accentColor = deptColor ?? "#3B82F6";

  const ticket = useMemo(() => getSupportTicketById(ticketId), [ticketId]);
  const isClosed = ticket?.status === "closed";

  const [localMessages, setLocalMessages] = useState<SupportMessage[]>(() =>
    getSupportMessages(ticketId)
  );
  const [draft, setDraft] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const items = useMemo(() => groupMessages(localMessages), [localMessages]);

  // Scroll to bottom on mount
  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  }, []);

  function sendMessage() {
    const text = draft.trim();
    if (!text || isClosed) return;
    const newMsg: SupportMessage = {
      id: `sm-local-${Date.now()}`,
      ticketId,
      senderId: currentUserId ?? "user-1",
      senderName: "Me",
      senderRole: "tech",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, newMsg]);
    setDraft("");
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
  }

  /* ── Title: subject or fallback ── */
  const screenTitle = ticket
    ? (ticket.jobNumber ? `#${ticket.jobNumber}` : "General Request")
    : "Request";

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <AppHeader title={screenTitle} showBack />

      {/* ── Ticket info banner ── */}
      {ticket && (
        <View style={[styles.infoBanner, { backgroundColor: accentColor + "12", borderBottomColor: accentColor + "30" }]}>
          <View style={{ flex: 1, gap: 2 }}>
            {ticket.clientName && (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={13} color={accentColor} />
                <Text style={[styles.infoText, { color: colors.textPrimary }]}>{ticket.clientName}</Text>
              </View>
            )}
            <Text style={[styles.infoSubject, { color: colors.textSecondary }]} numberOfLines={2}>
              {ticket.subject}
            </Text>
          </View>
          {isClosed && (
            <View style={[styles.closedBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.closedBadgeText, { color: colors.textTertiary }]}>Closed</Text>
            </View>
          )}
        </View>
      )}

      {/* ── Messages ── */}
      <FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={(item, i) =>
          item.type === "separator" ? `sep-${i}` : item.msg.id
        }
        contentContainerStyle={[styles.messagesContent, { paddingBottom: isClosed ? insets.bottom + 80 : 8 }]}
        renderItem={({ item }) => {
          if (item.type === "separator") {
            return (
              <View style={styles.daySeparator}>
                <View style={[styles.sepLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.sepLabel, { color: colors.textTertiary }]}>{item.label}</Text>
                <View style={[styles.sepLine, { backgroundColor: colors.border }]} />
              </View>
            );
          }
          const msg = item.msg;
          const isMine = msg.senderRole === "tech";
          return (
            <View style={[styles.bubbleWrap, isMine ? styles.bubbleWrapRight : styles.bubbleWrapLeft]}>
              {!isMine && (
                <View style={[styles.deptAvatar, { backgroundColor: accentColor + "20" }]}>
                  <Ionicons name="headset-outline" size={14} color={accentColor} />
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  isMine
                    ? { backgroundColor: accentColor, borderBottomRightRadius: 4 }
                    : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 },
                ]}
              >
                {!isMine && (
                  <Text style={[styles.bubbleSender, { color: accentColor }]}>{msg.senderName}</Text>
                )}
                <Text style={[styles.bubbleText, { color: isMine ? "#fff" : colors.textPrimary }]}>
                  {msg.content}
                </Text>
                <Text style={[styles.bubbleTime, { color: isMine ? "rgba(255,255,255,0.65)" : colors.textTertiary }]}>
                  {formatTime(msg.timestamp)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* ── Closed banner ── */}
      {isClosed && (
        <View style={[styles.closedFooter, { backgroundColor: colors.muted, borderTopColor: colors.border, paddingBottom: insets.bottom + Spacing.sm }]}>
          <Ionicons name="lock-closed-outline" size={15} color={colors.textTertiary} />
          <Text style={[styles.closedFooterText, { color: colors.textTertiary }]}>
            This request is closed — you can read the history but cannot reply.
          </Text>
        </View>
      )}

      {/* ── Input bar ── */}
      {!isClosed && (
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + Spacing.sm,
            },
          ]}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a message…"
            placeholderTextColor={colors.textTertiary}
            multiline
            style={[
              styles.input,
              { backgroundColor: colors.muted, borderColor: colors.border, color: colors.textPrimary },
            ]}
          />
          <Pressable
            onPress={sendMessage}
            disabled={!draft.trim()}
            style={[
              styles.sendBtn,
              { backgroundColor: draft.trim() ? accentColor : colors.muted },
            ]}
          >
            <Ionicons name="send" size={18} color={draft.trim() ? "#fff" : colors.textTertiary} />
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Info banner
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoText: { fontSize: 13, fontWeight: "600" },
  infoSubject: { fontSize: 12, lineHeight: 16 },
  closedBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  closedBadgeText: { fontSize: 11, fontWeight: "700" },

  // Messages list
  messagesContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: 8 },

  daySeparator: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginVertical: Spacing.sm },
  sepLine: { flex: 1, height: 1 },
  sepLabel: { fontSize: 11, fontWeight: "600" },

  bubbleWrap: { flexDirection: "row", gap: 8, maxWidth: "85%" },
  bubbleWrapRight: { alignSelf: "flex-end", justifyContent: "flex-end" },
  bubbleWrapLeft: { alignSelf: "flex-start" },

  deptAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4 },

  bubble: { maxWidth: "100%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, gap: 4 },
  bubbleSender: { fontSize: 11, fontWeight: "700" },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTime: { fontSize: 10, alignSelf: "flex-end" },

  // Closed footer
  closedFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  closedFooterText: { fontSize: 12, flex: 1, lineHeight: 16 },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});

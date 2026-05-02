/**
 * Chat screen — conversation with a client.
 * Route params:
 *   id       — threadId for existing chats, "new" for a fresh conversation
 *   name     — client display name
 *   phone    — client phone number
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { useAuth } from "~/contexts/AuthContext";
import { DarkColors, LightColors, Spacing, Radius } from "~/styles";
import { getMessagesForThread, getThreadById } from "~/data/store";
import type { Message } from "~/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDateDivider(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function shouldShowDivider(msgs: Message[], index: number): boolean {
  if (index === 0) return true;
  const prev = new Date(msgs[index - 1].timestamp).toDateString();
  const curr = new Date(msgs[index].timestamp).toDateString();
  return prev !== curr;
}

function shouldShowTime(msgs: Message[], index: number): boolean {
  if (index === msgs.length - 1) return true;
  const curr = new Date(msgs[index].timestamp).getTime();
  const next = new Date(msgs[index + 1].timestamp).getTime();
  const nextIsMine = msgs[index + 1].senderId !== msgs[index].senderId;
  return nextIsMine || next - curr > 5 * 60 * 1000; // different sender or >5 min gap
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;
  const { currentUserId } = useAuth();

  const { id, name, phone, accentColor } = useLocalSearchParams<{ id: string; name: string; phone: string; accentColor?: string }>();

  const isNew = id === "new";
  const thread = isNew ? undefined : getThreadById(id ?? "");
  const displayName = name ?? thread?.title ?? "Client";
  const displayPhone = phone ?? thread?.phone ?? "";
  // accentColor is used for team chats (Dispatch=blue, Parts=yellow, etc.)
  // falls back to primary for regular client chats
  const bubbleColor = accentColor ?? colors.primary;

  const [messages, setMessages] = useState<Message[]>(
    isNew ? [] : getMessagesForThread(id ?? "")
  );
  const [inputText, setInputText] = useState("");
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, []);

  const sendMessage = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    const msg: Message = {
      id: `msg-local-${Date.now()}`,
      threadId: id ?? "new",
      senderId: currentUserId,
      senderName: "Me",
      content: text,
      timestamp: new Date().toISOString(),
      read: true,
    };

    setMessages((prev) => [...prev, msg]);
    setInputText("");
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [inputText, currentUserId, id]);

  /* ── Render a single message bubble ── */
  function renderMessage({ item, index }: { item: Message; index: number }) {
    const isMine = item.senderId === currentUserId;
    const showDivider = shouldShowDivider(messages, index);
    const showTime = shouldShowTime(messages, index);

    // Bubble shape: consecutive same-sender messages get squared corners on the tail side
    const nextIsSame = index < messages.length - 1 && messages[index + 1].senderId === item.senderId;
    const prevIsSame = index > 0 && messages[index - 1].senderId === item.senderId;

    const bubbleRadius = {
      borderTopLeftRadius: isMine ? Radius.xl : (prevIsSame ? Radius.sm : Radius.xl),
      borderTopRightRadius: isMine ? (prevIsSame ? Radius.sm : Radius.xl) : Radius.xl,
      borderBottomLeftRadius: isMine ? Radius.xl : (nextIsSame ? Radius.sm : Radius.xl),
      borderBottomRightRadius: isMine ? (nextIsSame ? Radius.sm : Radius.xl) : Radius.xl,
    };

    return (
      <View>
        {/* Date divider */}
        {showDivider && (
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>
              {formatDateDivider(item.timestamp)}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>
        )}

        {/* Bubble */}
        <View style={[styles.bubbleRow, isMine ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
          <View
            style={[
              styles.bubble,
              bubbleRadius,
              isMine
                ? { backgroundColor: bubbleColor }
                : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.bubbleText, { color: isMine ? "#fff" : colors.textPrimary }]}>
              {item.content}
            </Text>
          </View>
        </View>

        {/* Timestamp */}
        {showTime && (
          <Text style={[styles.timeLabel, { color: colors.textTertiary }, isMine ? styles.timeLabelRight : styles.timeLabelLeft]}>
            {formatTime(item.timestamp)}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* ── Status bar spacer ── */}
      <View style={{ height: insets.top, backgroundColor: colors.header }} />

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.header }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={[styles.headerAvatar, { backgroundColor: accentColor ? accentColor + "44" : "rgba(255,255,255,0.15)" }]}>
            <Text style={styles.headerAvatarLetter}>
              {displayName[0]?.toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{displayName}</Text>
            {displayPhone ? (
              <Text style={styles.headerPhone}>{displayPhone}</Text>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={() => displayPhone && Linking.openURL(`tel:${displayPhone.replace(/\D/g, "")}`)}
          style={styles.headerBtn}
          hitSlop={10}
        >
          <Ionicons name="call-outline" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* ── Messages ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 ? (
          /* Empty state */
          <View style={styles.emptyState}>
            <View style={[styles.emptyAvatar, { backgroundColor: bubbleColor + "18" }]}>
              <Text style={[styles.emptyAvatarLetter, { color: bubbleColor }]}>
                {displayName[0]?.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.emptyName, { color: colors.textPrimary }]}>{displayName}</Text>
            {displayPhone ? (
              <Text style={[styles.emptyPhone, { color: colors.textTertiary }]}>{displayPhone}</Text>
            ) : null}
            <View style={[styles.emptyDivider, { backgroundColor: colors.border }]} />
            <Ionicons name="chatbubbles-outline" size={32} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No messages yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Start the conversation below
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={[styles.messageList, { paddingBottom: Spacing.md }]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* ── Input bar ── */}
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
          <Pressable style={styles.attachBtn} hitSlop={8}>
            <Ionicons name="attach-outline" size={22} color={colors.textTertiary} />
          </Pressable>

          <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message…"
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, { color: colors.textPrimary }]}
              multiline
              maxLength={1000}
              returnKeyType="default"
              onSubmitEditing={sendMessage}
            />
          </View>

          <Pressable
            onPress={sendMessage}
            disabled={!inputText.trim()}
            style={[
              styles.sendBtn,
              { backgroundColor: inputText.trim() ? bubbleColor : colors.muted },
            ]}
          >
            <Ionicons
              name="send"
              size={16}
              color={inputText.trim() ? "#fff" : colors.textTertiary}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarLetter: { fontSize: 15, fontWeight: "700", color: "#fff" },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 15, fontWeight: "700", color: "#fff" },
  headerPhone: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 1 },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  emptyAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  emptyAvatarLetter: { fontSize: 30, fontWeight: "700" },
  emptyName: { fontSize: 20, fontWeight: "700" },
  emptyPhone: { fontSize: 14 },
  emptyDivider: { width: 40, height: 1, marginVertical: Spacing.md },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginTop: Spacing.sm },
  emptySubtitle: { fontSize: 14, textAlign: "center" },

  // Message list
  messageList: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: 2,
  },

  // Date divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: "600" },

  // Bubbles
  bubbleRow: { marginVertical: 1 },
  bubbleRowLeft: { alignItems: "flex-start" },
  bubbleRowRight: { alignItems: "flex-end" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },

  // Time label
  timeLabel: { fontSize: 11, marginTop: 3, marginBottom: 6 },
  timeLabelLeft: { marginLeft: Spacing.sm },
  timeLabelRight: { marginRight: Spacing.sm, textAlign: "right" },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  attachBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  inputWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === "ios" ? 9 : 6,
    maxHeight: 120,
  },
  input: { fontSize: 15, padding: 0 },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
});

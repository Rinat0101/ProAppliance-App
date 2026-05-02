import { useState, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "~/hooks/use-color-scheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LightColors, DarkColors } from "~/styles/colors";

/* ---------------- CONFIG ---------------- */

const FAB_SIZE = 56;
const ACTION_SIZE = 48;

const FAB_RIGHT = 18;
const TAB_BAR_HEIGHT = 64;
const FAB_OFFSET = 16;

type FabVariant = "dashboard" | "schedule";

const DASHBOARD_ACTIONS = [
  { icon: "briefcase-outline", label: "Job", path: "/jobs/new", x: 0, y: -76 },
  { icon: "document-text-outline", label: "Estimate", path: "/estimates/new", x: -54, y: -54 },
  { icon: "receipt-outline", label: "Invoice", path: "/invoices/new", x: -76, y: 0 },
] as const;

const SCHEDULE_ACTIONS = [
  { icon: "briefcase-outline", label: "Job", path: "/jobs/new", x: 0, y: -76 },
  { icon: "calendar-outline", label: "Event", path: "/schedule/event/new", x: -54, y: -54 },
  { icon: "cafe-outline", label: "Time Off", path: "/schedule/time-off/new", x: -76, y: 0 },
] as const;

/* ---------------- COMPONENT ---------------- */

export function RadialFAB({ variant = "dashboard" }: { variant?: FabVariant }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const insets = useSafeAreaInsets();
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const colors = scheme === "dark" ? DarkColors : LightColors;

  const fabBottom = insets.bottom + TAB_BAR_HEIGHT + FAB_OFFSET;

  const actions = useMemo(() => {
    return variant === "schedule" ? SCHEDULE_ACTIONS : DASHBOARD_ACTIONS;
  }, [variant]);

  const toggle = () => {
    Animated.timing(animation, {
      toValue: open ? 0 : 1,
      duration: 240,
      useNativeDriver: true,
    }).start();
    setOpen(!open);
  };

  const handleAction = (path: string) => {
    toggle();
    router.push(path);
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {open && (
        <Pressable
          style={[
            styles.overlay,
            {
              backgroundColor:
                scheme === "dark" ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.35)",
            },
          ]}
          onPress={toggle}
        />
      )}

      {actions.map((action) => {
        const translateX = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, action.x],
        });

        const translateY = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, action.y],
        });

        const scale = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        });

        return (
          <Animated.View
            key={action.label}
            pointerEvents={open ? "auto" : "none"}
            style={[
              styles.actionWrapper,
              {
                bottom: fabBottom,
                right: FAB_RIGHT,
                opacity: animation,
                transform: [{ translateX }, { translateY }, { scale }],
              },
            ]}
          >
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => handleAction(action.path)}
            >
              <Ionicons name={action.icon} size={18} color="#FFF" />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          </Animated.View>
        );
      })}

      <Pressable
        style={[
          styles.fab,
          {
            bottom: fabBottom,
            right: FAB_RIGHT,
            backgroundColor: colors.primary,
          },
        ]}
        onPress={toggle}
      >
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Ionicons name="add" size={26} color="#FFF" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  actionWrapper: {
    position: "absolute",
    zIndex: 2,
  },
  fab: {
    position: "absolute",
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    elevation: 10,
  },
  actionButton: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  actionLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFF",
    marginTop: 2,
  },
});
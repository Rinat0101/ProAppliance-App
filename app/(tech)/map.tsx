/**
 * Tech route map — upcoming jobs pinned on a map.
 * Tap a pin → peek sheet slides up with job summary.
 * Drag the sheet up → opens full job page.
 * Drag down → dismisses.
 */
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
  Linking,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { LightColors, DarkColors, Spacing, Radius } from "~/styles";
import { useAuth } from "~/contexts/AuthContext";
import { getTechDashboard } from "~/data/store";
import type { Job } from "~/types";

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const MAP_OPTIONS = [
  {
    key: "apple",
    label: "Open with Maps",
    icon: "map-outline" as const,
    getUrl: (q: string) => `maps://?q=${q}`,
    fallback: (q: string) => `https://maps.apple.com/?q=${q}`,
  },
  {
    key: "google",
    label: "Open with Google Maps",
    icon: "navigate-outline" as const,
    getUrl: (q: string) => `comgooglemaps://?q=${q}`,
    fallback: (q: string) => `https://maps.google.com/?q=${q}`,
  },
  {
    key: "waze",
    label: "Open with Waze",
    icon: "car-outline" as const,
    getUrl: (q: string) => `waze://?q=${q}&navigate=yes`,
    fallback: (q: string) => `https://waze.com/ul?q=${q}`,
  },
];

const STATUS_COLORS: Record<Job["status"], string> = {
  scheduled:   "#3B82F6",
  en_route:    "#F59E0B",
  in_progress: "#8B5CF6",
  completed:   "#10B981",
  cancelled:   "#6B7280",
  estimate:    "#EC4899",
};

const STATUS_LABELS: Record<Job["status"], string> = {
  scheduled:   "Scheduled",
  en_route:    "En Route",
  in_progress: "In Progress",
  completed:   "Completed",
  cancelled:   "Cancelled",
  estimate:    "Estimate",
};

const HIDDEN = 420; // fully off screen (tall enough to hide buttons + tab bar)
const PEEK   = 0;   // peek state — card visible

/* ------------------------------------------------------------------ */
/*  Screen                                                              */
/* ------------------------------------------------------------------ */

export default function TechMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;
  const { currentUserId } = useAuth();

  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const translateY    = useRef(new Animated.Value(HIDDEN)).current;
  const navSheetAnim  = useRef(new Animated.Value(0)).current;
  const [navSheetOpen, setNavSheetOpen] = useState(false);

  const { periodJobs } = useMemo(
    () => getTechDashboard(currentUserId, "today"),
    [currentUserId]
  );

  // Filter & offset co-located markers
  const upcomingJobs = useMemo(() => {
    const jobs = periodJobs.filter(
      (j) =>
        j.latitude != null &&
        j.longitude != null &&
        j.status !== "cancelled" &&
        j.status !== "completed"
    );
    const OFFSET = 0.0008;
    const seen = new Map<string, number>();
    return jobs.map((j) => {
      const key = `${j.latitude?.toFixed(4)},${j.longitude?.toFixed(4)}`;
      const count = seen.get(key) ?? 0;
      seen.set(key, count + 1);
      if (count === 0) return j;
      const angle = (count * Math.PI) / 2;
      return {
        ...j,
        latitude: j.latitude! + OFFSET * Math.cos(angle),
        longitude: j.longitude! + OFFSET * Math.sin(angle),
      };
    });
  }, [periodJobs]);

  const selectedJob = upcomingJobs.find((j) => j.id === selectedId) ?? null;
  const selectedIndex = selectedJob
    ? upcomingJobs.findIndex((j) => j.id === selectedId) + 1
    : null;

  // Initial map region
  const initialRegion = useMemo(() => {
    if (upcomingJobs.length === 0)
      return { latitude: 30.2672, longitude: -97.7431, latitudeDelta: 0.15, longitudeDelta: 0.15 };
    const lats = upcomingJobs.map((j) => j.latitude!);
    const lngs = upcomingJobs.map((j) => j.longitude!);
    const pad = 0.05;
    return {
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      latitudeDelta: Math.max(Math.max(...lats) - Math.min(...lats) + pad, 0.08),
      longitudeDelta: Math.max(Math.max(...lngs) - Math.min(...lngs) + pad, 0.08),
    };
  }, [upcomingJobs]);

  /* ---- Sheet animation helpers ---- */

  function showSheet() {
    Animated.spring(translateY, {
      toValue: PEEK,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  }

  function hideSheet() {
    Animated.timing(translateY, {
      toValue: HIDDEN,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setSelectedId(null));
  }

  function openJobPage() {
    if (!selectedId) return;
    const id = selectedId;
    hideSheet();
    setTimeout(() => router.push(`/jobs/${id}`), 180);
  }

  /* ---- Tap a marker ---- */

  function focusJob(job: Job) {
    setSelectedId(job.id);
    mapRef.current?.animateToRegion(
      {
        latitude: job.latitude! - 0.008,
        longitude: job.longitude!,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      },
      380
    );
    showSheet();
  }

  function openNavSheet() {
    setNavSheetOpen(true);
    Animated.spring(navSheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }

  function closeNavSheet(): Promise<void> {
    return new Promise((resolve) => {
      Animated.timing(navSheetAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        setNavSheetOpen(false);
        setTimeout(resolve, 40);
      });
    });
  }

  async function openMapOption(opt: (typeof MAP_OPTIONS)[number]) {
    if (!selectedJob) return;
    await closeNavSheet();
    const q = encodeURIComponent(`${selectedJob.address}, ${selectedJob.city}, ${selectedJob.state}`);
    const url = opt.getUrl(q);
    const canOpen = await Linking.canOpenURL(url);
    Linking.openURL(canOpen ? url : opt.fallback(q));
  }

  const navSheetTranslate = navSheetAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });
  const navOverlayOpacity = navSheetAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });


  return (
    <View style={styles.screen}>
      {/* MAP */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => selectedId && hideSheet()}
      >
        {upcomingJobs.map((job, index) => (
          <Marker
            key={job.id}
            identifier={job.id}
            coordinate={{ latitude: job.latitude!, longitude: job.longitude! }}
            onPress={() => focusJob(job)}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={selectedId === job.id ? 10 : 1}
          >
            <View
              style={[
                styles.pin,
                { backgroundColor: STATUS_COLORS[job.status] },
                selectedId === job.id && styles.pinActive,
              ]}
            >
              <Text style={styles.pinNumber}>{index + 1}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* BACK BUTTON */}
      <View style={[styles.backBtn, { top: insets.top + Spacing.sm }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* HEADER PILL */}
      <View style={[styles.headerPill, { top: insets.top + Spacing.sm }]}>
        <View style={[styles.pill, { backgroundColor: colors.surface }]}>
          <Ionicons name="location-outline" size={14} color={colors.primary} />
          <Text style={[styles.pillText, { color: colors.textPrimary }]}>
            {upcomingJobs.length} upcoming job{upcomingJobs.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* JOB STRIP — always visible at bottom */}
      {!selectedId && (
        <View style={[styles.stripContainer, { paddingBottom: insets.bottom + Spacing.sm, backgroundColor: colors.surface }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          {upcomingJobs.length === 0 ? (
            <View style={styles.emptySheet}>
              <Ionicons name="checkmark-circle-outline" size={24} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No upcoming jobs</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.jobStrip}
            >
              {upcomingJobs.map((job, index) => (
                <Pressable
                  key={job.id}
                  onPress={() => focusJob(job)}
                  style={[styles.jobChip, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <View style={[styles.chipNum, { backgroundColor: STATUS_COLORS[job.status] }]}>
                    <Text style={styles.chipNumText}>{index + 1}</Text>
                  </View>
                  <View>
                    <Text style={[styles.chipTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {job.title}
                    </Text>
                    <Text style={[styles.chipTime, { color: colors.textSecondary }]}>
                      {job.scheduledTime}{job.distance ? ` · ${job.distance}` : ""}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* PEEK SHEET — slides up when job selected */}
      {selectedJob && (
        <Animated.View
          style={[
            styles.peekSheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + 80, // 80 = tab bar height
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.dragArea}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          </View>

          {/* Job info */}
          <View style={styles.peekContent}>
            {/* Title row */}
            <View style={styles.peekTitleRow}>
              <View style={[styles.peekNumBadge, { backgroundColor: STATUS_COLORS[selectedJob.status] }]}>
                <Text style={styles.peekNumText}>{selectedIndex}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.peekTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {selectedJob.title}
                </Text>
                <Text style={[styles.peekClient, { color: colors.textSecondary }]}>
                  {selectedJob.clientName}
                </Text>
              </View>
              <Pressable hitSlop={12} onPress={hideSheet}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Meta row */}
            <View style={styles.metaRow}>
              <View style={[styles.metaChip, { backgroundColor: colors.muted }]}>
                <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {selectedJob.scheduledTime} – {selectedJob.scheduledEndTime}
                </Text>
              </View>
              <View style={[styles.metaChip, { backgroundColor: STATUS_COLORS[selectedJob.status] + "18" }]}>
                <Text style={[styles.metaText, { color: STATUS_COLORS[selectedJob.status], fontWeight: "700" }]}>
                  {STATUS_LABELS[selectedJob.status]}
                </Text>
              </View>
              {selectedJob.distance && (
                <View style={[styles.metaChip, { backgroundColor: colors.muted }]}>
                  <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {selectedJob.distance}
                  </Text>
                </View>
              )}
            </View>

            {/* Address */}
            <Text style={[styles.peekAddress, { color: colors.textTertiary }]} numberOfLines={1}>
              {selectedJob.address}, {selectedJob.city}, {selectedJob.state}
            </Text>

            {/* Actions */}
            <View style={styles.peekActions}>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={openNavSheet}
              >
                <Ionicons name="navigate-outline" size={16} color="#fff" />
                <Text style={[styles.actionBtnText, { color: "#fff" }]}>Navigate</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtnOutline, { borderColor: colors.border }]}
                onPress={openJobPage}
              >
                <Ionicons name="document-text-outline" size={16} color={colors.textPrimary} />
                <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>View job</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}

      {/* NAV PICKER SHEET */}
      {navSheetOpen && (
        <>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "#000", opacity: navOverlayOpacity },
            ]}
            pointerEvents="box-only"
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={closeNavSheet} />
          </Animated.View>

          <Animated.View
            style={[
              styles.navSheet,
              {
                backgroundColor: colors.surface,
                transform: [{ translateY: navSheetTranslate }],
                paddingBottom: insets.bottom + Spacing.md,
              },
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            {MAP_OPTIONS.map((opt, i) => (
              <React.Fragment key={opt.key}>
                {i > 0 && <View style={[styles.navDivider, { backgroundColor: colors.border }]} />}
                <Pressable
                  onPress={() => openMapOption(opt)}
                  style={({ pressed }) => [
                    styles.navRow,
                    pressed && { backgroundColor: colors.muted },
                  ]}
                >
                  <Ionicons name={opt.icon} size={22} color={colors.textPrimary} />
                  <Text style={[styles.navRowLabel, { color: colors.textPrimary }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              </React.Fragment>
            ))}
          </Animated.View>
        </>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  screen: { flex: 1 },

  backBtn: { position: "absolute", left: Spacing.md },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  headerPill: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pillText: { fontSize: 13, fontWeight: "600" },

  // Markers
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pinActive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#fff",
  },
  pinNumber: { color: "#fff", fontSize: 13, fontWeight: "800" },

  // Job strip (no selection)
  stripContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 6,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.sm,
  },
  emptySheet: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  emptyText: { fontSize: 14 },
  jobStrip: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  jobChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    paddingRight: Spacing.md,
  },
  chipNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  chipNumText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  chipTitle: { fontSize: 13, fontWeight: "600", maxWidth: 130 },
  chipTime: { fontSize: 11, marginTop: 1 },

  // Peek sheet
  peekSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  dragArea: {
    paddingTop: Spacing.sm,
    alignItems: "center",
    paddingBottom: 4,
  },

  peekContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  peekTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  peekNumBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  peekNumText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  peekTitle: { fontSize: 16, fontWeight: "700" },
  peekClient: { fontSize: 13, marginTop: 1 },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  metaText: { fontSize: 12, fontWeight: "500" },

  peekAddress: { fontSize: 12 },

  peekActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.lg,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  actionBtnText: { fontSize: 14, fontWeight: "600" },

  navSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  navDivider: { height: 1, marginHorizontal: Spacing.sm },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  navRowLabel: { fontSize: 16, fontWeight: "500" },
});

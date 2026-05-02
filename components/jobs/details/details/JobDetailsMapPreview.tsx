import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { DarkColors, LightColors, Radius, Spacing } from "~/styles";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface Coords {
  latitude: number;
  longitude: number;
}

interface Props {
  address: string;
  city: string;
  state: string;
  zip: string;
  clientName: string;
  latitude?: number;
  longitude?: number;
}

/* ------------------------------------------------------------------ */
/*  Geocoding (OpenStreetMap Nominatim — free, no API key)             */
/* ------------------------------------------------------------------ */

async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zip: string
): Promise<Coords | null> {
  const query = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

  const res = await fetch(url, {
    headers: { "User-Agent": "ProApplianceMobile/1.0" },
  });
  const data = await res.json();

  if (data.length === 0) return null;
  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
  };
}

/* ------------------------------------------------------------------ */
/*  Nav options                                                         */
/* ------------------------------------------------------------------ */

const NAV_OPTIONS = [
  {
    key: "apple",
    label: "Apple Maps",
    icon: "map-outline" as const,
    color: "#3B82F6",
    getUrl: (q: string) => `maps://?q=${q}`,
    iosOnly: true,
  },
  {
    key: "google",
    label: "Google Maps",
    icon: "logo-google" as const,
    color: "#EA4335",
    getUrl: (q: string) =>
      `https://www.google.com/maps/search/?api=1&query=${q}`,
    iosOnly: false,
  },
  {
    key: "waze",
    label: "Waze",
    icon: "car-sport-outline" as const,
    color: "#33CCFF",
    getUrl: (q: string) => `waze://?q=${q}`,
    iosOnly: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function JobDetailsMapPreview({
  address,
  city,
  state,
  zip,
  clientName,
  latitude,
  longitude,
}: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const mapRef = useRef<MapView>(null);
  const [coords, setCoords] = useState<Coords | null>(
    latitude != null && longitude != null ? { latitude, longitude } : null
  );
  const [loading, setLoading] = useState(latitude == null || longitude == null);
  const [error, setError] = useState(false);
  const [navVisible, setNavVisible] = useState(false);
  const navAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (latitude != null && longitude != null) {
      setCoords({ latitude, longitude });
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    geocodeAddress(address, city, state, zip)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setCoords(result);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [address, city, state, zip, latitude, longitude]);

  function openNavSheet() {
    setNavVisible(true);
    Animated.spring(navAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }

  function closeNavSheet() {
    Animated.timing(navAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setNavVisible(false));
  }

  async function openWith(optKey: string) {
    const query = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`);
    const opt = NAV_OPTIONS.find((o) => o.key === optKey);
    if (!opt) return;
    if (opt.iosOnly && Platform.OS !== "ios") return;

    const url = opt.getUrl(query);
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    } else {
      // Fallback: open Google Maps in browser
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    }
    closeNavSheet();
  }

  const sheetTranslate = navAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  /* ── Loading state ── */
  if (loading) {
    return (
      <View
        style={[
          styles.placeholder,
          { backgroundColor: colors.muted, borderColor: colors.border },
        ]}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  /* ── Error / no coords ── */
  if (error || !coords) {
    return (
      <Pressable
        onPress={openNavSheet}
        style={[
          styles.placeholder,
          { backgroundColor: colors.muted, borderColor: colors.border },
        ]}
      >
        <Ionicons name="location-outline" size={24} color={colors.textSecondary} />
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          {address}, {city}, {state} {zip}
        </Text>
        <Text style={[styles.openText, { color: colors.primary }]}>
          Navigate
        </Text>
      </Pressable>
    );
  }

  const region = {
    latitude: coords.latitude,
    longitude: coords.longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  return (
    <>
      <View style={[styles.container, { borderColor: colors.border }]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={region}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Marker
            coordinate={coords}
            title={clientName}
            description={`${address}, ${city}, ${state} ${zip}`}
          />
        </MapView>

        {/* Navigate button */}
        <Pressable
          onPress={openNavSheet}
          style={[
            styles.openBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="navigate-outline" size={14} color={colors.primary} />
          <Text style={[styles.openBtnText, { color: colors.primary }]}>
            Navigate
          </Text>
        </Pressable>

        {/* Address overlay */}
        <View
          style={[
            styles.addressBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="location" size={14} color={colors.primary} />
          <Text
            numberOfLines={1}
            style={[styles.addressText, { color: colors.textPrimary }]}
          >
            {address}, {city}, {state} {zip}
          </Text>
        </View>
      </View>

      {/* Nav picker sheet */}
      <Modal visible={navVisible} transparent animationType="none" onRequestClose={closeNavSheet}>
        <Pressable style={styles.overlay} onPress={closeNavSheet}>
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, transform: [{ translateY: sheetTranslate }] },
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Navigate</Text>

            {NAV_OPTIONS.filter((o) => !o.iosOnly || Platform.OS === "ios").map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => openWith(opt.key)}
                style={[styles.navRow, { borderColor: colors.border }]}
              >
                <View style={[styles.navIcon, { backgroundColor: opt.color + "18" }]}>
                  <Ionicons name={opt.icon} size={20} color={opt.color} />
                </View>
                <Text style={[styles.navLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </Pressable>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    height: 200,
    borderRadius: Radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  placeholder: {
    height: 200,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
  },

  errorText: {
    fontSize: 13,
    textAlign: "center",
  },

  openText: {
    fontSize: 13,
    fontWeight: "700",
  },

  openBtn: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },

  openBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },

  addressBar: {
    position: "absolute",
    bottom: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },

  addressText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 32,
    paddingTop: 12,
  },

  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },

  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },

  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },

  navIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  navLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
});

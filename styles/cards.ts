import { StyleSheet } from "react-native";
import { Radius, Spacing } from "./spacing";
import { Typography } from "./typography";
import { Shadows } from "./shadows";

export const Card = StyleSheet.create({
  // Base card
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.card,
  },

  // Card header row
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },

  title: {
    ...Typography.sectionTitle,
    fontWeight: "700",
  },

  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },

  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  pillText: {
    ...Typography.body,
    fontWeight: "600",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  backdropFill: {
    ...StyleSheet.absoluteFillObject,
  },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: "hidden",
  },

  sheetHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sheetTitle: {
    ...Typography.h2,
    fontWeight: "800",
  },

  sheetContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  groupTitle: {
    ...Typography.body,
    fontWeight: "700",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  row: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
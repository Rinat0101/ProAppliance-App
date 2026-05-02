import { Radius, Spacing } from "./spacing";
import { Shadows } from "./shadows";
import type { AppColors } from "./colors";

export const BottomNavStyle = (colors: AppColors) => ({
  height: 72,
  backgroundColor: colors.surface,
  borderTopWidth: 1,
  borderTopColor: colors.divider,
  borderTopLeftRadius: Radius.nav,
  borderTopRightRadius: Radius.nav,
  paddingBottom: Spacing.sm,
  ...Shadows.sheet,
});
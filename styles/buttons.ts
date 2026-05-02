import { Radius, Spacing } from "./spacing";
import type { AppColors } from "./colors";

export const ButtonBase = {
  height: 44,
  borderRadius: Radius.xxl,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: Spacing.xl,
};

export const ButtonVariants = {
  primary: (colors: AppColors) => ({
    backgroundColor: colors.primary,
  }),
  secondary: (colors: AppColors) => ({
    backgroundColor: colors.secondary,
  }),
  outline: (colors: AppColors) => ({
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "transparent",
  }),
  destructive: (colors: AppColors) => ({
    backgroundColor: colors.destructive,
  }),
};
export const LightColors = {
    background: "#FFFFFF",
    foreground: "#121212",
    surface: "#FFFFFF",
  
    header: "#253845",
    headerForeground: "#FFFFFF",
  
    primary: "#33A68C",
    primaryHover: "#2E957E",
    primaryLight: "#E6FFF9",
  
    secondary: "#3E5366",
    accent: "#809FB4",
  
    textPrimary: "#121212",
    textSecondary: "#6B7280",
    textTertiary: "#9CA3AF",
  
    border: "#E5E7EB",
    divider: "#E5E7EB",
    muted: "#F5F5F7",
  
    destructive: "#EF4444",
  
    success: "#6FCF97",
    warning: "#F2C94C",
    info: "#809FB4",
  } as const;
  
  export const DarkColors = {
    background: "#1F252E",
    foreground: "#FAFAFA",
    surface: "#191E25",
  
    header: "#151A20",
    headerForeground: "#FAFAFA",
  
    primary: "#33A68C",
    primaryHover: "#2E957E",
    primaryLight: "#1E3D36",
  
    secondary: "#2D3D4D",
    accent: "#809FB4",
  
    textPrimary: "#FAFAFA",
    textSecondary: "#C0C6D1",
    textTertiary: "#8A94A6",
  
    border: "#2A3240",
    divider: "#2A3240",
    muted: "#252D38",
  
    destructive: "#EF4444",
  
    success: "#6FCF97",
    warning: "#F2C94C",
    info: "#809FB4",
  } as const;
  
  export type AppColors = typeof LightColors;
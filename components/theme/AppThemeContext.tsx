import React, { createContext, useContext, useMemo, useState } from "react";

export type AppThemeMode = "light" | "dark";

type AppThemeContextValue = {
  mode: AppThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: AppThemeMode) => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppThemeMode>("light");

  const value = useMemo(
    () => ({
      mode,
      toggleTheme: () => setMode((prev) => (prev === "light" ? "dark" : "light")),
      setTheme: (next: AppThemeMode) => setMode(next),
    }),
    [mode]
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(AppThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used inside AppThemeProvider");
  return ctx;
}
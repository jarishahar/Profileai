// "use client";

// import React, { createContext, useContext, useEffect, useState } from "react";
// import type { ThemeName } from "@/lib/themes/theme-config";

// interface ThemeContextType {
//   theme: ThemeName;
//   setTheme: (theme: ThemeName) => void;
//   isDark: boolean;
//   setIsDark: (isDark: boolean) => void;
// }

// const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// export function ThemeProvider({ children }: { children: React.ReactNode }) {
//   const [theme, setThemeState] = useState<ThemeName>("default");
//   const [isDark, setIsDarkState] = useState(false);
//   const [mounted, setMounted] = useState(false);

//   // Load theme from localStorage on mount
//   useEffect(() => {
//     const savedTheme = (localStorage.getItem("app-theme") || "default") as ThemeName;
//     // Default to light mode (false) regardless of system preference
//     const savedIsDark = localStorage.getItem("app-dark-mode") === "true";

//     setThemeState(savedTheme);
//     setIsDarkState(savedIsDark);
//     setMounted(true);

//     // Apply theme immediately
//     applyTheme(savedTheme, savedIsDark);
//   }, []);

//   const handleSetTheme = (newTheme: ThemeName) => {
//     setThemeState(newTheme);
//     localStorage.setItem("app-theme", newTheme);
//     applyTheme(newTheme, isDark);
//   };

//   const handleSetIsDark = (newIsDark: boolean) => {
//     setIsDarkState(newIsDark);
//     localStorage.setItem("app-dark-mode", String(newIsDark));
//     applyTheme(theme, newIsDark);
//   };

//   // Watch system theme changes
//   useEffect(() => {
//     if (!mounted) return;

//     const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
//     const handleChange = (e: MediaQueryListEvent) => {
//       // Only update if user explicitly set dark mode
//       const userPreference = localStorage.getItem("app-dark-mode");
//       if (userPreference === null) {
//         // User hasn't explicitly set preference, don't auto-switch
//         return;
//       }

//       const newIsDark = e.matches;
//       setIsDarkState(newIsDark);
//       localStorage.setItem("app-dark-mode", String(newIsDark));
//       applyTheme(theme, newIsDark);
//     };

//     mediaQuery.addEventListener("change", handleChange);
//     return () => mediaQuery.removeEventListener("change", handleChange);
//   }, [theme, mounted]);

//   return (
//     <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, isDark, setIsDark: handleSetIsDark }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// }

// export function useTheme(): ThemeContextType {
//   const context = useContext(ThemeContext);
//   if (!context) {
//     throw new Error("useTheme must be used within a ThemeProvider");
//   }
//   return context;
// }

// function applyTheme(themeName: ThemeName, isDark: boolean) {
//   const root = document.documentElement;

//   // Set data-theme attribute to switch theme colors via CSS selectors
//   root.setAttribute("data-theme", themeName);

//   // Update dark/light mode classes
//   if (isDark) {
//     root.classList.add("dark");
//     root.classList.remove("light");
//   } else {
//     root.classList.add("light");
//     root.classList.remove("dark");
//   }
// }

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { ThemeName } from "@/lib/themes/theme-config";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("default");
  const [isDark, setIsDarkState] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = (localStorage.getItem("app-theme") ||
      "default") as ThemeName;
    const savedIsDark = localStorage.getItem("app-dark-mode") === "true";

    setThemeState(savedTheme);
    setIsDarkState(savedIsDark);
    setMounted(true);

    // Apply theme immediately
    applyTheme(savedTheme, savedIsDark);
  }, []);

  const handleSetTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem("app-theme", newTheme);
    applyTheme(newTheme, isDark);
  };

  const handleSetIsDark = (newIsDark: boolean) => {
    setIsDarkState(newIsDark);
    localStorage.setItem("app-dark-mode", String(newIsDark));
    applyTheme(theme, newIsDark);
  };

  // Watch system theme changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user explicitly set dark mode
      const userPreference = localStorage.getItem("app-dark-mode");
      if (userPreference === null) {
        return;
      }

      const newIsDark = e.matches;
      setIsDarkState(newIsDark);
      localStorage.setItem("app-dark-mode", String(newIsDark));
      applyTheme(theme, newIsDark);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: handleSetTheme,
        isDark,
        setIsDark: handleSetIsDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

function applyTheme(themeName: ThemeName, isDark: boolean) {
  const root = document.documentElement;

  // Set data-theme attribute to switch theme colors via CSS selectors
  root.setAttribute("data-theme", themeName);

  // Toggle dark/light mode classes
  if (isDark) {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
  }
}

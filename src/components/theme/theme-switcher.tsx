"use client";

import React, { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/themes/theme-provider";
import { getAllThemes } from "@/lib/themes/theme-config";
import { cn } from "lib/utils";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  return <ThemeSwitcherContent />;
}

function ThemeSwitcherContent() {
  const { theme, setTheme, isDark, setIsDark } = useTheme();
  const themes = getAllThemes();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Toggle theme and color scheme"
        >
          {isDark ? (
            <Moon className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64 p-0 border-0 shadow-lg bg-background"
      >
        {/* Header with Light label and toggle buttons */}
        <div className="sticky top-0 z-50 border-b border-border bg-background px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {" "}
              {isDark ? "Dark" : "Light"}
            </span>
            <div className="flex gap-1 rounded-full bg-muted p-0.5">
              <button
                onClick={() => setIsDark(false)}
                className={cn(
                  "flex items-center justify-center rounded-full h-7 w-7 transition-all",
                  !isDark
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Light mode"
                title="Light mode"
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsDark(true)}
                className={cn(
                  "flex items-center justify-center rounded-full h-7 w-7 transition-all",
                  isDark
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Dark mode"
                title="Dark mode"
              >
                <Moon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Theme color list */}
        <div className="max-h-96 overflow-y-auto no-scrollbar">
          {themes.map((themeConfig, index) => (
            <button
              key={themeConfig.name}
              onClick={() => setTheme(themeConfig.name)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm transition-all relative group",
                "border-b border-border/50 last:border-b-0",
                "hover:bg-accent/50",
                theme === themeConfig.name
                  ? "bg-primary/5 border-l-4 border-l-primary"
                  : "border-l-4 border-l-transparent",
              )}
            >
              {/* Color swatches */}
              <div className="flex gap-1 flex-shrink-0">
                <div
                  className="w-3 h-3 rounded-sm border border-border/30"
                  style={{
                    backgroundColor: themeConfig.colors.light.primary,
                  }}
                  title={`${themeConfig.label} - Primary`}
                />
                <div
                  className="w-3 h-3 rounded-sm border border-border/30"
                  style={{
                    backgroundColor: themeConfig.colors.light.accent,
                  }}
                  title={`${themeConfig.label} - Accent`}
                />
              </div>

              {/* Theme name */}
              <span className="flex-1 text-left font-normal text-foreground">
                {themeConfig.label}
              </span>

              {/* Indicator for current theme */}
              {theme === themeConfig.name && (
                <div className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

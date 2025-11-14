"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTheme } from "@/lib/themes/theme-provider";
import { getAllThemes } from "@/lib/themes/theme-config";
import { cn } from "lib/utils";

export function ThemeSettings() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Theme Color</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <ThemeSettingsContent />;
}

function ThemeSettingsContent() {
  const { theme, setTheme, isDark, setIsDark } = useTheme();
  const themes = getAllThemes();

  return (
    <div className="space-y-6">
      {/* Theme Color Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Color</CardTitle>
          <CardDescription>
            Choose your preferred color theme for the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {themes.map((themeConfig) => (
              <button
                key={themeConfig.name}
                onClick={() => setTheme(themeConfig.name)}
                className={cn(
                  "group relative overflow-hidden rounded-lg border-2 p-4 transition-all",
                  "hover:shadow-md",
                  theme === themeConfig.name
                    ? "border-primary shadow-lg"
                    : "border-muted hover:border-muted-foreground",
                )}
              >
                {/* Color preview */}
                <div className="mb-3 flex gap-2">
                  <div
                    className="h-8 w-full rounded-md transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: themeConfig.colors.light.primary,
                    }}
                  />
                  <div
                    className="h-8 w-full rounded-md transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: themeConfig.colors.light.accent,
                    }}
                  />
                </div>

                {/* Theme name */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {themeConfig.label}
                  </span>
                  {theme === themeConfig.name && (
                    <div className="h-3 w-3 rounded-full bg-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Appearance Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose between light and dark mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              variant={!isDark ? "default" : "outline"}
              onClick={() => setIsDark(false)}
              className="flex-1 gap-2"
            >
              <Sun className="h-4 w-4" />
              Light
            </Button>
            <Button
              variant={isDark ? "default" : "outline"}
              onClick={() => setIsDark(true)}
              className="flex-1 gap-2"
            >
              <Moon className="h-4 w-4" />
              Dark
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

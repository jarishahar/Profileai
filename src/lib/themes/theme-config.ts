// Theme configuration with multiple color schemes
export type ThemeName =
  | "default"
  | "zinc"
  | "slate"
  | "stone"
  | "gray"
  | "blue"
  | "orange"
  | "pink"
  | "bubblegum-pop"
  | "cyberpunk-neon"
  | "retro-arcade"
  | "tropical-paradise";

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryForeground: string;

  // Secondary colors
  secondary: string;
  secondaryForeground: string;

  // Accent colors
  accent: string;
  accentForeground: string;

  // Neutral colors
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
}

export interface ThemeConfig {
  name: ThemeName;
  label: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
}

// OKHSL color values in oklch format for precise color management
export const THEMES: Record<ThemeName, ThemeConfig> = {
  default: {
    name: "default",
    label: "Default",
    colors: {
      light: {
        primary: "oklch(0.216 0.006 56.043)",
        primaryForeground: "oklch(0.985 0.001 106.423)",
        secondary: "oklch(0.97 0.001 106.424)",
        secondaryForeground: "oklch(0.216 0.006 56.043)",
        accent: "oklch(0.97 0.001 106.424)",
        accentForeground: "oklch(0.216 0.006 56.043)",
        background: "oklch(1 0 0)",
        foreground: "oklch(0.147 0.004 49.25)",
        card: "oklch(1 0 0)",
        cardForeground: "oklch(0.147 0.004 49.25)",
        muted: "oklch(0.97 0.001 106.424)",
        mutedForeground: "oklch(0.553 0.013 58.071)",
        border: "oklch(0.923 0.003 48.717)",
        input: "oklch(0.923 0.003 48.717)",
        ring: "oklch(0.709 0.01 56.259)",
        destructive: "oklch(0.577 0.245 27.325)",
      },
      dark: {
        primary: "oklch(0.923 0.003 48.717)",
        primaryForeground: "oklch(0.216 0.006 56.043)",
        secondary: "oklch(0.268 0.007 34.298)",
        secondaryForeground: "oklch(0.985 0.001 106.423)",
        accent: "oklch(0.268 0.007 34.298)",
        accentForeground: "oklch(0.985 0.001 106.423)",
        background: "oklch(0.147 0.004 49.25)",
        foreground: "oklch(0.985 0.001 106.423)",
        card: "oklch(0.216 0.006 56.043)",
        cardForeground: "oklch(0.985 0.001 106.423)",
        muted: "oklch(0.268 0.007 34.298)",
        mutedForeground: "oklch(0.709 0.01 56.259)",
        border: "oklch(1 0 0 / 10%)",
        input: "oklch(1 0 0 / 15%)",
        ring: "oklch(0.553 0.013 58.071)",
        destructive: "oklch(0.704 0.191 22.216)",
      },
    },
  },

  zinc: {
    name: "zinc",
    label: "Zinc",
    colors: {
      light: {
        primary: "oklch(0.242 0.007 265.755)",
        primaryForeground: "oklch(0.985 0.001 106.423)",
        secondary: "oklch(0.93 0.002 264.695)",
        secondaryForeground: "oklch(0.242 0.007 265.755)",
        accent: "oklch(0.93 0.002 264.695)",
        accentForeground: "oklch(0.242 0.007 265.755)",
        background: "oklch(1 0 0)",
        foreground: "oklch(0.11 0.001 264.695)",
        card: "oklch(1 0 0)",
        cardForeground: "oklch(0.11 0.001 264.695)",
        muted: "oklch(0.93 0.002 264.695)",
        mutedForeground: "oklch(0.425 0.005 264.695)",
        border: "oklch(0.93 0.002 264.695)",
        input: "oklch(0.93 0.002 264.695)",
        ring: "oklch(0.242 0.007 265.755)",
        destructive: "oklch(0.577 0.245 27.325)",
      },
      dark: {
        primary: "oklch(0.85 0.007 265.755)",
        primaryForeground: "oklch(0.11 0.001 264.695)",
        secondary: "oklch(0.27 0.006 265.755)",
        secondaryForeground: "oklch(0.985 0.001 106.423)",
        accent: "oklch(0.27 0.006 265.755)",
        accentForeground: "oklch(0.985 0.001 106.423)",
        background: "oklch(0.09 0.001 264.695)",
        foreground: "oklch(0.985 0.001 106.423)",
        card: "oklch(0.13 0.001 264.695)",
        cardForeground: "oklch(0.985 0.001 106.423)",
        muted: "oklch(0.27 0.006 265.755)",
        mutedForeground: "oklch(0.625 0.008 264.695)",
        border: "oklch(0.27 0.006 265.755)",
        input: "oklch(0.27 0.006 265.755 / 0.5)",
        ring: "oklch(0.85 0.007 265.755)",
        destructive: "oklch(0.704 0.191 22.216)",
      },
    },
  },

  slate: {
    name: "slate",
    label: "Slate",
    colors: {
      light: {
        primary: "oklch(0.234 0.006 256.802)",
        primaryForeground: "oklch(0.985 0.001 106.423)",
        secondary: "oklch(0.926 0.004 256.802)",
        secondaryForeground: "oklch(0.234 0.006 256.802)",
        accent: "oklch(0.926 0.004 256.802)",
        accentForeground: "oklch(0.234 0.006 256.802)",
        background: "oklch(1 0 0)",
        foreground: "oklch(0.139 0.006 256.802)",
        card: "oklch(1 0 0)",
        cardForeground: "oklch(0.139 0.006 256.802)",
        muted: "oklch(0.926 0.004 256.802)",
        mutedForeground: "oklch(0.425 0.008 256.802)",
        border: "oklch(0.926 0.004 256.802)",
        input: "oklch(0.926 0.004 256.802)",
        ring: "oklch(0.234 0.006 256.802)",
        destructive: "oklch(0.577 0.245 27.325)",
      },
      dark: {
        primary: "oklch(0.83 0.008 256.802)",
        primaryForeground: "oklch(0.139 0.006 256.802)",
        secondary: "oklch(0.267 0.01 256.802)",
        secondaryForeground: "oklch(0.985 0.001 106.423)",
        accent: "oklch(0.267 0.01 256.802)",
        accentForeground: "oklch(0.985 0.001 106.423)",
        background: "oklch(0.082 0.001 256.802)",
        foreground: "oklch(0.985 0.001 106.423)",
        card: "oklch(0.126 0.001 256.802)",
        cardForeground: "oklch(0.985 0.001 106.423)",
        muted: "oklch(0.267 0.01 256.802)",
        mutedForeground: "oklch(0.625 0.01 256.802)",
        border: "oklch(0.267 0.01 256.802)",
        input: "oklch(0.267 0.01 256.802 / 0.5)",
        ring: "oklch(0.83 0.008 256.802)",
        destructive: "oklch(0.704 0.191 22.216)",
      },
    },
  },

  stone: {
    name: "stone",
    label: "Stone",
    colors: {
      light: {
        primary: "oklch(0.226 0.005 49.25)",
        primaryForeground: "oklch(0.985 0.001 106.423)",
        secondary: "oklch(0.923 0.003 49.25)",
        secondaryForeground: "oklch(0.226 0.005 49.25)",
        accent: "oklch(0.923 0.003 49.25)",
        accentForeground: "oklch(0.226 0.005 49.25)",
        background: "oklch(1 0 0)",
        foreground: "oklch(0.147 0.004 49.25)",
        card: "oklch(1 0 0)",
        cardForeground: "oklch(0.147 0.004 49.25)",
        muted: "oklch(0.923 0.003 49.25)",
        mutedForeground: "oklch(0.553 0.013 58.071)",
        border: "oklch(0.923 0.003 49.25)",
        input: "oklch(0.923 0.003 49.25)",
        ring: "oklch(0.226 0.005 49.25)",
        destructive: "oklch(0.577 0.245 27.325)",
      },
      dark: {
        primary: "oklch(0.874 0.005 49.25)",
        primaryForeground: "oklch(0.226 0.005 49.25)",
        secondary: "oklch(0.281 0.007 49.25)",
        secondaryForeground: "oklch(0.985 0.001 106.423)",
        accent: "oklch(0.281 0.007 49.25)",
        accentForeground: "oklch(0.985 0.001 106.423)",
        background: "oklch(0.101 0.002 49.25)",
        foreground: "oklch(0.985 0.001 106.423)",
        card: "oklch(0.146 0.002 49.25)",
        cardForeground: "oklch(0.985 0.001 106.423)",
        muted: "oklch(0.281 0.007 49.25)",
        mutedForeground: "oklch(0.709 0.01 56.259)",
        border: "oklch(0.281 0.007 49.25 / 0.5)",
        input: "oklch(0.281 0.007 49.25 / 0.3)",
        ring: "oklch(0.874 0.005 49.25)",
        destructive: "oklch(0.704 0.191 22.216)",
      },
    },
  },

  gray: {
    name: "gray",
    label: "Gray",
    colors: {
      light: {
        primary: "oklch(0.278 0.006 246.616)",
        primaryForeground: "oklch(0.985 0.001 106.423)",
        secondary: "oklch(0.923 0.002 246.616)",
        secondaryForeground: "oklch(0.278 0.006 246.616)",
        accent: "oklch(0.923 0.002 246.616)",
        accentForeground: "oklch(0.278 0.006 246.616)",
        background: "oklch(1 0 0)",
        foreground: "oklch(0.15 0.002 246.616)",
        card: "oklch(1 0 0)",
        cardForeground: "oklch(0.15 0.002 246.616)",
        muted: "oklch(0.923 0.002 246.616)",
        mutedForeground: "oklch(0.425 0.004 246.616)",
        border: "oklch(0.923 0.002 246.616)",
        input: "oklch(0.923 0.002 246.616)",
        ring: "oklch(0.278 0.006 246.616)",
        destructive: "oklch(0.577 0.245 27.325)",
      },
      dark: {
        primary: "oklch(0.799 0.008 246.616)",
        primaryForeground: "oklch(0.15 0.002 246.616)",
        secondary: "oklch(0.299 0.008 246.616)",
        secondaryForeground: "oklch(0.985 0.001 106.423)",
        accent: "oklch(0.299 0.008 246.616)",
        accentForeground: "oklch(0.985 0.001 106.423)",
        background: "oklch(0.1 0.001 246.616)",
        foreground: "oklch(0.985 0.001 106.423)",
        card: "oklch(0.14 0.001 246.616)",
        cardForeground: "oklch(0.985 0.001 106.423)",
        muted: "oklch(0.299 0.008 246.616)",
        mutedForeground: "oklch(0.625 0.008 246.616)",
        border: "oklch(0.299 0.008 246.616)",
        input: "oklch(0.299 0.008 246.616 / 0.5)",
        ring: "oklch(0.799 0.008 246.616)",
        destructive: "oklch(0.704 0.191 22.216)",
      },
    },
  },

  blue: {
    name: "blue",
    label: "Blue",
    colors: {
      light: {
        primary: "oklch(0.255 0.108 252.428)",
        primaryForeground: "oklch(0.985 0.001 106.423)",
        secondary: "oklch(0.916 0.038 252.428)",
        secondaryForeground: "oklch(0.255 0.108 252.428)",
        accent: "oklch(0.916 0.038 252.428)",
        accentForeground: "oklch(0.255 0.108 252.428)",
        background: "oklch(1 0 0)",
        foreground: "oklch(0.15 0.022 252.428)",
        card: "oklch(1 0 0)",
        cardForeground: "oklch(0.15 0.022 252.428)",
        muted: "oklch(0.916 0.038 252.428)",
        mutedForeground: "oklch(0.45 0.06 252.428)",
        border: "oklch(0.916 0.038 252.428)",
        input: "oklch(0.916 0.038 252.428)",
        ring: "oklch(0.255 0.108 252.428)",
        destructive: "oklch(0.577 0.245 27.325)",
      },
      dark: {
        primary: "oklch(0.68 0.133 252.428)",
        primaryForeground: "oklch(0.15 0.022 252.428)",
        secondary: "oklch(0.35 0.078 252.428)",
        secondaryForeground: "oklch(0.985 0.001 106.423)",
        accent: "oklch(0.35 0.078 252.428)",
        accentForeground: "oklch(0.985 0.001 106.423)",
        background: "oklch(0.105 0.01 252.428)",
        foreground: "oklch(0.985 0.001 106.423)",
        card: "oklch(0.15 0.015 252.428)",
        cardForeground: "oklch(0.985 0.001 106.423)",
        muted: "oklch(0.35 0.078 252.428)",
        mutedForeground: "oklch(0.625 0.08 252.428)",
        border: "oklch(0.35 0.078 252.428 / 0.6)",
        input: "oklch(0.35 0.078 252.428 / 0.3)",
        ring: "oklch(0.68 0.133 252.428)",
        destructive: "oklch(0.704 0.191 22.216)",
      },
    },
  },

  orange: {
    name: "orange",
    label: "Orange",
    colors: {
      light: {
        primary: "oklch(0.605 0.209 39.001)",
        primaryForeground: "oklch(0.985 0.001 106.423)",
        secondary: "oklch(0.928 0.056 39.001)",
        secondaryForeground: "oklch(0.605 0.209 39.001)",
        accent: "oklch(0.928 0.056 39.001)",
        accentForeground: "oklch(0.605 0.209 39.001)",
        background: "oklch(1 0 0)",
        foreground: "oklch(0.15 0.02 39.001)",
        card: "oklch(1 0 0)",
        cardForeground: "oklch(0.15 0.02 39.001)",
        muted: "oklch(0.928 0.056 39.001)",
        mutedForeground: "oklch(0.45 0.08 39.001)",
        border: "oklch(0.928 0.056 39.001)",
        input: "oklch(0.928 0.056 39.001)",
        ring: "oklch(0.605 0.209 39.001)",
        destructive: "oklch(0.577 0.245 27.325)",
      },
      dark: {
        primary: "oklch(0.73 0.25 39.001)",
        primaryForeground: "oklch(0.15 0.02 39.001)",
        secondary: "oklch(0.45 0.15 39.001)",
        secondaryForeground: "oklch(0.985 0.001 106.423)",
        accent: "oklch(0.45 0.15 39.001)",
        accentForeground: "oklch(0.985 0.001 106.423)",
        background: "oklch(0.105 0.01 39.001)",
        foreground: "oklch(0.985 0.001 106.423)",
        card: "oklch(0.15 0.02 39.001)",
        cardForeground: "oklch(0.985 0.001 106.423)",
        muted: "oklch(0.45 0.15 39.001)",
        mutedForeground: "oklch(0.73 0.25 39.001)",
        border: "oklch(0.45 0.15 39.001 / 0.6)",
        input: "oklch(0.45 0.15 39.001 / 0.3)",
        ring: "oklch(0.73 0.25 39.001)",
        destructive: "oklch(0.704 0.191 22.216)",
      },
    },
  },

  pink: {
    name: "pink",
    label: "Pink",
    colors: {
      light: {
        primary: "oklch(0.554 0.206 348.967)",
        primaryForeground: "oklch(0.985 0.001 106.423)",
        secondary: "oklch(0.918 0.047 348.967)",
        secondaryForeground: "oklch(0.554 0.206 348.967)",
        accent: "oklch(0.918 0.047 348.967)",
        accentForeground: "oklch(0.554 0.206 348.967)",
        background: "oklch(1 0 0)",
        foreground: "oklch(0.15 0.02 348.967)",
        card: "oklch(1 0 0)",
        cardForeground: "oklch(0.15 0.02 348.967)",
        muted: "oklch(0.918 0.047 348.967)",
        mutedForeground: "oklch(0.45 0.07 348.967)",
        border: "oklch(0.918 0.047 348.967)",
        input: "oklch(0.918 0.047 348.967)",
        ring: "oklch(0.554 0.206 348.967)",
        destructive: "oklch(0.577 0.245 27.325)",
      },
      dark: {
        primary: "oklch(0.72 0.25 348.967)",
        primaryForeground: "oklch(0.15 0.02 348.967)",
        secondary: "oklch(0.42 0.14 348.967)",
        secondaryForeground: "oklch(0.985 0.001 106.423)",
        accent: "oklch(0.42 0.14 348.967)",
        accentForeground: "oklch(0.985 0.001 106.423)",
        background: "oklch(0.105 0.01 348.967)",
        foreground: "oklch(0.985 0.001 106.423)",
        card: "oklch(0.15 0.02 348.967)",
        cardForeground: "oklch(0.985 0.001 106.423)",
        muted: "oklch(0.42 0.14 348.967)",
        mutedForeground: "oklch(0.72 0.25 348.967)",
        border: "oklch(0.42 0.14 348.967 / 0.6)",
        input: "oklch(0.42 0.14 348.967 / 0.3)",
        ring: "oklch(0.72 0.25 348.967)",
        destructive: "oklch(0.704 0.191 22.216)",
      },
    },
  },

  "bubblegum-pop": {
    name: "bubblegum-pop",
    label: "Bubblegum-pop",
    colors: {
      light: {
        primary: "oklch(0.52 0.25 327.583)",
        primaryForeground: "oklch(0.985 0.001 106.423)",
        secondary: "oklch(0.88 0.08 327.583)",
        secondaryForeground: "oklch(0.52 0.25 327.583)",
        accent: "oklch(0.65 0.22 182.432)",
        accentForeground: "oklch(1 0 0)",
        background: "oklch(0.98 0.005 320)",
        foreground: "oklch(0.15 0.02 327.583)",
        card: "oklch(1 0 0)",
        cardForeground: "oklch(0.15 0.02 327.583)",
        muted: "oklch(0.88 0.08 327.583)",
        mutedForeground: "oklch(0.45 0.1 327.583)",
        border: "oklch(0.88 0.08 327.583)",
        input: "oklch(0.88 0.08 327.583)",
        ring: "oklch(0.65 0.22 182.432)",
        destructive: "oklch(0.65 0.25 23)",
      },
      dark: {
        primary: "oklch(0.75 0.28 327.583)",
        primaryForeground: "oklch(0.1 0.015 327.583)",
        secondary: "oklch(0.4 0.15 327.583)",
        secondaryForeground: "oklch(0.95 0.01 106.423)",
        accent: "oklch(0.65 0.22 182.432)",
        accentForeground: "oklch(0.15 0.02 182.432)",
        background: "oklch(0.1 0.01 327.583)",
        foreground: "oklch(0.95 0.01 106.423)",
        card: "oklch(0.15 0.015 327.583)",
        cardForeground: "oklch(0.95 0.01 106.423)",
        muted: "oklch(0.4 0.15 327.583)",
        mutedForeground: "oklch(0.75 0.28 327.583)",
        border: "oklch(0.4 0.15 327.583 / 0.6)",
        input: "oklch(0.4 0.15 327.583 / 0.3)",
        ring: "oklch(0.75 0.28 327.583)",
        destructive: "oklch(0.7 0.22 23)",
      },
    },
  },

  "cyberpunk-neon": {
    name: "cyberpunk-neon",
    label: "Cyberpunk-neon",
    colors: {
      light: {
        primary: "oklch(0.4 0.35 290.075)",
        primaryForeground: "oklch(1 0 0)",
        secondary: "oklch(0.65 0.25 39.001)",
        secondaryForeground: "oklch(0.1 0.01 290.075)",
        accent: "oklch(0.7 0.3 163.677)",
        accentForeground: "oklch(0 0 0)",
        background: "oklch(0.1 0.01 290.075)",
        foreground: "oklch(0.95 0.01 106.423)",
        card: "oklch(0.15 0.015 290.075)",
        cardForeground: "oklch(0.95 0.01 106.423)",
        muted: "oklch(0.3 0.1 290.075)",
        mutedForeground: "oklch(0.65 0.2 163.677)",
        border: "oklch(0.4 0.35 290.075)",
        input: "oklch(0.2 0.05 290.075)",
        ring: "oklch(0.7 0.3 163.677)",
        destructive: "oklch(0.7 0.3 10)",
      },
      dark: {
        primary: "oklch(0.6 0.4 290.075)",
        primaryForeground: "oklch(0.1 0.01 290.075)",
        secondary: "oklch(0.75 0.3 39.001)",
        secondaryForeground: "oklch(0.1 0.01 39.001)",
        accent: "oklch(0.8 0.35 163.677)",
        accentForeground: "oklch(0.1 0.01 163.677)",
        background: "oklch(0.05 0.01 290.075)",
        foreground: "oklch(0.98 0.01 106.423)",
        card: "oklch(0.12 0.01 290.075)",
        cardForeground: "oklch(0.98 0.01 106.423)",
        muted: "oklch(0.25 0.08 290.075)",
        mutedForeground: "oklch(0.8 0.35 163.677)",
        border: "oklch(0.6 0.4 290.075)",
        input: "oklch(0.15 0.04 290.075)",
        ring: "oklch(0.8 0.35 163.677)",
        destructive: "oklch(0.75 0.35 10)",
      },
    },
  },

  "retro-arcade": {
    name: "retro-arcade",
    label: "Retro-arcade",
    colors: {
      light: {
        primary: "oklch(0.55 0.25 23.202)",
        primaryForeground: "oklch(0.95 0 0)",
        secondary: "oklch(0.45 0.3 249.239)",
        secondaryForeground: "oklch(1 0 0)",
        accent: "oklch(0.65 0.25 89.513)",
        accentForeground: "oklch(0.15 0.02 89.513)",
        background: "oklch(0.15 0.02 300)",
        foreground: "oklch(0.95 0 0)",
        card: "oklch(0.2 0.03 300)",
        cardForeground: "oklch(0.95 0 0)",
        muted: "oklch(0.35 0.15 300)",
        mutedForeground: "oklch(0.65 0.25 89.513)",
        border: "oklch(0.55 0.25 23.202)",
        input: "oklch(0.25 0.08 300)",
        ring: "oklch(0.65 0.25 89.513)",
        destructive: "oklch(0.65 0.25 23.202)",
      },
      dark: {
        primary: "oklch(0.75 0.3 23.202)",
        primaryForeground: "oklch(0.15 0.02 300)",
        secondary: "oklch(0.65 0.35 249.239)",
        secondaryForeground: "oklch(0.1 0.01 249.239)",
        accent: "oklch(0.8 0.3 89.513)",
        accentForeground: "oklch(0.1 0.01 89.513)",
        background: "oklch(0.08 0.01 300)",
        foreground: "oklch(0.98 0.01 0)",
        card: "oklch(0.12 0.02 300)",
        cardForeground: "oklch(0.98 0.01 0)",
        muted: "oklch(0.3 0.1 300)",
        mutedForeground: "oklch(0.8 0.3 89.513)",
        border: "oklch(0.75 0.3 23.202)",
        input: "oklch(0.2 0.05 300)",
        ring: "oklch(0.8 0.3 89.513)",
        destructive: "oklch(0.75 0.3 23.202)",
      },
    },
  },

  "tropical-paradise": {
    name: "tropical-paradise",
    label: "Tropical-paradise",
    colors: {
      light: {
        primary: "oklch(0.55 0.2 163.677)",
        primaryForeground: "oklch(0.95 0.01 106.423)",
        secondary: "oklch(0.7 0.2 71.697)",
        secondaryForeground: "oklch(0.2 0.02 163.677)",
        accent: "oklch(0.65 0.22 41.73)",
        accentForeground: "oklch(1 0 0)",
        background: "oklch(0.95 0.02 163.677)",
        foreground: "oklch(0.2 0.02 163.677)",
        card: "oklch(1 0 0)",
        cardForeground: "oklch(0.2 0.02 163.677)",
        muted: "oklch(0.8 0.1 163.677)",
        mutedForeground: "oklch(0.4 0.05 163.677)",
        border: "oklch(0.8 0.1 163.677)",
        input: "oklch(0.85 0.08 163.677)",
        ring: "oklch(0.65 0.22 41.73)",
        destructive: "oklch(0.6 0.2 10.677)",
      },
      dark: {
        primary: "oklch(0.7 0.25 163.677)",
        primaryForeground: "oklch(0.1 0.01 163.677)",
        secondary: "oklch(0.6 0.25 71.697)",
        secondaryForeground: "oklch(0.95 0.01 106.423)",
        accent: "oklch(0.75 0.28 41.73)",
        accentForeground: "oklch(0.1 0.01 41.73)",
        background: "oklch(0.08 0.01 163.677)",
        foreground: "oklch(0.95 0.01 106.423)",
        card: "oklch(0.13 0.01 163.677)",
        cardForeground: "oklch(0.95 0.01 106.423)",
        muted: "oklch(0.3 0.08 163.677)",
        mutedForeground: "oklch(0.7 0.25 163.677)",
        border: "oklch(0.3 0.08 163.677)",
        input: "oklch(0.2 0.05 163.677)",
        ring: "oklch(0.75 0.28 41.73)",
        destructive: "oklch(0.7 0.25 10.677)",
      },
    },
  },
};

export function getThemeConfig(themeName: ThemeName): ThemeConfig {
  return THEMES[themeName];
}

export function getAllThemes(): ThemeConfig[] {
  return Object.values(THEMES);
}

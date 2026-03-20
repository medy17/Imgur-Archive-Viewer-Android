import { MD3DarkTheme } from "react-native-paper";

export const materialTheme = {
  ...MD3DarkTheme,
  dark: true,
  roundness: 7,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#F4B8C8",
    onPrimary: "#4B2330",
    primaryContainer: "#693847",
    onPrimaryContainer: "#FFD9E2",
    secondary: "#B8C8FF",
    onSecondary: "#1F2D61",
    secondaryContainer: "#36457B",
    onSecondaryContainer: "#DDE1FF",
    tertiary: "#A8D5BA",
    onTertiary: "#163825",
    tertiaryContainer: "#2B513B",
    onTertiaryContainer: "#C4F2D1",
    error: "#FFB4AB",
    onError: "#690005",
    errorContainer: "#93000A",
    onErrorContainer: "#FFDAD6",
    background: "#111315",
    onBackground: "#F1F0F3",
    surface: "#111315",
    onSurface: "#F1F0F3",
    surfaceVariant: "#20252A",
    onSurfaceVariant: "#C1C7CE",
    outline: "#5A6168",
    outlineVariant: "#353A40",
    elevation: {
      level0: "#111315",
      level1: "#111315",
      level2: "#111315",
      level3: "#111315",
      level4: "#111315",
      level5: "#111315",
    },
  },
};

export type MaterialTheme = typeof materialTheme;

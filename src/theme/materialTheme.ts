import { MD3DarkTheme } from "react-native-paper";

export const materialTheme = {
  ...MD3DarkTheme,
  dark: true,
  roundness: 7,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#8CB4FF",
    onPrimary: "#0D223F",
    primaryContainer: "#1D3B66",
    onPrimaryContainer: "#D9E6FF",
    secondary: "#F2C14E",
    onSecondary: "#3C2B00",
    secondaryContainer: "#5A4300",
    onSecondaryContainer: "#FFE7A9",
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

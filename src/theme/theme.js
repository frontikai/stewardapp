import { DefaultTheme as PaperDefaultTheme, MD3DarkTheme } from 'react-native-paper';
import { Platform } from 'react-native';

// Define our custom theme that extends React Native Paper's theme
export const theme = {
  ...PaperDefaultTheme,
  colors: {
    ...PaperDefaultTheme.colors,
    primary: '#3f51b5',           // Indigo
    primaryContainer: '#e8eaf6',
    secondary: '#009688',         // Teal
    secondaryContainer: '#e0f2f1',
    tertiary: '#8bc34a',          // Light Green
    tertiaryContainer: '#f1f8e9',
    error: '#f44336',             // Red
    errorContainer: '#ffebee',
    background: '#ffffff',
    surface: '#ffffff',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onTertiary: '#ffffff',
    onError: '#ffffff',
    text: '#212121',
    onBackground: '#212121',
    onSurface: '#212121',
    disabled: '#9e9e9e',
    placeholder: '#9e9e9e',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  fonts: Platform.select({
    ios: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500',
      },
      light: {
        fontFamily: 'System',
        fontWeight: '300',
      },
      thin: {
        fontFamily: 'System',
        fontWeight: '100',
      },
    },
    android: {
      regular: {
        fontFamily: 'sans-serif',
        fontWeight: 'normal',
      },
      medium: {
        fontFamily: 'sans-serif-medium',
        fontWeight: 'normal',
      },
      light: {
        fontFamily: 'sans-serif-light',
        fontWeight: 'normal',
      },
      thin: {
        fontFamily: 'sans-serif-thin',
        fontWeight: 'normal',
      },
    },
    default: {
      regular: {
        fontFamily: 'sans-serif',
        fontWeight: 'normal',
      },
      medium: {
        fontFamily: 'sans-serif-medium',
        fontWeight: 'normal',
      },
      light: {
        fontFamily: 'sans-serif-light',
        fontWeight: 'normal',
      },
      thin: {
        fontFamily: 'sans-serif-thin',
        fontWeight: 'normal',
      },
    },
  }),
  animation: {
    scale: 1.0,
  },
  roundness: 4,
  elevation: {
    level0: 0,
    level1: 2,
    level2: 4,
    level3: 6,
    level4: 8,
    level5: 12,
  },
};

// Dark theme configuration
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#5c6bc0',           // Indigo 400
    primaryContainer: '#303f9f',  // Indigo 700
    secondary: '#26a69a',         // Teal 400
    secondaryContainer: '#00796b', // Teal 700
    tertiary: '#9ccc65',          // Light Green 400
    tertiaryContainer: '#689f38', // Light Green 700
    error: '#e57373',             // Red 300
    errorContainer: '#d32f2f',    // Red 700
    background: '#121212',
    surface: '#121212',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onTertiary: '#ffffff',
    onError: '#ffffff',
    text: '#ffffff',
    onBackground: '#ffffff',
    onSurface: '#ffffff',
    disabled: '#757575',
    placeholder: '#757575',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  fonts: theme.fonts,
  animation: theme.animation,
  roundness: theme.roundness,
  elevation: theme.elevation,
};

/**
 * Get the appropriate theme based on color scheme and user preference
 * @param {string} colorScheme The device color scheme ('light' or 'dark')
 * @param {string} userThemePref User's theme preference ('light', 'dark', or 'auto')
 * @returns {Object} The appropriate theme object
 */
export const getTheme = (colorScheme, userThemePref = 'auto') => {
  // If user prefers a specific theme, use that
  if (userThemePref === 'light') {
    return theme;
  }
  
  if (userThemePref === 'dark') {
    return darkTheme;
  }
  
  // Otherwise, follow device setting (auto)
  return colorScheme === 'dark' ? darkTheme : theme;
};
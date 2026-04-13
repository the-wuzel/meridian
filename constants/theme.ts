/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */


const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#f5f5f5',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Semantic tokens
    backgroundSecondary: '#ffffff',
    cardBorder: '#e9ecef',
    textPrimary: '#11181C',
    textSecondary: '#687076',
    textTertiary: '#8D969E',
    iconPrimary: '#11181C',
    iconSecondary: '#687076',
    iconTertiary: '#8D969E',
    backgroundTertiary: '#f5f5f5', // same as background
    primaryButton: '#0a7ea4',
    deleteIcon: '#dc3545',
    successIcon: '#28a745',
    savedIcon: '#e0a800',
    shadow: '#000',
    cancelIcon: '#888',
    snackbarBackground: '#1e1e1e', // Dark background for contrast in light mode
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Semantic tokens
    backgroundSecondary: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    textPrimary: '#ECEDEE',
    textSecondary: 'rgba(255, 255, 255, 0.9)',
    textTertiary: 'rgba(255, 255, 255, 0.6)',
    iconPrimary: '#ECEDEE',
    iconSecondary: 'rgba(255, 255, 255, 0.7)',
    iconTertiary: 'rgba(255, 255, 255, 0.5)',
    backgroundTertiary: 'rgba(0, 0, 0, 0.2)',
    primaryButton: '#0a7ea4',
    deleteIcon: '#ff6b6b',
    successIcon: '#0a7ea4',
    savedIcon: '#ffd700',
    shadow: '#000',
    cancelIcon: '#888',
    snackbarBackground: '#333',
  },
};

export const ColorPalette = [
  '#6366f1', // Indigo (Default)
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#06b6d4', // Cyan
];

export const Fonts = {
  primary: {
    regular: 'PlusJakartaSans-Regular',
    semiBold: 'PlusJakartaSans-SemiBold',
    bold: 'PlusJakartaSans-Bold',
  },
  accent: {
    regular: 'PlayfairDisplay-Regular',
    bold: 'PlayfairDisplay-Bold',
  }
};

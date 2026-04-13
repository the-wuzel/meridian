import { useSettings } from '@/context/SettingsContext';

export function useColorScheme() {
    const { preferences } = useSettings();
    return preferences.isDarkMode ? 'dark' : 'light';
}

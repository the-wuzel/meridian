import { ColorPalette } from '@/constants/theme';
import { getAllSettings, saveSetting } from '@/services/database';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Preferences = {
    showDailyQuote: boolean;
    showMorningRoutine: boolean;
    showEveningReflection: boolean;
    showDailyGratitude: boolean;
    primaryColorIndex: number;
    morningNotificationEnabled: boolean;
    morningNotificationHour: number;
    morningNotificationMinute: number;
    eveningNotificationEnabled: boolean;
    eveningNotificationHour: number;
    eveningNotificationMinute: number;
    isDarkMode: boolean;
    userName: string;
    showGreeting: boolean;
};

type SettingsContextType = {
    preferences: Preferences;
    updatePreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
    primaryColor: string;
    isLoading: boolean;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [preferences, setPreferences] = useState<Preferences>({
        showDailyQuote: true,
        showMorningRoutine: true,
        showEveningReflection: true,
        showDailyGratitude: true,
        primaryColorIndex: 0,
        morningNotificationEnabled: true,
        morningNotificationHour: 7,
        morningNotificationMinute: 0,
        eveningNotificationEnabled: true,
        eveningNotificationHour: 18,
        eveningNotificationMinute: 0,
        isDarkMode: false,
        userName: '',
        showGreeting: true,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await getAllSettings();
            setPreferences({
                showDailyQuote: settings.setting_dailyQuote ?? true,
                showMorningRoutine: settings.setting_morningRoutine ?? true,
                showEveningReflection: settings.setting_eveningReflection ?? true,
                showDailyGratitude: settings.setting_dailyGratitude ?? true,
                primaryColorIndex: settings.setting_primaryColorIndex ?? 0,
                morningNotificationEnabled: settings.setting_morningNotificationEnabled ?? true,
                morningNotificationHour: settings.setting_morningNotificationHour ?? 7,
                morningNotificationMinute: settings.setting_morningNotificationMinute ?? 0,
                eveningNotificationEnabled: settings.setting_eveningNotificationEnabled ?? true,
                eveningNotificationHour: settings.setting_eveningNotificationHour ?? 18,
                eveningNotificationMinute: settings.setting_eveningNotificationMinute ?? 0,
                isDarkMode: settings.setting_isDarkMode ?? false,
                userName: settings.setting_userName ?? '',
                showGreeting: settings.setting_showGreeting ?? true,
            });
        } catch (e) {
            console.error('Failed to load settings', e);
        } finally {
            setIsLoading(false);
        }
    };

    const updatePreference = async <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
        try {
            await saveSetting(`setting_${key}`, value as any);
        } catch (e) {
            console.error(`Failed to save setting ${key}`, e);
        }
    };

    const primaryColor = ColorPalette[preferences.primaryColorIndex] || ColorPalette[0];

    return (
        <SettingsContext.Provider
            value={{
                preferences,
                updatePreference,
                primaryColor,
                isLoading,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}

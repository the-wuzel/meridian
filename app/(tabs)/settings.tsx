import { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ColorPalette, Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CustomTimePicker } from '@/components/ui/CustomTimePicker';
import { router } from 'expo-router';
import { exportDatabase, importDatabase } from '@/services/database';
import { Alert } from 'react-native';
import { CustomSwitch } from '@/components/CustomSwitch';

export default function SettingsScreen() {
    const { preferences, updatePreference, primaryColor } = useSettings();
    const {
        showDailyQuote,
        showMorningRoutine,
        showEveningReflection,
        showDailyGratitude,
        primaryColorIndex,
        morningNotificationEnabled,
        morningNotificationHour,
        morningNotificationMinute,
        eveningNotificationEnabled,
        eveningNotificationHour,
        eveningNotificationMinute,
        isDarkMode,
        userName,
        showGreeting,
    } = preferences;

    const { 
        isAppLockEnabled, 
        isBiometricsEnabled, 
        hasBiometricHardware, 
        removePIN, 
        toggleBiometrics 
    } = useAuth();
    
    const colorScheme = useColorScheme() ?? 'light';

    const colors = useMemo(() => ({
        ...Colors[colorScheme],
        primaryButton: primaryColor,
    }), [colorScheme, primaryColor]);

    const styles = useMemo(() => createStyles(colorScheme, colors), [colorScheme, colors]);

    const trackColor = { 
        false: colorScheme === 'dark' ? '#767577' : '#e9e9ea', 
        true: primaryColor
    };
    const activeThumbColor = colorScheme === 'dark' ? '#3e3e3e' : '#ffffff';
    const iosBackgroundColor = colorScheme === 'dark' ? '#3e3e3e' : '#e9e9ea';

    const [showMorningPicker, setShowMorningPicker] = useState(false);
    const [showEveningPicker, setShowEveningPicker] = useState(false);

    const formatTime = (hour: number, minute: number) => {
        const d = new Date();
        d.setHours(hour, minute);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getMorningDate = () => {
        const d = new Date();
        d.setHours(morningNotificationHour, morningNotificationMinute, 0, 0);
        return d;
    };

    const getEveningDate = () => {
        const d = new Date();
        d.setHours(eveningNotificationHour, eveningNotificationMinute, 0, 0);
        return d;
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.headerContainer}>
                    <ThemedText type="title">Settings</ThemedText>
                </View>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <ThemedView style={styles.contentContainer}>
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Security</ThemedText>
                            <ThemedView style={styles.card}>
                                <TouchableOpacity
                                    style={styles.row}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        if (isAppLockEnabled) {
                                            removePIN();
                                        } else {
                                            router.push('/pin-setup');
                                        }
                                    }}
                                >
                                    <View>
                                        <ThemedText style={styles.label}>App Lock</ThemedText>
                                        <ThemedText style={styles.subtext}>Require PIN to open app</ThemedText>
                                    </View>
                                    <CustomSwitch
                                        trackColor={trackColor}
                                        thumbColor={activeThumbColor}
                                        ios_backgroundColor={iosBackgroundColor}
                                        onValueChange={(val) => {
                                            if (val) {
                                                router.push('/pin-setup');
                                            } else {
                                                removePIN();
                                            }
                                        }}
                                        value={isAppLockEnabled}
                                    />
                                </TouchableOpacity>

                                {isAppLockEnabled && hasBiometricHardware && (
                                    <>
                                        <View style={styles.divider} />
                                        <TouchableOpacity
                                            style={styles.row}
                                            activeOpacity={0.7}
                                            onPress={() => toggleBiometrics(!isBiometricsEnabled)}
                                        >
                                            <View>
                                                <ThemedText style={styles.label}>Use Face ID / Touch ID</ThemedText>
                                                <ThemedText style={styles.subtext}>Unlock with biometrics</ThemedText>
                                            </View>
                                            <CustomSwitch
                                                trackColor={trackColor}
                                                thumbColor={activeThumbColor}
                                                ios_backgroundColor={iosBackgroundColor}
                                                onValueChange={(val) => toggleBiometrics(val)}
                                                value={isBiometricsEnabled}
                                            />
                                        </TouchableOpacity>
                                    </>
                                )}
                            </ThemedView>
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Appearance</ThemedText>
                            <ThemedView style={styles.card}>
                                <ThemedText style={styles.label}>Accent Color</ThemedText>
                                <View style={styles.colorPaletteContainer}>
                                    {ColorPalette.map((color, index) => {
                                        const isSelected = primaryColorIndex === index;
                                        return (
                                            <TouchableOpacity
                                                key={color}
                                                onPress={() => updatePreference('primaryColorIndex', index)}
                                                style={styles.colorOptionContainer}
                                            >
                                                {isSelected && (
                                                    <View style={[
                                                        styles.colorOptionRing,
                                                        { borderColor: color },
                                                    ]} />
                                                )}
                                                <View style={[
                                                    styles.colorOptionInner,
                                                    { backgroundColor: color },
                                                ]} />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                                
                                <View style={styles.divider} />

                                <TouchableOpacity
                                    style={styles.row}
                                    activeOpacity={0.7}
                                    onPress={() => updatePreference('isDarkMode', !isDarkMode)}
                                >
                                    <View>
                                        <ThemedText style={styles.label}>Dark Mode</ThemedText>
                                        <ThemedText style={styles.subtext}>Switch between light and dark themes</ThemedText>
                                    </View>
                                    <CustomSwitch
                                        trackColor={trackColor}
                                        thumbColor={activeThumbColor}
                                        ios_backgroundColor={iosBackgroundColor}
                                        onValueChange={(val) => updatePreference('isDarkMode', val)}
                                        value={isDarkMode}
                                    />
                                </TouchableOpacity>
                            </ThemedView>
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Personalization</ThemedText>
                            <ThemedView style={styles.card}>
                                <TouchableOpacity
                                    style={styles.row}
                                    activeOpacity={0.7}
                                    onPress={() => updatePreference('showGreeting', !showGreeting)}
                                >
                                    <View>
                                        <ThemedText style={styles.label}>Show Greeting</ThemedText>
                                        <ThemedText style={styles.subtext}>Display a welcome message at the top</ThemedText>
                                    </View>
                                    <CustomSwitch
                                        trackColor={trackColor}
                                        thumbColor={activeThumbColor}
                                        ios_backgroundColor={iosBackgroundColor}
                                        onValueChange={(val) => updatePreference('showGreeting', val)}
                                        value={showGreeting}
                                    />
                                </TouchableOpacity>

                                <View style={styles.divider} />

                                <View style={[styles.row, { alignItems: 'flex-start', flexDirection: 'column', gap: 8 }]}>
                                    <View>
                                        <ThemedText style={styles.label}>Your Name</ThemedText>
                                        <ThemedText style={styles.subtext}>Used in the greeting (leave empty to hide)</ThemedText>
                                    </View>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            { color: colors.textPrimary, borderColor: colors.cardBorder, backgroundColor: colors.backgroundTertiary }
                                        ]}
                                        placeholder="Your name"
                                        placeholderTextColor={colors.textSecondary}
                                        value={userName}
                                        onChangeText={(text) => updatePreference('userName', text)}
                                        maxLength={50}
                                        returnKeyType="done"
                                    />
                                </View>
                            </ThemedView>
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Morning</ThemedText>
                            <ThemedView style={styles.card}>
                                <TouchableOpacity
                                    style={styles.row}
                                    activeOpacity={0.7}
                                    onPress={() => updatePreference('showDailyQuote', !showDailyQuote)}
                                >
                                    <ThemedText style={styles.label}>Daily Quote</ThemedText>
                                    <CustomSwitch
                                        trackColor={trackColor}
                                        thumbColor={activeThumbColor}
                                        ios_backgroundColor={iosBackgroundColor}
                                        onValueChange={(val) => updatePreference('showDailyQuote', val)}
                                        value={showDailyQuote}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.row}
                                    activeOpacity={0.7}
                                    onPress={() => updatePreference('showMorningRoutine', !showMorningRoutine)}
                                >
                                    <ThemedText style={styles.label}>Morning Routine</ThemedText>
                                    <CustomSwitch
                                        trackColor={trackColor}
                                        thumbColor={activeThumbColor}
                                        ios_backgroundColor={iosBackgroundColor}
                                        onValueChange={(val) => updatePreference('showMorningRoutine', val)}
                                        value={showMorningRoutine}
                                    />
                                </TouchableOpacity>
                            </ThemedView>
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Evening</ThemedText>
                            <ThemedView style={styles.card}>
                                <TouchableOpacity
                                    style={styles.row}
                                    activeOpacity={0.7}
                                    onPress={() => updatePreference('showEveningReflection', !showEveningReflection)}
                                >
                                    <ThemedText style={styles.label}>Evening Reflection</ThemedText>
                                    <CustomSwitch
                                        trackColor={trackColor}
                                        thumbColor={activeThumbColor}
                                        ios_backgroundColor={iosBackgroundColor}
                                        onValueChange={(val) => updatePreference('showEveningReflection', val)}
                                        value={showEveningReflection}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.row}
                                    activeOpacity={0.7}
                                    onPress={() => updatePreference('showDailyGratitude', !showDailyGratitude)}
                                >
                                    <ThemedText style={styles.label}>Daily Gratitude</ThemedText>
                                    <CustomSwitch
                                        trackColor={trackColor}
                                        thumbColor={activeThumbColor}
                                        ios_backgroundColor={iosBackgroundColor}
                                        onValueChange={(val) => updatePreference('showDailyGratitude', val)}
                                        value={showDailyGratitude}
                                    />
                                </TouchableOpacity>
                            </ThemedView>
                        </View>
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
                            <ThemedView style={styles.card}>
                                <TouchableOpacity
                                    style={styles.row}
                                    activeOpacity={0.7}
                                    onPress={() => updatePreference('morningNotificationEnabled', !morningNotificationEnabled)}
                                >
                                    <View>
                                        <ThemedText style={styles.label}>Morning Reminder</ThemedText>
                                        <ThemedText style={styles.subtext}>Start your day</ThemedText>
                                    </View>
                                    <CustomSwitch
                                        trackColor={trackColor}
                                        thumbColor={activeThumbColor}
                                        ios_backgroundColor={iosBackgroundColor}
                                        onValueChange={(val) => updatePreference('morningNotificationEnabled', val)}
                                        value={morningNotificationEnabled}
                                    />
                                </TouchableOpacity>

                                {morningNotificationEnabled && (
                                    <TouchableOpacity 
                                        style={styles.row}
                                        onPress={() => setShowMorningPicker(true)}
                                    >
                                        <ThemedText style={styles.label}>Time</ThemedText>
                                        <ThemedText style={styles.timeText}>{formatTime(morningNotificationHour, morningNotificationMinute)}</ThemedText>
                                    </TouchableOpacity>
                                )}

                                <View style={styles.divider} />

                                <TouchableOpacity
                                    style={styles.row}
                                    activeOpacity={0.7}
                                    onPress={() => updatePreference('eveningNotificationEnabled', !eveningNotificationEnabled)}
                                >
                                    <View>
                                        <ThemedText style={styles.label}>Evening Reminder</ThemedText>
                                        <ThemedText style={styles.subtext}>Reflect on your day</ThemedText>
                                    </View>
                                    <CustomSwitch
                                        trackColor={trackColor}
                                        thumbColor={activeThumbColor}
                                        ios_backgroundColor={iosBackgroundColor}
                                        onValueChange={(val) => updatePreference('eveningNotificationEnabled', val)}
                                        value={eveningNotificationEnabled}
                                    />
                                </TouchableOpacity>

                                {eveningNotificationEnabled && (
                                    <TouchableOpacity 
                                        style={styles.row}
                                        onPress={() => setShowEveningPicker(true)}
                                    >
                                        <ThemedText style={styles.label}>Time</ThemedText>
                                        <ThemedText style={styles.timeText}>{formatTime(eveningNotificationHour, eveningNotificationMinute)}</ThemedText>
                                    </TouchableOpacity>
                                )}

                            </ThemedView>
                        </View>
                        
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Data Management</ThemedText>
                            <ThemedView style={styles.card}>
                                <TouchableOpacity
                                    style={styles.row}
                                    activeOpacity={0.7}
                                    onPress={async () => {
                                        const success = await exportDatabase();
                                        if (!success) {
                                            Alert.alert("Error", "Could not export database. Sharing might not be available.");
                                        }
                                    }}
                                >
                                    <View>
                                        <ThemedText style={styles.label}>Export Backup</ThemedText>
                                        <ThemedText style={styles.subtext}>Save your reflections and settings</ThemedText>
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.divider} />

                                <TouchableOpacity
                                    style={styles.row}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        Alert.alert(
                                            "Import Backup",
                                            "This will overwrite all current data. Are you sure you want to proceed?",
                                            [
                                                { text: "Cancel", style: "cancel" },
                                                { 
                                                    text: "Import", 
                                                    style: "destructive",
                                                    onPress: async () => {
                                                        const success = await importDatabase();
                                                        if (success) {
                                                            Alert.alert("Success", "Database imported successfully. Please completely close and restart the app to see the changes.");
                                                        } else {
                                                            Alert.alert("Error", "Could not import database. Make sure you selected a valid backup file.");
                                                        }
                                                    } 
                                                }
                                            ]
                                        );
                                    }}
                                >
                                    <View>
                                        <ThemedText style={styles.label}>Import Backup</ThemedText>
                                        <ThemedText style={styles.subtext}>Restore your data from a backup file</ThemedText>
                                    </View>
                                </TouchableOpacity>
                            </ThemedView>
                        </View>
                    </ThemedView>
                </ScrollView>
                <CustomTimePicker
                    visible={showMorningPicker}
                    onClose={() => setShowMorningPicker(false)}
                    onSave={(date) => {
                        updatePreference('morningNotificationHour', date.getHours());
                        updatePreference('morningNotificationMinute', date.getMinutes());
                        setShowMorningPicker(false);
                    }}
                    initialDate={getMorningDate()}
                    title="Morning Reminder"
                />
                <CustomTimePicker
                    visible={showEveningPicker}
                    onClose={() => setShowEveningPicker(false)}
                    onSave={(date) => {
                        updatePreference('eveningNotificationHour', date.getHours());
                        updatePreference('eveningNotificationMinute', date.getMinutes());
                        setShowEveningPicker(false);
                    }}
                    initialDate={getEveningDate()}
                    title="Evening Reminder"
                />
            </SafeAreaView>
        </ThemedView>
    );
}


export const createStyles = (theme: 'light' | 'dark', colors: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        paddingTop: 32,
        paddingBottom: 16,
    },
    scrollContent: {
        paddingHorizontal: 32,
        paddingBottom: 32,
    },
    contentContainer: {
        gap: 32,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        marginBottom: 8,
        color: colors.textPrimary,
        opacity: 0.9,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.cardBorder,
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        color: colors.textPrimary,
        opacity: 0.9,
    },
    subtext: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    input: {
        width: '100%',
        height: 48,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Medium',
    },
    timeText: {
        fontSize: 16,
        color: colors.textPrimary,
        fontFamily: 'PlusJakartaSans-SemiBold',
    },
    divider: {
        height: 1,
        backgroundColor: colors.cardBorder,
        marginVertical: 4,
    },
    colorPaletteContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorOptionContainer: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorOptionRing: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
    },
    colorOptionInner: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
});


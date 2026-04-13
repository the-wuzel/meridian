import { useState, useMemo, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

export default function PinSetupScreen() {
    const { setupPIN, pinLength, changePinLength } = useAuth();
    const { primaryColor } = useSettings();
    const colorScheme = useColorScheme() ?? 'light';
    
    const [step, setStep] = useState<'create' | 'confirm'>('create');
    const [pin, setPin] = useState<string>('');
    const [confirmPin, setConfirmPin] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState('');

    const colors = useMemo(() => ({
        ...Colors[colorScheme],
        primaryButton: primaryColor,
    }), [colorScheme, primaryColor]);

    const styles = useMemo(() => createStyles(colorScheme, colors), [colorScheme, colors]);

    const currentPin = step === 'create' ? pin : confirmPin;
    const setCurrentPin = step === 'create' ? setPin : setConfirmPin;

    useEffect(() => {
        if (currentPin.length === pinLength) {
            if (step === 'create') {
                // Move to confirm step
                setStep('confirm');
            } else {
                // Verify confirm pin
                if (pin === confirmPin) {
                    handleSuccess();
                } else {
                    handleError();
                }
            }
        }
    }, [currentPin, step, pin, confirmPin]);

    const handleSuccess = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await setupPIN(pin);
        router.back();
    };

    const handleError = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setErrorMsg('PINs do not match. Try again.');
        setConfirmPin('');
        setStep('create');
        setPin('');
    };

    const handleNumberPress = (num: number) => {
        if (currentPin.length < pinLength) {
            if (step === 'create' || currentPin.length < pinLength - 1) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setErrorMsg('');
            setCurrentPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        if (currentPin.length > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setCurrentPin(prev => prev.slice(0, -1));
            setErrorMsg('');
        }
    };

    const renderDots = () => {
        const dots = [];
        for (let i = 0; i < pinLength; i++) {
            const isFilled = i < currentPin.length;
            dots.push(
                <View
                    key={i}
                    style={[
                        styles.dot,
                        isFilled && styles.dotFilled,
                    ]}
                />
            );
        }
        return <View style={styles.dotsContainer}>{dots}</View>;
    };

    const NumberPad = () => {
        const rows = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
        ];

        return (
            <View style={styles.numberPadContainer}>
                {rows.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.numberRow}>
                        {row.map(num => (
                            <TouchableOpacity
                                key={num}
                                style={styles.numberButton}
                                onPress={() => handleNumberPress(num)}
                                activeOpacity={0.7}
                            >
                                <ThemedText style={styles.numberText}>{num}</ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
                
                <View style={styles.numberRow}>
                    <View style={styles.numberButton} />
                    
                    <TouchableOpacity
                        style={styles.numberButton}
                        onPress={() => handleNumberPress(0)}
                        activeOpacity={0.7}
                    >
                        <ThemedText style={styles.numberText}>0</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.numberButton}
                        onPress={handleDelete}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="backspace-outline" size={28} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <View style={styles.headerRow}>
                 <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="close" size={28} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <MaterialCommunityIcons name="shield-lock-outline" size={48} color={colors.primaryButton} />
                    <ThemedText style={styles.title}>
                        {step === 'create' ? 'Create PIN' : 'Confirm PIN'}
                    </ThemedText>
                    <ThemedText style={styles.subtitle}>
                        {step === 'create' ? `Enter a ${pinLength}-digit PIN` : 'Re-enter your PIN to confirm'}
                    </ThemedText>
                </View>

                {step === 'create' && (
                    <View style={styles.lengthSelector}>
                        <TouchableOpacity
                            style={[
                                styles.lengthOption,
                                pinLength === 4 && { backgroundColor: `${colors.primaryButton}20`, borderColor: colors.primaryButton }
                            ]}
                            onPress={() => {
                                changePinLength(4);
                                setPin('');
                            }}
                        >
                            <ThemedText style={[styles.lengthText, pinLength === 4 && { color: colors.primaryButton, fontFamily: 'PlusJakartaSans-Bold' }]}>
                                4 Digits
                            </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.lengthOption,
                                pinLength === 6 && { backgroundColor: `${colors.primaryButton}20`, borderColor: colors.primaryButton }
                            ]}
                            onPress={() => {
                                changePinLength(6);
                                setPin('');
                            }}
                        >
                            <ThemedText style={[styles.lengthText, pinLength === 6 && { color: colors.primaryButton, fontFamily: 'PlusJakartaSans-Bold' }]}>
                                6 Digits
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                )}

                {renderDots()}
                <ThemedText style={styles.errorText}>{errorMsg || ' '}</ThemedText>

                <NumberPad />
            </View>
        </ThemedView>
    );
}

const createStyles = (theme: 'light' | 'dark', colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerRow: {
        paddingTop: 50,
        paddingHorizontal: 20,
        alignItems: 'flex-start',
    },
    backButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 24,
        fontFamily: 'PlusJakartaSans-Bold',
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    lengthSelector: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    lengthOption: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        backgroundColor: colors.backgroundSecondary,
    },
    lengthText: {
        fontSize: 14,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        marginBottom: 20,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.textSecondary,
    },
    dotFilled: {
        backgroundColor: colors.primaryButton,
        borderColor: colors.primaryButton,
    },
    errorText: {
        color: '#ff4444',
        minHeight: 24,
        marginBottom: 40,
        fontSize: 14,
    },
    numberPadContainer: {
        width: '100%',
        maxWidth: 300,
        gap: 16,
    },
    numberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    numberButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    numberText: {
        fontSize: 28,
        fontFamily: 'PlusJakartaSans-SemiBold',
    },
});

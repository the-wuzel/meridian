import { useMemo, useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Dimensions, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

export function LockScreen() {
    const { verifyPIN, isBiometricsEnabled, authenticateWithBiometrics, hasBiometricHardware, getLockoutState, pinLength, recoveryEndTime, startRecovery, cancelRecovery, removePIN } = useAuth();
    const { primaryColor } = useSettings();
    const colorScheme = useColorScheme() ?? 'light';
    const [pin, setPin] = useState<string>('');
    const [shake, setShake] = useState(false); // Can be used to animate later if desired
    const [errorMsg, setErrorMsg] = useState('');
    const [lockoutTimeLeft, setLockoutTimeLeft] = useState<number | null>(null);
    const [recoveryTimeLeft, setRecoveryTimeLeft] = useState<number | null>(null);
    const [isRecoveryModalVisible, setIsRecoveryModalVisible] = useState(false);

    const colors = useMemo(() => ({
        ...Colors[colorScheme],
        primaryButton: primaryColor,
    }), [colorScheme, primaryColor]);

    const styles = useMemo(() => createStyles(colorScheme, colors), [colorScheme, colors]);

    useEffect(() => {
        checkLockout();
    }, []);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (lockoutTimeLeft && lockoutTimeLeft > 0) {
            interval = setInterval(() => {
                setLockoutTimeLeft(prev => (prev ? prev - 1 : 0));
            }, 1000);
        } else if (lockoutTimeLeft === 0) {
            setLockoutTimeLeft(null);
            setErrorMsg('');
        }
        return () => clearInterval(interval);
    }, [lockoutTimeLeft]);

    useEffect(() => {
        // Trigger biometrics automatically if enabled and not locked out
        if (isBiometricsEnabled && hasBiometricHardware && !lockoutTimeLeft) {
            handleBiometricAuth();
        }
    }, [isBiometricsEnabled, hasBiometricHardware, lockoutTimeLeft]);

    useEffect(() => {
        if (pin.length === pinLength && !lockoutTimeLeft && !recoveryEndTime) {
            handleVerifyPin(pin);
        }
    }, [pin, lockoutTimeLeft, pinLength, recoveryEndTime]);

    useEffect(() => {
        if (recoveryEndTime) {
            const updateTimer = () => {
                const timeLeft = Math.ceil((recoveryEndTime - Date.now()) / 1000);
                if (timeLeft > 0) {
                    setRecoveryTimeLeft(timeLeft);
                } else {
                    setRecoveryTimeLeft(null);
                    // Timer finished while on this screen!
                    removePIN();
                }
            };
            updateTimer();
            const interval = setInterval(updateTimer, 1000);
            return () => clearInterval(interval);
        } else {
            setRecoveryTimeLeft(null);
        }
    }, [recoveryEndTime, removePIN]);

    const checkLockout = async () => {
        const lockoutTime = await getLockoutState();
        if (lockoutTime) {
            const timeLeft = Math.ceil((lockoutTime - Date.now()) / 1000);
            if (timeLeft > 0) {
                setLockoutTimeLeft(timeLeft);
                setErrorMsg('Too many failed attempts.');
            }
        }
    };

    const handleBiometricAuth = async () => {
        if (lockoutTimeLeft) return;
        setErrorMsg('');
        const success = await authenticateWithBiometrics();
        if (!success) {
             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const handleVerifyPin = async (currentPin: string) => {
        if (lockoutTimeLeft) return;
        
        const result = await verifyPIN(currentPin);
        if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            if (result.lockoutUntil) {
                const timeLeft = Math.ceil((result.lockoutUntil - Date.now()) / 1000);
                setLockoutTimeLeft(timeLeft > 0 ? timeLeft : 0);
                setErrorMsg('Too many failed attempts.');
            } else if (result.remainingAttempts !== undefined) {
                setErrorMsg(`Incorrect PIN. ${result.remainingAttempts} attempts left.`);
            } else {
                setErrorMsg('Incorrect PIN');
            }
            setPin('');
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }
    };

    const handleNumberPress = (num: number) => {
        if (lockoutTimeLeft) return;
        if (pin.length < pinLength) {
            if (pin.length < pinLength - 1) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setErrorMsg('');
            setPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        if (lockoutTimeLeft) return;
        if (pin.length > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setPin(prev => prev.slice(0, -1));
            setErrorMsg('');
        }
    };

    const renderDots = () => {
        const dots = [];
        for (let i = 0; i < pinLength; i++) {
            const isFilled = i < pin.length;
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

    const handleForgotPin = () => {
        setIsRecoveryModalVisible(true);
    };

    const handleConfirmRecovery = () => {
        setIsRecoveryModalVisible(false);
        startRecovery();
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
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
                    {isBiometricsEnabled && hasBiometricHardware ? (
                        <TouchableOpacity
                            style={styles.numberButton}
                            onPress={handleBiometricAuth}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons name="face-recognition" size={32} color={colors.textPrimary} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.numberButton} />
                    )}
                    
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

    if (recoveryTimeLeft !== null) {
        return (
            <ThemedView style={styles.container}>
                <View style={styles.content}>
                    <MaterialCommunityIcons name="timer-sand" size={64} color={colors.primaryButton} />
                    <ThemedText style={styles.title}>Recovery in Progress</ThemedText>
                    <ThemedText style={styles.subtitle}>
                        You can access the app in {formatTime(recoveryTimeLeft)}
                    </ThemedText>
                    <TouchableOpacity
                        style={styles.forgotPinButton}
                        onPress={cancelRecovery}
                    >
                        <ThemedText style={styles.forgotPinText}>Cancel Recovery</ThemedText>
                    </TouchableOpacity>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <MaterialCommunityIcons name="lock" size={48} color={colors.primaryButton} />
                    <ThemedText style={styles.title}>Welcome Back</ThemedText>
                    <ThemedText style={styles.subtitle}>Enter your PIN to unlock</ThemedText>
                </View>

                {renderDots()}
                <ThemedText style={styles.errorText}>
                    {lockoutTimeLeft ? `Try again in ${Math.ceil(lockoutTimeLeft)}s` : (errorMsg || ' ')}
                </ThemedText>

                <NumberPad />

                <TouchableOpacity style={styles.forgotPinButton} onPress={handleForgotPin}>
                    <ThemedText style={styles.forgotPinText}>Forgot PIN?</ThemedText>
                </TouchableOpacity>
            </View>

            <ConfirmationModal
                visible={isRecoveryModalVisible}
                onClose={() => setIsRecoveryModalVisible(false)}
                onConfirm={handleConfirmRecovery}
                title="Recover Password"
                message={"This will lock the app for 30 minutes. After that, your PIN and biometrics will be removed and you will regain full access.\n\nDo you want to continue?"}
                confirmText="Start Recovery"
            />
        </ThemedView>
    );
}

const createStyles = (theme: 'light' | 'dark', colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999, // Ensure it's on top of everything
        elevation: 9999,
        backgroundColor: colors.background, // Solid background so app is hidden
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
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
    forgotPinButton: {
        marginTop: 32,
        padding: 8,
    },
    forgotPinText: {
        color: colors.primaryButton,
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-SemiBold',
    },
});

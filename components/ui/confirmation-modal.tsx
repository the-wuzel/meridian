import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useMemo } from 'react';
import { Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface ConfirmationModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isAlert?: boolean;
}

export function ConfirmationModal({
    visible,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Delete",
    cancelText = "Cancel",
    isAlert = false
}: ConfirmationModalProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const backgroundColor = useThemeColor({}, 'background');

    // Generate dynamic styles based on the current theme
    const styles = useMemo(() => getStyles(colorScheme), [colorScheme]);

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.centeredView}>
                    <TouchableWithoutFeedback>
                        <ThemedView style={styles.modalView}>
                            <ThemedText type="subtitle" style={styles.modalTitle}>{title}</ThemedText>
                            <ThemedText style={styles.modalText}>{message}</ThemedText>
                            <View style={styles.buttonContainer}>
                                {!isAlert && (
                                    <TouchableOpacity
                                        style={[styles.button, styles.cancelButton]}
                                        onPress={onClose}
                                    >
                                        <ThemedText style={[styles.textStyle, styles.cancelText]}>{cancelText}</ThemedText>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[styles.button, isAlert ? styles.alertButton : styles.confirmButton]}
                                    onPress={onConfirm}
                                >
                                    <ThemedText style={styles.textStyle}>{confirmText}</ThemedText>
                                </TouchableOpacity>
                            </View>
                        </ThemedView>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        margin: 20,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '85%',
        maxWidth: 400,
    },
    modalTitle: {
        marginBottom: 8,
        textAlign: 'center',
    },
    modalText: {
        marginBottom: 24,
        textAlign: 'center',
        opacity: 0.8,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        borderRadius: 12,
        padding: 12,
        elevation: 1,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: Colors[colorScheme].backgroundSecondary,
        elevation: colorScheme === 'dark' ? 0 : 1, // Prevents shadow from bleeding through translucent background in dark mode
    },
    confirmButton: {
        backgroundColor: Colors[colorScheme].deleteIcon
    },
    alertButton: {
        backgroundColor: Colors[colorScheme].primaryButton
    },
    textStyle: {
        color: 'white',
        fontFamily: 'PlusJakartaSans-Bold',
        textAlign: 'center',
    },
    cancelText: {
        color: Colors[colorScheme].text,
    },
});

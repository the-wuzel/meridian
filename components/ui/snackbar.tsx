import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useEffect, useMemo } from 'react';
import { Dimensions, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    cancelAnimation,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createStyles } from './snackbar.styles';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface SnackbarProps {
    message: string;
    onUndo: () => void;
    onDismiss: () => void;
    visible: boolean;
    duration?: number;
}

import { useSettings } from '@/context/SettingsContext';

// ... existing imports ...

export function Snackbar({ message, onUndo, onDismiss, visible, duration = 4000 }: SnackbarProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const { primaryColor } = useSettings();
    const insets = useSafeAreaInsets();

    const colors = useMemo(() => ({
        ...Colors[colorScheme],
        primaryButton: primaryColor,
        // override other relevant colors if needed, e.g. successIcon if it should follow primary theme, 
        // but for now sticking to primaryButton which seems to be the main actionable color.
    }), [colorScheme, primaryColor]);

    const styles = useMemo(() => createStyles(colorScheme, colors, insets), [colorScheme, colors, insets]);

    const translateX = useSharedValue(0);
    const opacity = useSharedValue(0);
    const progress = useSharedValue(0);

    const onDismissRef = React.useRef(onDismiss);
    useEffect(() => {
        onDismissRef.current = onDismiss;
    }, [onDismiss]);

    useEffect(() => {
        if (visible) {
            translateX.value = 0;
            progress.value = 0;
            opacity.value = withTiming(1, { duration: 300 });
            progress.value = withTiming(1, { duration }, (finished) => {
                if (finished) {
                    runOnJS(onDismissRef.current)();
                }
            });
        } else {
            opacity.value = withTiming(0, { duration: 300 });
            cancelAnimation(progress);
            progress.value = 0;
        }
    }, [visible, duration]);

    const progressStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scaleX: progress.value }
            ],
            transformOrigin: 'left' as const,
        };
    });

    const pan = Gesture.Pan()
        .onChange((event) => {
            translateX.value = event.translationX;
        })
        .onEnd(() => {
            if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
                // Swiped away
                const direction = translateX.value > 0 ? 1 : -1;
                translateX.value = withTiming(direction * SCREEN_WIDTH, {}, () => {
                    runOnJS(onDismiss)();
                });
            } else {
                // Return to center
                translateX.value = withSpring(0);
            }
        });

    const rStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
            ],
            opacity: opacity.value,
        };
    });

    if (!visible && opacity.value === 0) return null;

    return (
        <GestureDetector gesture={pan}>
            <Animated.View style={[styles.container, rStyle]}>
                <ThemedView style={styles.content}>
                    <ThemedView style={styles.textContainer}>
                        <IconSymbol name="trash.fill" size={20} color={colors.deleteIcon} />
                        <ThemedText style={styles.message}>{message}</ThemedText>
                    </ThemedView>
                    <TouchableOpacity onPress={onUndo} style={styles.undoButton}>
                        <ThemedText style={styles.undoText}>Undo</ThemedText>
                    </TouchableOpacity>
                    <Animated.View style={[styles.progressBar, progressStyle]} />
                </ThemedView>
            </Animated.View>
        </GestureDetector>
    );
}

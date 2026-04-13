import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableWithoutFeedback } from 'react-native';

interface CustomSwitchProps {
    value: boolean;
    onValueChange: (val: boolean) => void;
    trackColor?: { false: string; true: string };
    thumbColor?: string;
    ios_backgroundColor?: string;
}

export function CustomSwitch({
    value,
    onValueChange,
    trackColor = { false: '#767577', true: '#81b0ff' },
    thumbColor = '#f4f3f4',
    ios_backgroundColor = '#3e3e3e',
}: CustomSwitchProps) {
    const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [value, animatedValue]);

    const falseColor = trackColor.false || ios_backgroundColor;
    const trueColor = trackColor.true;

    // We use the falseColor as background if it's off, and trueColor if it's on.
    const backgroundColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [falseColor, trueColor],
    });

    // width = 56, height = 32, thumb = 24.
    // Left padding = 4 -> translateX = 4
    // Right padding = 4 -> translateX = 56 - 24 - 4 = 28
    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [4, 28],
    });

    return (
        <TouchableWithoutFeedback onPress={() => onValueChange(!value)}>
            <Animated.View style={[styles.track, { backgroundColor }]}>
                <Animated.View
                    style={[
                        styles.thumb,
                        {
                            backgroundColor: thumbColor,
                            transform: [{ translateX }],
                        },
                    ]}
                />
            </Animated.View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    track: {
        width: 56,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
    },
    thumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
});

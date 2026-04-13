import React, { useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Animated, FlatList, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/context/SettingsContext';

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const REPEAT_COUNT = 400; // Large number for pseudo-infinite scroll

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

interface WheelPickerProps {
    items: string[];
    selectedValue: string;
    onValueChange: (value: string) => void;
    textColor: string;
    activeTextColor: string;
}

const WheelPicker: React.FC<WheelPickerProps> = ({ items, selectedValue, onValueChange, textColor, activeTextColor }) => {
    const flatListRef = React.useRef<FlatList>(null);
    const scrollY = React.useRef(new Animated.Value(0)).current;
    const colorScheme = useColorScheme() ?? 'light';
    
    // Create large array for infinite scroll
    const middleGroupStart = Math.floor(REPEAT_COUNT / 2) * items.length;
    const repeatedItems = Array(REPEAT_COUNT).fill(items).flat();
    const paddedItems = ['', '', ...repeatedItems, '', ''];
    const snapOffsets = React.useMemo(() => paddedItems.map((_, i) => i * ITEM_HEIGHT), [paddedItems]);
    
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(selectedValue);

    useEffect(() => {
        if (flatListRef.current) {
            const initialIndex = middleGroupStart + items.indexOf(selectedValue);
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({
                    offset: initialIndex * ITEM_HEIGHT,
                    animated: false,
                });
            }, 50);
        }
    }, []);

    useEffect(() => {
        setInputValue(selectedValue);
    }, [selectedValue]);

    const handleMomentumScrollEnd = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        let index = Math.round(offsetY / ITEM_HEIGHT);
        if (index < 0) index = 0;
        if (index > repeatedItems.length - 1) index = repeatedItems.length - 1;
        
        onValueChange(repeatedItems[index]);
    };

    const handleInputSubmit = () => {
        setIsEditing(false);
        let val = inputValue.trim();
        if (val.length === 1) val = '0' + val;

        let num = parseInt(val, 10);
        if (isNaN(num)) num = parseInt(selectedValue, 10);
        if (num < 0) num = 0;
        if (num > items.length - 1) num = items.length - 1;

        const finalVal = num.toString().padStart(2, '0');
        setInputValue(finalVal);
        onValueChange(finalVal);

        // Scroll to new value in the middle group
        const newIndex = middleGroupStart + items.indexOf(finalVal);
        flatListRef.current?.scrollToOffset({
            offset: newIndex * ITEM_HEIGHT,
            animated: true, // Smooth snap back to the newly selected value
        });
    };

    return (
        <View style={styles.wheelContainer}>
            {/* The border overlay (visual only) */}
            <View style={[styles.selectionBorder, { borderColor: activeTextColor }]} pointerEvents="none" />
            
            <Animated.FlatList
                ref={flatListRef}
                data={paddedItems}
                keyExtractor={(item, index) => `${index}-${item}`}
                showsVerticalScrollIndicator={false}
                snapToOffsets={snapOffsets}
                snapToAlignment="start"
                decelerationRate="fast"
                onMomentumScrollEnd={handleMomentumScrollEnd}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={1}
                getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                initialNumToRender={items.length + 4}
                maxToRenderPerBatch={20}
                windowSize={5}
                renderItem={({ item, index }) => {
                    if (item === '') {
                        return <View style={styles.wheelItem} />;
                    }
                    const itemIndex = index - 2; // adjust for padding
                    const inputRange = [
                        (itemIndex - 1.5) * ITEM_HEIGHT,
                        itemIndex * ITEM_HEIGHT,
                        (itemIndex + 1.5) * ITEM_HEIGHT,
                    ];
                    
                    const scale = scrollY.interpolate({
                        inputRange,
                        outputRange: [0.7, 1.1, 0.7],
                        extrapolate: 'clamp',
                    });

                    const opacity = scrollY.interpolate({
                        inputRange,
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View style={[styles.wheelItem, { transform: [{ scale }], opacity }]}>
                            <ThemedText style={[styles.wheelText, { color: textColor }]}>
                                {item}
                            </ThemedText>
                        </Animated.View>
                    );
                }}
            />

            {/* Replace static overlay with interactive input state */}
            {!isEditing ? (
                <TouchableOpacity 
                    style={styles.interactionOverlay} 
                    onPress={() => setIsEditing(true)}
                    activeOpacity={0.7}
                />
            ) : (
                <View style={[styles.inputOverlay, { 
                    backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f2f2f7' 
                }]}>
                    <TextInput
                        style={[styles.wheelText, styles.textInput, { color: activeTextColor, transform: [{ scale: 1.1 }] }]}
                        value={inputValue}
                        onChangeText={setInputValue}
                        keyboardType="number-pad"
                        maxLength={2}
                        autoFocus
                        onBlur={handleInputSubmit}
                        onSubmitEditing={handleInputSubmit}
                        selectTextOnFocus
                    />
                </View>
            )}
        </View>
    );
};

interface CustomTimePickerProps {
    visible: boolean;
    onClose: () => void;
    onSave: (date: Date) => void;
    initialDate: Date;
    title?: string;
}

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
    visible,
    onClose,
    onSave,
    initialDate,
    title = 'Select Time',
}) => {
    const colorScheme = useColorScheme() ?? 'light';
    const { primaryColor } = useSettings();
    const colors = Colors[colorScheme];

    const [selectedHour, setSelectedHour] = useState(initialDate.getHours().toString().padStart(2, '0'));
    const [selectedMinute, setSelectedMinute] = useState(initialDate.getMinutes().toString().padStart(2, '0'));

    useEffect(() => {
        if (visible) {
            setSelectedHour(initialDate.getHours().toString().padStart(2, '0'));
            setSelectedMinute(initialDate.getMinutes().toString().padStart(2, '0'));
        }
    }, [visible, initialDate]);

    const handleSave = () => {
        const newDate = new Date();
        newDate.setHours(parseInt(selectedHour, 10));
        newDate.setMinutes(parseInt(selectedMinute, 10));
        newDate.setSeconds(0);
        onSave(newDate);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={[styles.modalOverlay, { backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
                <ThemedView style={styles.modalContent}>
                    <View style={styles.header}>
                        <ThemedText style={styles.title}>{title}</ThemedText>
                    </View>

                    <View style={styles.pickerContainer}>
                        <WheelPicker
                            items={hours}
                            selectedValue={selectedHour}
                            onValueChange={setSelectedHour}
                            textColor={colors.textPrimary}
                            activeTextColor={primaryColor}
                        />
                        <View style={styles.colonContainer}>
                            <ThemedText style={[styles.colon, { color: primaryColor }]}>:</ThemedText>
                        </View>
                        <WheelPicker
                            items={minutes}
                            selectedValue={selectedMinute}
                            onValueChange={setSelectedMinute}
                            textColor={colors.textPrimary}
                            activeTextColor={primaryColor}
                        />
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity 
                            style={[styles.button, styles.cancelButton, { borderColor: colors.cardBorder }]} 
                            onPress={onClose} 
                            activeOpacity={0.7}
                        >
                            <ThemedText style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.button, { backgroundColor: primaryColor }]} 
                            onPress={handleSave} 
                            activeOpacity={0.7}
                        >
                            <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                        </TouchableOpacity>
                    </View>
                </ThemedView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    pickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: ITEM_HEIGHT * VISIBLE_ITEMS,
        width: '100%',
        marginBottom: 32,
    },
    wheelContainer: {
        width: 80,
        height: ITEM_HEIGHT * VISIBLE_ITEMS,
        alignItems: 'center',
        overflow: 'hidden',
    },
    selectionBorder: {
        position: 'absolute',
        top: ITEM_HEIGHT * 2,
        height: ITEM_HEIGHT,
        width: '100%',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        opacity: 0.2,
        zIndex: 1,
    },
    interactionOverlay: {
        position: 'absolute',
        top: ITEM_HEIGHT * 2,
        height: ITEM_HEIGHT,
        width: '100%',
        zIndex: 2,
    },
    inputOverlay: {
        position: 'absolute',
        top: ITEM_HEIGHT * 2,
        height: ITEM_HEIGHT,
        width: '80%',
        zIndex: 3,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    wheelItem: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wheelText: {
        fontSize: 24,
        fontFamily: 'PlusJakartaSans-SemiBold',
    },
    textInput: {
        width: '100%',
        textAlign: 'center',
        padding: 0,
        margin: 0,
    },
    colonContainer: {
        height: ITEM_HEIGHT * VISIBLE_ITEMS,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 4,
        marginHorizontal: 16,
    },
    colon: {
        fontSize: 28,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 12,
    },
    button: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-SemiBold',
    },
    saveButtonText: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: '#ffffff',
    },
});

import React from 'react';
import { View, Button, StyleSheet, Alert } from 'react-native';
import { runBackendTests } from '../services/backendTester';

/**
 * A testing component intended only for development use.
 * It renders a floating "Run Backend Tests" button that executes
 * all local SQLite database CRUD operation tests and prints results to the console.
 * 
 * If it gets included in a production build, it renders entirely null.
 */
export default function DevBackendTester() {
    // Completely strip from production render tree
    if (!__DEV__) {
        return null;
    }

    const handlePress = async () => {
        const result = await runBackendTests();
        if (result) {
            Alert.alert(
                "Test Results", 
                `Passed: ${result.passed}\nFailed: ${result.failed}\n\nCheck terminal for full logs.`
            );
        }
    };

    return (
        <View style={styles.container}>
            <Button 
                title="Run Backend Tests" 
                onPress={handlePress} 
                color="#8E24AA" 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 9999, // Ensure it sits above all other UI elements
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 4,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    }
});

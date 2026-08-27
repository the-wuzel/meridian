import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import React from 'react';
import { Alert, Button, StyleSheet, View } from 'react-native';
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

    const handleWipeData = () => {
        Alert.alert(
            "Wipe All Data",
            "Are you sure you want to completely wipe the local database and AsyncStorage? You must restart the app afterward.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Wipe Data",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await AsyncStorage.clear();
                            const dbFile = new File(Paths.document, 'SQLite', 'database.db');
                            if (dbFile.exists) {
                                dbFile.delete();
                            }
                            Alert.alert("Success", "Data wiped! Please fully restart the application (e.g. press 'R' in terminal).");
                        } catch (e) {
                            Alert.alert("Error", `Could not wipe data: ${e}`);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={{ marginBottom: 8 }}>
                <Button 
                    title="Run Backend Tests" 
                    onPress={handlePress} 
                    color="#8E24AA" 
                />
            </View>
            <Button 
                title="Wipe Data" 
                onPress={handleWipeData} 
                color="#D32F2F" 
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

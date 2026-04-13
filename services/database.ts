import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
    if (!dbPromise) {
        dbPromise = SQLite.openDatabaseAsync('mindApp.db');
    }
    return dbPromise;
};

export interface Reflection {
    id: number;
    prompt: string;
    answer: string;
    date: string;
}

export const initDatabase = async () => {
    const db = await getDb();
    await db.execAsync(`
    DROP TABLE IF EXISTS daily_prompts;
    DROP TABLE IF EXISTS daily_quotes;
    
    CREATE TABLE IF NOT EXISTS reflections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt TEXT NOT NULL,
      answer TEXT NOT NULL,
      date TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS gratitudes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      date TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS saved_quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      author TEXT NOT NULL,
      date TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS morning_routines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      checked INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value INTEGER DEFAULT 1
    );
  `);
};

export const getAllSettings = async (): Promise<Record<string, any>> => {
    const db = await getDb();
    const allRows = await db.getAllAsync<{ key: string, value: any }>('SELECT * FROM settings');

    // Default settings
    const settings: Record<string, any> = {
        setting_dailyQuote: true,
        setting_morningRoutine: true,
        setting_eveningReflection: true,
        setting_dailyGratitude: true,
        setting_primaryColorIndex: 0,
        setting_morningNotificationEnabled: true,
        setting_morningNotificationHour: 7,
        setting_morningNotificationMinute: 0,
        setting_eveningNotificationEnabled: true,
        setting_eveningNotificationHour: 18,
        setting_eveningNotificationMinute: 0,
        setting_isDarkMode: false,
        setting_userName: '',
    };

    allRows.forEach(row => {
        if (
            row.key === 'setting_primaryColorIndex' ||
            row.key === 'setting_morningNotificationHour' ||
            row.key === 'setting_morningNotificationMinute' ||
            row.key === 'setting_eveningNotificationHour' ||
            row.key === 'setting_eveningNotificationMinute'
        ) {
            settings[row.key] = row.value;
        } else if (row.key === 'setting_userName') {
            settings[row.key] = typeof row.value === 'string' ? row.value : String(row.value);
        } else {
            settings[row.key] = !!row.value;
        }
    });

    return settings;
};

export const saveSetting = async (key: string, value: boolean | number | string) => {
    const db = await getDb();
    let dbValue: any = value;
    if (typeof value === 'boolean') {
        dbValue = value ? 1 : 0;
    }
    await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, dbValue]
    );
};

export const getTodayReflection = async (): Promise<Reflection | null> => {
    const db = await getDb();
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();

    const result = await db.getFirstAsync<Reflection>(
        'SELECT * FROM reflections WHERE date >= ? AND date <= ? ORDER BY date DESC LIMIT 1',
        [startOfDay, endOfDay]
    );
    return result;
}

export const getTodayGratitudes = async (): Promise<{ id: number, content: string }[]> => {
    const db = await getDb();
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();

    const result = await db.getAllAsync<{ id: number, content: string }>(
        'SELECT id, content FROM gratitudes WHERE date >= ? AND date <= ? ORDER BY id ASC',
        [startOfDay, endOfDay]
    );
    return result;
}

export const saveGratitude = async (content: string) => {
    const db = await getDb();
    const date = new Date().toISOString();
    await db.runAsync(
        'INSERT INTO gratitudes (content, date) VALUES (?, ?)',
        [content, date]
    );
};

export const updateGratitude = async (id: number, content: string) => {
    const db = await getDb();
    await db.runAsync(
        'UPDATE gratitudes SET content = ? WHERE id = ?',
        [content, id]
    );
};

export const deleteGratitude = async (id: number) => {
    const db = await getDb();
    await db.runAsync(
        'DELETE FROM gratitudes WHERE id = ?',
        [id]
    );
};

export const getDailyPrompt = async (candidates: string[]): Promise<string> => {
    const now = new Date();
    // Use YYYY-MM-DD format for the primary key to ensure one per calendar day
    const dateKey = now.toISOString().split('T')[0];
    const STORAGE_KEY = 'current_daily_prompt';

    try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedValue) {
            const parsed = JSON.parse(storedValue);
            if (parsed.date === dateKey && parsed.prompt) {
                return parsed.prompt;
            }
        }
    } catch (error) {
        console.error("Error reading daily prompt from AsyncStorage:", error);
    }

    // Generate new prompt
    const newPrompt = candidates[Math.floor(Math.random() * candidates.length)];

    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
            date: dateKey,
            prompt: newPrompt
        }));
    } catch (error) {
        console.error("Error saving daily prompt to AsyncStorage:", error);
    }

    return newPrompt;
};


// Test, remove on production

export const forceNewDailyPrompt = async (candidates: string[]): Promise<string> => {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    const STORAGE_KEY = 'current_daily_prompt';
    
    const newPrompt = candidates[Math.floor(Math.random() * candidates.length)];

    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
            date: dateKey,
            prompt: newPrompt
        }));
    } catch (error) {
        console.error("Error saving daily prompt to AsyncStorage:", error);
    }

    return newPrompt;
};

import quotesData from './quotes.json';

// ... (existing code)

export const saveQuote = async (text: string, author: string) => {
    const db = await getDb();
    const date = new Date().toISOString();
    await db.runAsync(
        'INSERT INTO saved_quotes (text, author, date) VALUES (?, ?, ?)',
        [text, author, date]
    );
};

export const isQuoteSaved = async (text: string, author: string): Promise<boolean> => {
    const db = await getDb();
    const result = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM saved_quotes WHERE text = ? AND author = ?',
        [text, author]
    );
    return !!result;
};

export const removeSavedQuote = async (text: string, author: string) => {
    const db = await getDb();
    await db.runAsync(
        'DELETE FROM saved_quotes WHERE text = ? AND author = ?',
        [text, author]
    );
};

export const getDailyQuote = async (): Promise<{ text: string, author: string }> => {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    const STORAGE_KEY = 'current_daily_quote';

    try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedValue) {
            const parsed = JSON.parse(storedValue);
            if (parsed.date === dateKey && parsed.text && parsed.author) {
                return { text: parsed.text, author: parsed.author };
            }
        }
    } catch (error) {
        console.error("Error reading daily quote from AsyncStorage:", error);
    }

    const randomQuote = quotesData[Math.floor(Math.random() * quotesData.length)];

    const newQuote = {
        text: randomQuote.quoteText,
        author: randomQuote.quoteAuthor
    };

    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
            date: dateKey,
            text: newQuote.text,
            author: newQuote.author
        }));
    } catch (error) {
        console.error("Error saving daily quote to AsyncStorage:", error);
    }

    return newQuote;
};

export const saveReflection = async (prompt: string, answer: string) => {
    const db = await getDb();
    const existing = await getTodayReflection();
    const date = new Date().toISOString();

    if (existing) {
        await db.runAsync(
            'UPDATE reflections SET answer = ?, date = ? WHERE id = ?',
            [answer, date, existing.id]
        );
    } else {
        await db.runAsync(
            'INSERT INTO reflections (prompt, answer, date) VALUES (?, ?, ?)',
            [prompt, answer, date]
        );
    }
};

export const getReflections = async (): Promise<Reflection[]> => {
    const db = await getDb();
    const allRows = await db.getAllAsync('SELECT * FROM reflections ORDER BY date DESC');
    return allRows as Reflection[];
}

export const getPastReflectionsByPrompt = async (prompt: string): Promise<Reflection[]> => {
    const db = await getDb();
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    
    const result = await db.getAllAsync<Reflection>(
        'SELECT * FROM reflections WHERE prompt = ? AND date < ? ORDER BY date DESC',
        [prompt, startOfDay]
    );
    return result;
}

export const deleteReflection = async (id: number) => {
    const db = await getDb();
    await db.runAsync(
        'DELETE FROM reflections WHERE id = ?',
        [id]
    );
};

export const updateReflection = async (id: number, answer: string) => {
    const db = await getDb();
    await db.runAsync(
        'UPDATE reflections SET answer = ? WHERE id = ?',
        [answer, id]
    );
};

export const getGratitudes = async (): Promise<{ id: number, content: string, date: string }[]> => {
    const db = await getDb();
    const allRows = await db.getAllAsync('SELECT * FROM gratitudes ORDER BY date DESC');
    return allRows as { id: number, content: string, date: string }[];
}

export const getSavedQuotes = async (): Promise<{ id: number, text: string, author: string, date: string }[]> => {
    const db = await getDb();
    const allRows = await db.getAllAsync('SELECT * FROM saved_quotes ORDER BY date DESC');
    return allRows as { id: number, text: string, author: string, date: string }[];
}

export const getMorningRoutineItems = async (): Promise<{ id: number, label: string, checked: boolean }[]> => {
    const db = await getDb();
    const allRows = await db.getAllAsync<{ id: number, label: string, checked: number }>('SELECT * FROM morning_routines ORDER BY id ASC');
    return allRows.map(row => ({
        ...row,
        checked: !!row.checked
    }));
};

export const syncMorningRoutineItems = async (items: { label: string, checked: boolean }[]) => {
    const db = await getDb();
    // Use a transaction to ensure atomicity
    await db.withTransactionAsync(async () => {
        // Clear existing items
        await db.runAsync('DELETE FROM morning_routines');

        // Insert new items
        for (const item of items) {
            await db.runAsync(
                'INSERT INTO morning_routines (label, checked) VALUES (?, ?)',
                [item.label, item.checked ? 1 : 0]
            );
        }
    });
};

export const updateMorningRoutineItemStatus = async (id: number, checked: boolean) => {
    const db = await getDb();
    await db.runAsync(
        'UPDATE morning_routines SET checked = ? WHERE id = ?',
        [checked ? 1 : 0, id]
    );
};

import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const exportDatabase = async () => {
    try {
        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) {
            console.error("Sharing is not available on this device");
            return false;
        }

        const db = await getDb();
        // In Expo SDK 50+, db object contains databasePath
        let dbFilePath = (db as any).databasePath;
        let dbFile: File;
        
        if (dbFilePath) {
            const dbUri = dbFilePath.startsWith('file://') ? dbFilePath : `file://${dbFilePath}`;
            dbFile = new File(dbUri);
        } else {
            // Fallback
            dbFile = new File(Paths.document, 'SQLite', 'mindApp.db');
        }

        if (!dbFile.exists) {
            console.error("Database file does not exist at:", dbFile.uri);
            return false;
        }

        // Copy it to a temporary location to ensure it has a good name and is accessible
        const backupFileName = `mindApp_backup_${new Date().toISOString().split('T')[0]}.db`;
        const backupFile = new File(Paths.cache, backupFileName);
        
        // If there's an old backup, overwrite by copying? 
        // File.copy doesn't take 'overwrite', but File.delete() does if it exists.
        if (backupFile.exists) {
            backupFile.delete();
        }
        
        dbFile.copy(backupFile);

        const shareUri = backupFile.uri.startsWith('file://') ? backupFile.uri : `file://${backupFile.uri}`;

        await Sharing.shareAsync(shareUri, {
            mimeType: 'application/octet-stream', // Safer generic mime type for database files
            dialogTitle: 'Export Database Backup'
        });

        return true;
    } catch (error) {
        console.error("Error exporting database:", error);
        return false;
    }
};

export const importDatabase = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            copyToCacheDirectory: true,
            type: ['application/octet-stream', 'application/x-sqlite3', 'application/vnd.sqlite3', '*/*']
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
            return false;
        }

        const pickedFileUri = result.assets[0].uri;
        const sourceFile = new File(pickedFileUri.startsWith('file://') ? pickedFileUri : `file://${pickedFileUri}`);

        if (!sourceFile.exists) {
            console.error("Selected file does not exist at:", sourceFile.uri);
            return false;
        }

        const db = await getDb();
        
        // In Expo SDK 50+, db object contains databasePath
        let dbFilePath = (db as any).databasePath;
        let dbFile: File;
        
        if (dbFilePath) {
            const dbUri = dbFilePath.startsWith('file://') ? dbFilePath : `file://${dbFilePath}`;
            dbFile = new File(dbUri);
        } else {
            // Fallback
            dbFile = new File(Paths.document, 'SQLite', 'mindApp.db');
        }

        // Close the database to release the file lock
        try {
            if (typeof db.closeAsync === 'function') {
                await db.closeAsync();
            } else if (typeof (db as any).closeSync === 'function') {
                (db as any).closeSync();
            }
        } catch (e) {
            console.log("Could not close db:", e);
        }
        dbPromise = null;

        // Overwrite the existing database file
        if (dbFile.exists) {
            dbFile.delete();
        }
        
        sourceFile.copy(dbFile);

        // Re-initialize the database connection to use the imported file
        await getDb();

        return true;
    } catch (error) {
        console.error("Error importing database:", error);
        return false;
    }
};

// Test Data, delete for production
export const seedTestData = async () => {
    const db = await getDb();
    
    // Check if we already have seeded data
    const existing = await db.getAllAsync('SELECT * FROM reflections WHERE answer LIKE "[TEST]%"');
    if (existing.length > 0) return;

    const now = new Date();
    const reflectionsData = require('./reflection.json');
    const reflections = reflectionsData.slice(0, 10).map((r: any) => r.prompt);

    for (const prompt of reflections) {
        // Add 2 past memories for each of these prompts
        const d1 = new Date(now);
        d1.setDate(d1.getDate() - 30);
        
        const d2 = new Date(now);
        d2.setDate(d2.getDate() - 15);

        await db.runAsync(
            'INSERT INTO reflections (prompt, answer, date) VALUES (?, ?, ?)',
            [prompt, "[TEST] First memory about this from a month ago.", d1.toISOString()]
        );
        
        await db.runAsync(
            'INSERT INTO reflections (prompt, answer, date) VALUES (?, ?, ?)',
            [prompt, "[TEST] Second memory about this from two weeks ago.", d2.toISOString()]
        );
    }
};


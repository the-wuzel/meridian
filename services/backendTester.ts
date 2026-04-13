import * as db from './database';

/**
 * Runs a suite of tests on the database operations.
 * This function returns early if not in development mode, ensuring no test data is written in production.
 */
export const runBackendTests = async (): Promise<{ passed: number, failed: number } | null> => {
    // Ensure this doesn't run in production
    if (!__DEV__) {
        console.warn('Backend tests are restricted to development mode.');
        return null;
    }

    console.log('=================================');
    console.log('🧪 RUNNING BACKEND DATABASE TESTS');
    console.log('=================================');

    let passed = 0;
    let failed = 0;

    const assert = (condition: boolean, message: string) => {
        if (condition) {
            console.log(`✅ [PASS] ${message}`);
            passed++;
        } else {
            console.error(`❌ [FAIL] ${message}`);
            failed++;
        }
    };

    try {
        // --- 1. SETTINGS TESTS ---
        console.log('\n--- Testing Settings ---');
        const testSettingKey = 'test_backend_setting';
        await db.saveSetting(testSettingKey, true);
        let settings = await db.getAllSettings();
        assert(settings[testSettingKey] === true, 'Can save and retrieve a setting');
        // Clean up test setting is not natively supported without adding a query, so we'll just set it to false
        await db.saveSetting(testSettingKey, false);

        // --- 2. GRATITUDES TESTS ---
        console.log('\n--- Testing Gratitudes ---');
        const testGratitudeContent = 'TEST_GRATITUDE_123';
        await db.saveGratitude(testGratitudeContent);
        let gratitudes = await db.getTodayGratitudes();
        let testGratitude = gratitudes.find(g => g.content === testGratitudeContent);
        
        assert(!!testGratitude, 'Can save and retrieve a new gratitude');

        if (testGratitude) {
            const updatedContent = 'TEST_GRATITUDE_UPDATED';
            await db.updateGratitude(testGratitude.id, updatedContent);
            gratitudes = await db.getTodayGratitudes();
            assert(gratitudes.some(g => g.content === updatedContent), 'Can update an existing gratitude');

            await db.deleteGratitude(testGratitude.id);
            gratitudes = await db.getTodayGratitudes();
            assert(!gratitudes.some(g => g.content === updatedContent), 'Can delete a gratitude');
        } else {
            assert(false, 'Skipping gratitude update/delete tests due to save failure');
        }

        // --- 3. QUOTES TESTS ---
        console.log('\n--- Testing Saved Quotes ---');
        const testQuoteText = 'This is a test quote.';
        const testQuoteAuthor = 'Test Author';
        
        await db.saveQuote(testQuoteText, testQuoteAuthor);
        let isSaved = await db.isQuoteSaved(testQuoteText, testQuoteAuthor);
        assert(isSaved, 'Can save and verify a quote');

        let savedQuotes = await db.getSavedQuotes();
        assert(savedQuotes.some(q => q.text === testQuoteText), 'Can retrieve all saved quotes');

        await db.removeSavedQuote(testQuoteText, testQuoteAuthor);
        isSaved = await db.isQuoteSaved(testQuoteText, testQuoteAuthor);
        assert(!isSaved, 'Can remove a saved quote');

        // --- 4. MORNING ROUTINES TESTS ---
        console.log('\n--- Testing Morning Routines ---');
        // Backup current routines
        const existingRoutines = await db.getMorningRoutineItems();
        
        const testRoutines = [
            { label: 'TEST_ROUTINE_A', checked: false },
            { label: 'TEST_ROUTINE_B', checked: true }
        ];
        
        await db.syncMorningRoutineItems(testRoutines);
        let currentRoutines = await db.getMorningRoutineItems();
        
        assert(
            currentRoutines.length === 2 && 
            currentRoutines.some(r => r.label === 'TEST_ROUTINE_A' && !r.checked) &&
            currentRoutines.some(r => r.label === 'TEST_ROUTINE_B' && r.checked),
            'Can sync new morning routines'
        );

        const routineB = currentRoutines.find(r => r.label === 'TEST_ROUTINE_A');
        if (routineB) {
            await db.updateMorningRoutineItemStatus(routineB.id, true);
            currentRoutines = await db.getMorningRoutineItems();
            const updatedRoutineB = currentRoutines.find(r => r.label === 'TEST_ROUTINE_A');
            assert(updatedRoutineB?.checked === true, 'Can update morning routine status');
        } else {
            assert(false, 'Skipping routine update test due to sync failure');
        }

        // Restore original routines
        await db.syncMorningRoutineItems(existingRoutines);

        // --- 5. REFLECTIONS TESTS ---
        console.log('\n--- Testing Reflections ---');
        // Check if there's already a reflection today so we can restore it later
        const existingTodayReflection = await db.getTodayReflection();

        const testPrompt = 'TEST_PROMPT';
        const testAnswer = 'TEST_ANSWER';
        
        await db.saveReflection(testPrompt, testAnswer);
        const todayReflection = await db.getTodayReflection();
        
        assert(
            todayReflection?.answer === testAnswer, 
            'Can save and retrieve today\'s reflection'
        );

        const updatedAnswer = 'TEST_ANSWER_UPDATED';
        await db.saveReflection(testPrompt, updatedAnswer);
        const updatedTodayReflection = await db.getTodayReflection();
        
        assert(
            updatedTodayReflection?.answer === updatedAnswer,
            'Can update today\'s reflection answer'
        );

        if (updatedTodayReflection) {
            await db.deleteReflection(updatedTodayReflection.id);
            const deletedReflectionCheck = await db.getTodayReflection();
            assert(
                !deletedReflectionCheck || deletedReflectionCheck.id !== updatedTodayReflection.id, 
                'Can delete a reflection'
            );
        } else {
            assert(false, 'Skipping reflection delete test due to save/update failure');
        }

        // Restore earlier reflection if we had one
        if (existingTodayReflection) {
            await db.saveReflection(existingTodayReflection.prompt, existingTodayReflection.answer);
        }

    } catch (error) {
        console.error('\n❌ Unhandled exception during tests:', error);
        assert(false, 'Tests completed without throwing exceptions');
    }

    console.log('\n=================================');
    console.log(`📊 TEST RESULTS: ${passed} Passed | ${failed} Failed`);
    console.log('=================================');
    
    return { passed, failed };
};

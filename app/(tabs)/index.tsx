import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, LayoutAnimation, Platform, ScrollView, TextInput, TouchableOpacity, UIManager, View, findNodeHandle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/context/SettingsContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import ReorderableList, { reorderItems, useReorderableDrag } from 'react-native-reorderable-list';
import { createStyles } from './_index.styles';

import { Reflection, deleteGratitude, forceNewDailyPrompt, getDailyPrompt, getDailyQuote, getMorningRoutineItems, getPastReflectionsByPrompt, getTodayGratitudes, getTodayReflection, isQuoteSaved, removeSavedQuote, saveGratitude, saveQuote, saveReflection, syncMorningRoutineItems, updateGratitude, updateMorningRoutineItemStatus } from '@/services/database';
import reflectionsData from '@/services/reflection.json';



function useThemeStyles() {
  const colorScheme = useColorScheme() ?? 'light';
  const { primaryColor } = useSettings();
  const colors = useMemo(() => ({
    ...Colors[colorScheme],
    primaryButton: primaryColor,
    tint: primaryColor,
    tabIconSelected: primaryColor,
  }), [colorScheme, primaryColor]);

  const styles = useMemo(() => createStyles(colorScheme, colors), [colorScheme, colors]);
  return { styles, colors, colorScheme };
}

function QuoteOfTheDay() {
  const [quote, setQuote] = useState({ text: "", author: "" });
  const [isSaved, setIsSaved] = useState(false);
  const { styles, colors } = useThemeStyles();

  useFocusEffect(
    useCallback(() => {
      async function loadQuote() {
        const newQuote = await getDailyQuote();
        setQuote(newQuote);
        if (newQuote.text) {
          const saved = await isQuoteSaved(newQuote.text, newQuote.author);
          setIsSaved(saved);
        }
      }
      loadQuote();
    }, [])
  );

  const { showSnackbar } = useSnackbar();

  const handleSaveQuote = async () => {
    if (isSaved) {
      await removeSavedQuote(quote.text, quote.author);
      setIsSaved(false);
    } else {
      await saveQuote(quote.text, quote.author);
      setIsSaved(true);
    }
  };

  return (
    <ThemedView style={styles.quoteContainer}>
      <ThemedText type="subtitle" style={styles.quoteTitle}>Quote of the Day</ThemedText>
      <ThemedText style={styles.quoteText}>"{quote.text}"</ThemedText>
      <ThemedText style={styles.quoteAuthor}>- {quote.author}</ThemedText>
      <TouchableOpacity style={styles.saveQuoteButton} onPress={handleSaveQuote}>
        <IconSymbol
          name={isSaved ? "bookmark.fill" : "bookmark"}
          size={24}
          color={isSaved ? colors.savedIcon : colors.iconSecondary}
        />
      </TouchableOpacity>
    </ThemedView>
  );
}

interface RoutineItem {
  id: number;
  label: string;
  checked: boolean;
}

function RoutineEditItem({ item, updateEditItem, removeEditItem, colors }: {
  item: RoutineItem;
  updateEditItem: (id: number, text: string) => void;
  removeEditItem: (id: number) => void;
  colors: any;
}) {
  const drag = useReorderableDrag();
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    }}>
      <TouchableOpacity onPressIn={drag} style={{ paddingRight: 10 }}>
        <IconSymbol name="line.3.horizontal" size={24} color={colors.iconTertiary} />
      </TouchableOpacity>
      <TextInput
        style={{
          flex: 1,
          borderBottomWidth: 1,
          borderBottomColor: colors.cardBorder,
          paddingVertical: 8,
          color: colors.text,
          fontSize: 16,
          marginRight: 10
        }}
        value={item.label}
        onChangeText={(text) => updateEditItem(item.id, text)}
        placeholder="Routine item..."
        placeholderTextColor={colors.textTertiary}
      />
      <TouchableOpacity onPress={() => removeEditItem(item.id)}>
        <IconSymbol name="trash.fill" size={20} color={colors.deleteIcon} />
      </TouchableOpacity>
    </View>
  );
}

function MorningRoutine() {
  const [routineItems, setRoutineItems] = useState<RoutineItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<RoutineItem[]>([]);
  const { styles, colors } = useThemeStyles();

  const loadRoutine = useCallback(async () => {
    const items = await getMorningRoutineItems();
    if (items.length === 0) {
      // Default items if empty
      const defaultItems = [
        { id: 1, label: "Make bed", checked: false },
        { id: 2, label: "Drink water", checked: false },
        { id: 3, label: "Stretch", checked: false },
        { id: 4, label: "Read 10 mins", checked: false },
      ];
      // Save defaults immediately so they persist
      await syncMorningRoutineItems(defaultItems);
      setRoutineItems(defaultItems);
    } else {
      setRoutineItems(items);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isEditing) {
        loadRoutine();
      }
    }, [loadRoutine, isEditing])
  );

  const toggleItem = async (id: number) => {
    if (isEditing) return;

    const item = routineItems.find(i => i.id === id);
    if (item) {
      const newChecked = !item.checked;

      // Optimistic update
      setRoutineItems(items =>
        items.map(i => i.id === id ? { ...i, checked: newChecked } : i)
      );

      // Persist
      await updateMorningRoutineItemStatus(id, newChecked);
    }
  };

  const startEditing = () => {
    setEditItems(JSON.parse(JSON.stringify(routineItems)));
    setIsEditing(true);
  };

  const saveEditing = async () => {
    // Filter out empty items
    const validItems = editItems.filter(i => i.label.trim().length > 0);

    // Optimistic update
    setRoutineItems(validItems);
    setIsEditing(false);

    // Persist
    await syncMorningRoutineItems(validItems);
    await loadRoutine(); // Reload to get stable IDs from DB
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditItems([]);
  };

  const updateEditItem = (id: number, text: string) => {
    setEditItems(items => items.map(i => i.id === id ? { ...i, label: text } : i));
  };

  const addEditItem = () => {
    // Generate a temporary ID that won't collide with existing ones
    // We'll trust the DB sync to assign real IDs later
    const tempId = Date.now();
    setEditItems(items => [...items, { id: tempId, label: "", checked: false }]);
  };

  const removeEditItem = (id: number) => {
    setEditItems(items => items.filter(i => i.id !== id));
  };

  const renderItem = useCallback(({ item }: { item: RoutineItem }) => (
    <RoutineEditItem
      item={item}
      updateEditItem={updateEditItem}
      removeEditItem={removeEditItem}
      colors={colors}
    />
  ), [colors, updateEditItem, removeEditItem]);

  return (
    <ThemedView style={styles.routineContainer}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <ThemedText type="subtitle" style={{ marginBottom: 0 }}>Morning Routine</ThemedText>
        {isEditing ? (
          <TouchableOpacity onPress={saveEditing}>
            <IconSymbol name="checkmark" size={24} color={colors.primaryButton} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={startEditing}>
            <IconSymbol name="pencil" size={20} color={colors.iconSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {isEditing ? (
        <View>
          <ReorderableList
            data={editItems}
            onReorder={({ from, to }) => {
              setEditItems(reorderItems(editItems, from, to));
            }}
            keyExtractor={(item: RoutineItem) => item.id.toString()}
            renderItem={renderItem}
            scrollEnabled={false}
            ListFooterComponent={
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  marginTop: 4,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  borderRadius: 8,
                  borderStyle: 'dashed'
                }}
                onPress={addEditItem}
              >
                <IconSymbol name="plus" size={16} color={colors.iconSecondary} />
                <ThemedText style={{ marginLeft: 8, color: colors.textSecondary }}>Add Item</ThemedText>
              </TouchableOpacity>
            }
          />
        </View>
      ) : (
        <View>
          {routineItems.map(item => (
            <TouchableOpacity key={item.id} style={styles.routineItem} onPress={() => toggleItem(item.id)}>
              <IconSymbol
                name={item.checked ? "checkmark.circle.fill" : "circle"}
                size={24}
                color={item.checked ? colors.primaryButton : colors.iconTertiary}
              />
              <ThemedText style={[styles.routineText, item.checked && styles.routineTextDone]}>{item.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ThemedView>
  );
}

const REFLECTIONS = reflectionsData.map((item: { prompt: string }) => item.prompt);

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface GratitudePromptProps {
  onFocus?: () => void;
  onAdd?: () => void;
  onEditFocus?: (nodeHandle: number) => void;
}

function GratitudePrompt({ onFocus, onAdd, onEditFocus }: GratitudePromptProps) {
  const [gratitudes, setGratitudes] = useState<{ id: number, content: string }[]>([]);
  const [newGratitude, setNewGratitude] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const { showSnackbar, hideSnackbar } = useSnackbar();
  const { styles, colors } = useThemeStyles();
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean, title: string, message: string } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const itemRefs = useRef<{ [key: number]: View | null }>({});

  const loadGratitudes = useCallback(async () => {
    const data = await getTodayGratitudes();
    setGratitudes(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGratitudes();
    }, [loadGratitudes])
  );

  const handleSave = async () => {
    if (!newGratitude.trim()) {
      setAlertConfig({ visible: true, title: 'Empty', message: 'Please write something before saving.' });
      return;
    }

    await saveGratitude(newGratitude);
    setNewGratitude('');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await loadGratitudes();
    // Scroll to bottom after adding
    if (onAdd) {
      setTimeout(onAdd, 100);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editContent.trim()) {
      setAlertConfig({ visible: true, title: 'Empty', message: 'Cannot save empty gratitude.' });
      return;
    }
    await updateGratitude(id, editContent);
    setEditingId(null);
    setEditContent('');
    await loadGratitudes();
  };

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const confirmDelete = async (id: number) => {
    // Delete from DB
    await deleteGratitude(id);

    // Update local state without re-fetching
    // We don't need to animate here because it's already hidden via pendingDeleteId
    // But we need to remove it from the list so when we clear pendingDeleteId it doesn't reappear
    setGratitudes(current => current.filter(item => item.id !== id));
    setPendingDeleteId(null);
  };

  const handleDelete = (id: number) => {
    if (pendingDeleteId && pendingDeleteId !== id) {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      confirmDelete(pendingDeleteId);
    }

    const item = gratitudes.find(g => g.id === id);
    const message = item ? `Gratitude "${item.content}" deleted` : 'Gratitude deleted';

    // Animate the disappearance
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPendingDeleteId(id);

    showSnackbar(message, undoDelete);

    deleteTimerRef.current = setTimeout(() => {
      confirmDelete(id);
    }, 3000);
  };

  const undoDelete = () => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    // Animate the reappearance
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPendingDeleteId(null);
  };


  const startEditing = (item: { id: number, content: string }) => {
    setEditingId(item.id);
    setEditContent(item.content);
  };

  return (
    <ThemedView style={styles.quoteContainer}>
      <ThemedText type="subtitle" style={styles.quoteTitle}>Daily Gratitude</ThemedText>
      <ThemedText style={styles.quoteText}>What are you grateful for today?</ThemedText>

      <ThemedView style={styles.gratitudeList}>
        {gratitudes.filter(item => item.id !== pendingDeleteId).map((item) => (
          <View 
            key={item.id} 
            ref={(el) => { itemRefs.current[item.id] = el; }}
            collapsable={false}
          >
            <ThemedView style={styles.gratitudeItemRow}>
              {editingId === item.id ? (
                <ThemedView style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editContent}
                    onChangeText={setEditContent}
                    autoFocus
                    placeholderTextColor={colors.textTertiary}
                    onBlur={() => handleUpdate(item.id)}
                    onSubmitEditing={() => handleUpdate(item.id)}
                    returnKeyType="done"
                    onFocus={() => {
                      const handle = findNodeHandle(itemRefs.current[item.id]);
                      if (handle && onEditFocus) {
                        onEditFocus(handle);
                      }
                    }}
                  />
                </ThemedView>
              ) : (
                <TouchableOpacity
                  style={styles.gratitudeContent}
                  onPress={() => startEditing(item)}
                  onLongPress={() => {
                    setItemToDelete(item.id);
                  }}>
                  <ThemedText style={styles.gratitudeText}>{item.content}</ThemedText>
                </TouchableOpacity>
              )}
            </ThemedView>
          </View>
        ))}
      </ThemedView>


      <ThemedView style={styles.inputContainer}>
        <TextInput
          style={styles.chatInput}
          placeholder="I am grateful for..."
          placeholderTextColor={colors.textTertiary}
          value={newGratitude}
          onChangeText={setNewGratitude}
          multiline
          blurOnSubmit={false}
          submitBehavior="submit"
          onSubmitEditing={handleSave}
          returnKeyType="send"
          onFocus={onFocus}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSave}
        >
          <IconSymbol name="arrow.up" size={20} color="#fff" />
        </TouchableOpacity>
      </ThemedView>

      <ConfirmationModal
        visible={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete !== null) {
            handleDelete(itemToDelete);
            setItemToDelete(null);
          }
        }}
        title="Delete Gratitude"
        message="Are you sure you want to delete this gratitude?"
      />
      <ConfirmationModal
        visible={alertConfig !== null}
        onClose={() => setAlertConfig(null)}
        onConfirm={() => setAlertConfig(null)}
        title={alertConfig?.title || ''}
        message={alertConfig?.message || ''}
        confirmText="OK"
        isAlert={true}
      />
    </ThemedView>
  );
}

function ReflectionPrompt() {
  const [reflection, setReflection] = useState(REFLECTIONS[0]);
  const [answer, setAnswer] = useState('');
  const [pastMemories, setPastMemories] = useState<Reflection[]>([]);
  const [showPastMemories, setShowPastMemories] = useState(true);
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean, title: string, message: string } | null>(null);
  const { showSnackbar } = useSnackbar();
  const { styles, colors } = useThemeStyles();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      async function loadToday() {
        const dailyPrompt = await getDailyPrompt(REFLECTIONS);
        setReflection(dailyPrompt);

        let currentPrompt = dailyPrompt;
        // Then check if there's an answer for it already (or just any answer for today)
        const existing = await getTodayReflection();
        if (existing) {
          setReflection(existing.prompt);
          setAnswer(existing.answer);
          currentPrompt = existing.prompt;
        } else {
          setAnswer('');
        }

        const past = await getPastReflectionsByPrompt(currentPrompt);
        setPastMemories(past);
      }
      loadToday();
    }, [])
  );

  const handleTestShuffle = async () => {
    const newPrompt = await forceNewDailyPrompt(REFLECTIONS);
    setReflection(newPrompt);
    setAnswer('');
    const past = await getPastReflectionsByPrompt(newPrompt);
    setPastMemories(past);
  };

  return (
    <ThemedView style={styles.quoteContainer}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <ThemedText type="subtitle" style={[styles.quoteTitle, { marginBottom: 0 }]}>Evening Reflection</ThemedText>
        {__DEV__ && (
          <TouchableOpacity onPress={handleTestShuffle} style={{ padding: 4 }}>
            <IconSymbol name="arrow.triangle.2.circlepath" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
      <ThemedText style={styles.quoteText}>{reflection}</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Type your thoughts here..."
        placeholderTextColor={colors.textTertiary}
        value={answer}
        onChangeText={setAnswer}
        multiline
      />
      <TouchableOpacity
        style={styles.saveButton}
        onPress={() => {
          if (!answer.trim()) {
            setAlertConfig({ visible: true, title: 'Empty', message: 'Please write something before saving.' });
            return;
          }
          saveReflection(reflection, answer);
          // Don't clear answer on save anymore, as it acts as an edit
          showSnackbar('Reflection saved');
        }}
      >
        <IconSymbol name="checkmark.circle.fill" size={24} color="#fff" />
        <ThemedText style={styles.saveButtonText}>Save Reflection</ThemedText>
      </TouchableOpacity>

      {pastMemories.length > 0 && (
        <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.cardBorder }}>
          <TouchableOpacity 
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}
            onPress={() => setShowPastMemories(!showPastMemories)}
          >
            <ThemedText type="defaultSemiBold" style={{ color: colors.textSecondary, marginBottom: 0 }}>Past Memories</ThemedText>
            <IconSymbol 
              name={showPastMemories ? "chevron.up" : "chevron.down"} 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
          
          {showPastMemories && pastMemories.map(memory => (
            <TouchableOpacity 
              key={memory.id} 
              style={{ marginBottom: 12 }}
              onPress={() => router.navigate({ pathname: '/memories', params: { targetDate: memory.date } })}
            >
              <ThemedText style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 4, opacity: 0.8 }}>
                {new Date(memory.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </ThemedText>
              <ThemedText style={{ color: colors.text }}>{memory.answer}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <ConfirmationModal
        visible={alertConfig !== null}
        onClose={() => setAlertConfig(null)}
        onConfirm={() => setAlertConfig(null)}
        title={alertConfig?.title || ''}
        message={alertConfig?.message || ''}
        confirmText="OK"
        isAlert={true}
      />
    </ThemedView>
  );
}

export default function HomeScreen() {
  const [hours, setHours] = useState(new Date().getHours());
  const scrollRef = useRef<any>(null);
  const innerRef = useRef<View>(null);
  const { styles } = useThemeStyles();

  const handleEditFocus = (nodeHandle: number) => {
    setTimeout(() => {
      const innerHandle = findNodeHandle(innerRef.current);
      if (nodeHandle && innerHandle && scrollRef.current) {
        UIManager.measureLayout(
          nodeHandle,
          innerHandle,
          () => { console.warn("Measure failed"); },
          (left, top, width, height) => {
            scrollRef.current?.scrollTo({ y: Math.max(0, top - 80), animated: true });
          }
        );
      }
    }, 300);
  };

  useEffect(() => {
    // Update hours every minute to ensure correct greeting/content even if app stays open
    const interval = setInterval(() => {
      setHours(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const timeOfDay = useMemo(() => {
    if (hours < 12) return 'morning';
    if (hours < 18) return 'afternoon';
    return 'evening';
  }, [hours]);

  const greeting = useMemo(() => {
    let greetings = [];
    if (timeOfDay === 'morning') {
      greetings = ['Good morning', 'Rise and shine', 'Ready for the day', 'Hello there'];
    } else if (timeOfDay === 'afternoon') {
      greetings = ['Good afternoon', 'Hope your day is going well', 'Hello there'];
    } else {
      greetings = ['Good evening', 'Time to wind down', 'Hope you had a great day', 'Hello there'];
    }
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, [timeOfDay]);

  const isEvening = hours >= 18;

  const handleInputFocus = () => {
    // Wait for keyboard to start showing
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const { preferences: { showDailyQuote, showMorningRoutine, showEveningReflection, showDailyGratitude, userName, showGreeting } } = useSettings();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            <View ref={innerRef} collapsable={false} style={{ flex: 1 }}>
              {showGreeting && (
                <ThemedText type="title" style={styles.header}>
                  {userName ? `${greeting}, ${userName}` : `${greeting}`}
                </ThemedText>
              )}
              {isEvening ? (
                <>
                  {showEveningReflection && <ReflectionPrompt />}
                  {showDailyGratitude && <GratitudePrompt onFocus={handleInputFocus} onAdd={handleInputFocus} onEditFocus={handleEditFocus} />}
                </>
              ) : (
                <>
                  {showDailyQuote && <QuoteOfTheDay />}
                  {showMorningRoutine && <MorningRoutine />}
                </>
              )}
              {/* Show a message if all features for the time of day are disabled */}
              {isEvening && !showEveningReflection && !showDailyGratitude && (
                <ThemedText style={{ textAlign: 'center', marginTop: 40, opacity: 0.6 }}>No evening activities enabled.</ThemedText>
              )}
              {!isEvening && !showDailyQuote && !showMorningRoutine && (
                <ThemedText style={{ textAlign: 'center', marginTop: 40, opacity: 0.6 }}>No morning activities enabled.</ThemedText>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

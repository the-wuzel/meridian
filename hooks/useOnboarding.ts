import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const ONBOARDING_KEY = '@viewed_onboarding';

export function useOnboarding() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasViewedOnboarding, setHasViewedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    await AsyncStorage.removeItem('@viewed_onboarding'); // Uncommented to reset onboarding for testing
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (value !== null) {
        setHasViewedOnboarding(value === 'true');
      } else {
        setHasViewedOnboarding(false);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Fallback to false in case of error so they at least can use the app
      setHasViewedOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setHasViewedOnboarding(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  return {
    isLoading,
    hasViewedOnboarding,
    completeOnboarding,
  };
}

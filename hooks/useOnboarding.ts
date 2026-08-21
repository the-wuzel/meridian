import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const ONBOARDING_KEY = '@viewed_onboarding';

let globalHasViewedOnboarding: boolean | null = null;
let globalIsLoading = true;
let isChecking = false;
const listeners = new Set<() => void>();

export function useOnboarding() {
  const [isLoading, setIsLoading] = useState(globalIsLoading);
  const [hasViewedOnboarding, setHasViewedOnboardingState] = useState<boolean | null>(globalHasViewedOnboarding);

  useEffect(() => {
    const listener = () => {
      setHasViewedOnboardingState(globalHasViewedOnboarding);
      setIsLoading(globalIsLoading);
    };
    
    listeners.add(listener);
    
    if (globalHasViewedOnboarding === null && !isChecking) {
      checkOnboarding();
    } else {
      listener();
    }
    
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const checkOnboarding = async () => {
    isChecking = true;
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (value !== null) {
        globalHasViewedOnboarding = value === 'true';
      } else {
        globalHasViewedOnboarding = false;
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Fallback to false in case of error so they at least can use the app
      globalHasViewedOnboarding = false;
    } finally {
      globalIsLoading = false;
      isChecking = false;
      listeners.forEach(listener => listener());
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      globalHasViewedOnboarding = true;
      listeners.forEach(listener => listener());
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

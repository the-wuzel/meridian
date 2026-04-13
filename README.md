# mindApp (*name TDB*)

mindApp is a mindfulness and journaling application built with React Native and Expo. It helps you practice daily gratitude and evening reflections, keeping your thoughts secure and accessible only to you.

## Features

- **Daily Quote**: Receive a daily dose of inspiration with a curated quote.
- **Morning Routine**: Kickstart your day with your morning routine.
- **Daily Gratitude**: Start your day by recording things you are grateful for, with a seamless and interactive interface.
- **Evening Reflections**: Wind down with structured evening reflection inputs.
- **Memories Tab**: View your past gratitude and reflection entries organized chronologically by day.
- **Secure by Default**: Protect your journal with a PIN code and biometric unlock (Face/Touch ID) using Local Authentication.
- **Local Storage**: Your data never leaves your device. It is securely managed locally utilizing Expo SQLite, SecureStore, and AsyncStorage.
- **Customizable Appearance**: Full support for Light and Dark modes, offering a comfortable viewing experience at any time of day.
- **Notifications**: Stay on track with local daily reminders.

## Technologies Used

- **Framework**: [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)
- **Navigation**: Expo Router (file-based routing)
- **Data & Storage**: `expo-sqlite`, `expo-secure-store`, `@react-native-async-storage/async-storage`
- **Security**: `expo-local-authentication`
- **UI & Animations**: `react-native-reanimated`, `react-native-gesture-handler`, `react-native-draggable-flatlist`
- **Icons**: `@expo/vector-icons`

## Project Structure

- `app/` - Application routes and screens (e.g., tabs, settings, lock screen, PIN setup).
- `components/` - Reusable React components.
- `constants/` - App-wide constants including theming and styling (`theme.ts`, `index.styles.ts`).
- `context/` - Global state management using React Context.
- `hooks/` - Custom React hooks.
- `services/` - App services and database operations.
- `assets/` - Static assets like images, icons, and splash screens.

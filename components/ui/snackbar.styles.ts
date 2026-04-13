import { Colors } from '@/constants/theme';
import { StyleSheet } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';

export const createStyles = (theme: 'light' | 'dark', colors: typeof Colors.light, insets: EdgeInsets) => StyleSheet.create({
    container: {
        position: 'absolute',
        top: insets.top + 10,
        left: 20,
        right: 20,
        zIndex: 1000,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 16,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        overflow: 'hidden',
    },
    textContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'transparent',
    },
    message: {
        color: colors.textPrimary,
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-SemiBold',
    },
    undoButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: colors.cardBorder,
        borderRadius: 8,
    },
    undoText: {
        color: colors.primaryButton,
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-SemiBold',
    },
    progressBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: colors.primaryButton,
        opacity: 0.8,
    },
});

import { Snackbar } from '@/components/ui/snackbar';
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

interface SnackbarContextType {
    showSnackbar: (message: string, onUndo?: () => void) => void;
    hideSnackbar: () => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export function SnackbarProvider({ children }: { children: ReactNode }) {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    // We need to store the callback. 
    // Note: Storing functions in state can be tricky if not careful (functional updates), 
    // but here we just want to hold the reference.
    const [onUndoCallback, setOnUndoCallback] = useState<(() => void) | null>(null);

    const showSnackbar = useCallback((msg: string, onUndo?: () => void) => {
        setMessage(msg);
        // When setting a function into state, we must wrap it in another function 
        // or use a ref, because setState(fn) executes fn.
        // However, here we can just wrap it: setOnUndoCallback(() => onUndo)
        if (onUndo) {
            setOnUndoCallback(() => onUndo);
        } else {
            setOnUndoCallback(null);
        }
        setVisible(true);
    }, []);

    const hideSnackbar = useCallback(() => {
        setVisible(false);
    }, []);

    const handleDismiss = useCallback(() => {
        setVisible(false);
    }, []);

    const handleUndo = useCallback(() => {
        if (onUndoCallback) {
            onUndoCallback();
        }
        // Usually undo implies dismissing the snackbar too, or maybe not? 
        // In the prompt component it was: undoDelete calls setVisible(false).
        // So we should hide it.
        setVisible(false);
    }, [onUndoCallback]);

    return (
        <SnackbarContext.Provider value={{ showSnackbar, hideSnackbar }}>
            {children}
            <Snackbar
                message={message}
                visible={visible}
                onDismiss={handleDismiss}
                onUndo={handleUndo}
            />
        </SnackbarContext.Provider>
    );
}

export function useSnackbar() {
    const context = useContext(SnackbarContext);
    if (context === undefined) {
        throw new Error('useSnackbar must be used within a SnackbarProvider');
    }
    return context;
}

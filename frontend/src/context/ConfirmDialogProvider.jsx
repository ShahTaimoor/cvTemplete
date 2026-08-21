import { useCallback, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { ConfirmDialogContext } from './confirmDialogContext';

/**
 * Provides a promise-based confirm()/prompt() replacement. Use the useConfirm()
 * hook (src/hooks/useConfirm.js) to trigger it — see that file for usage examples.
 */
export function ConfirmDialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const confirmDialog = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        title: options.title || 'Are you sure?',
        message: options.message || '',
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        destructive: !!options.destructive,
        inputMode: !!options.inputMode,
        inputLabel: options.inputLabel || '',
        defaultValue: options.defaultValue || '',
      });
    });
  }, []);

  const resolveAndClose = useCallback((result) => {
    setDialog(null);
    resolverRef.current?.(result);
    resolverRef.current = null;
  }, []);

  return (
    <ConfirmDialogContext.Provider value={confirmDialog}>
      {children}
      <AnimatePresence>
        {dialog && (
          <ConfirmDialog
            {...dialog}
            onConfirm={(value) => resolveAndClose(dialog.inputMode ? value ?? '' : true)}
            onCancel={() => resolveAndClose(dialog.inputMode ? null : false)}
          />
        )}
      </AnimatePresence>
    </ConfirmDialogContext.Provider>
  );
}

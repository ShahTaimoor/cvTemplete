import { useContext } from 'react';
import { ConfirmDialogContext } from '../context/confirmDialogContext';

/**
 * Promise-based confirm()/prompt() replacement.
 *
 * const confirmDialog = useConfirm();
 *
 * // confirm-style — resolves true/false, mirrors `if (!confirm(msg)) return;`
 * const ok = await confirmDialog({
 *   title: 'Delete this resume?',
 *   message: 'This action cannot be undone.',
 *   confirmLabel: 'Delete',
 *   destructive: true,
 * });
 *
 * // prompt-style — resolves the entered string, or null if cancelled
 * const name = await confirmDialog({
 *   title: 'Save version',
 *   inputMode: true,
 *   inputLabel: 'Version name',
 *   defaultValue: 'v1',
 *   confirmLabel: 'Save',
 * });
 */
export function useConfirm() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  return ctx;
}

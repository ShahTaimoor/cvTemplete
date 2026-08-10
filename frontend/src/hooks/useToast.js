import { useContext } from 'react';
import { ToastContext } from '../context/toastContext';

/**
 * Toast/notification system — replacement for window.alert().
 *
 * const toast = useToast();
 * toast.success('Saved!');
 * toast.error('Something went wrong');
 * toast.info('Link copied');
 * toast.show('Custom message', { type: 'success', duration: 6000 });
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

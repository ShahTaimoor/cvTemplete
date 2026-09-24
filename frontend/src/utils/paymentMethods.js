export const PAYMENT_METHOD_TYPES = [
  { id: 'easypaisa', label: 'Easypaisa' },
  { id: 'jazzcash', label: 'JazzCash' },
  { id: 'bank', label: 'Bank account' },
  { id: 'other', label: 'Other' },
];

// The admin's display name if they gave one, otherwise the type's own name.
export const paymentMethodTitle = (method) =>
  method.label || PAYMENT_METHOD_TYPES.find((t) => t.id === method.type)?.label || 'Account';

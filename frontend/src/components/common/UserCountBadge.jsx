import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { publicAPI } from '../../services/api';

let cached = null;

export default function UserCountBadge({ className = '' }) {
  const [count, setCount] = useState(cached);
  useEffect(() => {
    if (cached !== null) return;
    publicAPI
      .stats()
      .then(({ data }) => {
        cached = data.totalUsers;
        setCount(cached);
      })
      .catch(() => {});
  }, []);
  if (!count) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs sm:text-sm font-semibold text-brand-700 whitespace-nowrap ${className}`}
    >
      <Users size={14} className="shrink-0" />
      {count.toLocaleString('en-US')} users joined
    </span>
  );
}

import React, { useState, useEffect } from 'react';
import { WifiOff, AlertCircle } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold text-center flex items-center justify-center gap-2 shadow-md">
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>
        You are currently offline. Previously cached diagnostic records and weather forecasts are accessible. New AI analysis requires an active connection.
      </span>
    </div>
  );
};

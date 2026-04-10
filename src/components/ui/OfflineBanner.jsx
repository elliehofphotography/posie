import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 bg-foreground text-background px-4 py-2 text-sm font-dm"
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>You're offline — showing saved content</span>
    </div>
  );
}
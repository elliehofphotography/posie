import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

export default function ShootTimer() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-1.5 text-white/70 text-xs font-mono">
      <Clock className="w-3 h-3" />
      {formatTime(seconds)}
    </div>
  );
}
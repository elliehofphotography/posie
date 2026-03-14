import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square } from 'lucide-react';

export default function ShootTimer() {
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | running | paused
  const intervalRef = useRef(null);

  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [status]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    setStatus('idle');
    setSeconds(0);
  };

  if (status === 'idle') {
    return (
      <button
        onClick={() => setStatus('running')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 text-xs font-dm transition-colors select-none"
      >
        <Play className="w-3 h-3" />
        Start Timer
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-white/80 text-xs tabular-nums">{formatTime(seconds)}</span>
      <button
        onClick={() => setStatus(status === 'running' ? 'paused' : 'running')}
        className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors select-none"
      >
        {status === 'running' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </button>
      <button
        onClick={handleStop}
        className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors select-none"
      >
        <Square className="w-3 h-3" />
      </button>
    </div>
  );
}
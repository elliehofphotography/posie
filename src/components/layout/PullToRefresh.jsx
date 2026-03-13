import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 72;

export default function PullToRefresh({ onRefresh, children }) {
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pullY = useMotionValue(0);
  const opacity = useTransform(pullY, [0, THRESHOLD], [0, 1]);
  const rotate = useTransform(pullY, [0, THRESHOLD], [0, 180]);
  const scale = useTransform(pullY, [0, THRESHOLD], [0.6, 1]);

  const onTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null || refreshing) return;
    const delta = Math.max(0, e.touches[0].clientY - startY.current);
    if (delta > 0 && window.scrollY === 0) {
      pullY.set(Math.min(delta * 0.5, THRESHOLD));
    }
  }, [refreshing, pullY]);

  const onTouchEnd = useCallback(async () => {
    if (pullY.get() >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      pullY.set(THRESHOLD * 0.6);
      await onRefresh();
      setRefreshing(false);
    }
    pullY.set(0);
    startY.current = null;
  }, [pullY, refreshing, onRefresh]);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <motion.div
        style={{ opacity, height: pullY }}
        className="flex items-center justify-center overflow-hidden"
      >
        <motion.div style={{ scale, rotate }}>
          <RefreshCw className={`w-5 h-5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
        </motion.div>
      </motion.div>
      {children}
    </div>
  );
}
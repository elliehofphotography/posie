import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { X, RotateCcw, Grid3X3, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import ShootTimer from '../components/shoot/ShootTimer';
import CategoryBar from '../components/shoot/CategoryBar';
import MetadataPanel from '../components/shoot/MetadataPanel';

const PRIORITY_ORDER = { red: 0, yellow: 1, green: 2 };

export default function ShootMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get('id');
  const sortMode = urlParams.get('sort') || 'priority';
  const navigate = useNavigate();

  const [queue, setQueue] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeta, setShowMeta] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [direction, setDirection] = useState(0);
  const [initialPhotos, setInitialPhotos] = useState([]);

  const { data: photos = [] } = useQuery({
    queryKey: ['shoot-photos', templateId],
    queryFn: () => base44.entities.TemplatePhoto.filter({ template_id: templateId }, 'sort_order'),
    enabled: !!templateId,
  });

  // Initialize session
  useEffect(() => {
    if (photos.length > 0 && initialPhotos.length === 0) {
      let sorted = [...photos];
      if (sortMode === 'priority') {
        sorted.sort((a, b) => (PRIORITY_ORDER[a.color_priority] || 2) - (PRIORITY_ORDER[b.color_priority] || 2));
      } else if (sortMode === 'shuffle') {
        for (let i = sorted.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
        }
      }
      setQueue(sorted);
      setInitialPhotos(sorted);
    }
  }, [photos]);

  // Keep screen awake via a video trick
  useEffect(() => {
    let wakeLock = null;
    const acquireWakeLock = async () => {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen').catch(() => null);
      }
    };
    acquireWakeLock();
    return () => { if (wakeLock) wakeLock.release(); };
  }, []);

  const filteredQueue = activeCategory === 'all'
    ? queue
    : queue.filter(p => p.pose_category === activeCategory);

  const currentPhoto = filteredQueue[currentIndex];
  const totalRemaining = filteredQueue.length;

  const availableCategories = [...new Set(queue.map(p => p.pose_category).filter(Boolean))];

  const handleSwipeLeft = useCallback(() => {
    if (!currentPhoto) return;
    setDirection(-1);
    setCompleted(prev => [...prev, currentPhoto.id]);
    setQueue(prev => prev.filter(p => p.id !== currentPhoto.id));
    if (currentIndex >= filteredQueue.length - 1) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  }, [currentPhoto, currentIndex, filteredQueue.length]);

  const handleSwipeRight = useCallback(() => {
    if (!currentPhoto) return;
    setDirection(1);
    // Move to end of queue
    setQueue(prev => {
      const rest = prev.filter(p => p.id !== currentPhoto.id);
      return [...rest, currentPhoto];
    });
    if (currentIndex >= filteredQueue.length - 1) {
      setCurrentIndex(0);
    }
  }, [currentPhoto, currentIndex, filteredQueue.length]);

  const handleSwipeUp = useCallback(() => {
    if (!currentPhoto) return;
    setDirection(-1);
    setQueue(prev => prev.filter(p => p.id !== currentPhoto.id));
    if (currentIndex >= filteredQueue.length - 1) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  }, [currentPhoto, currentIndex, filteredQueue.length]);

  const handleRestart = () => {
    setQueue([...initialPhotos]);
    setCompleted([]);
    setCurrentIndex(0);
    setActiveCategory('all');
  };

  // Swipe gesture handling
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);

  const handleDragEnd = (event, info) => {
    const { offset, velocity } = info;
    const swipeThreshold = 80;
    const velocityThreshold = 300;

    if (Math.abs(offset.y) > swipeThreshold && offset.y < 0 && Math.abs(offset.y) > Math.abs(offset.x)) {
      handleSwipeUp();
    } else if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
      handleSwipeLeft();
    } else if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
      handleSwipeRight();
    }
  };

  if (queue.length === 0 && initialPhotos.length > 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-center p-6">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <span className="text-3xl">🎉</span>
        </div>
        <h2 className="text-white text-2xl font-bold mb-2">Shoot Complete!</h2>
        <p className="text-white/60 text-sm mb-2">{completed.length} poses captured</p>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={handleRestart}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restart
          </Button>
          <Button className="bg-primary text-primary-foreground" onClick={() => navigate(-1)}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Top Bar */}
      <div className="relative z-20 pt-3 pb-1 px-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="icon" className="text-white h-9 w-9 hover:bg-white/10" onClick={() => navigate(-1)}>
            <X className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <span className="text-white text-xs font-medium">
              Pose {Math.min(currentIndex + 1, totalRemaining)} of {totalRemaining}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ShootTimer />
            <Link to={`/ChecklistOverview?id=${templateId}`}>
              <Button variant="ghost" size="icon" className="text-white h-9 w-9 hover:bg-white/10">
                <Grid3X3 className="w-4.5 h-4.5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="text-white h-9 w-9 hover:bg-white/10" onClick={handleRestart}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${initialPhotos.length > 0 ? (completed.length / initialPhotos.length) * 100 : 0}%` }}
          />
        </div>
        {/* Category bar */}
        {availableCategories.length > 1 && (
          <CategoryBar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            availableCategories={availableCategories}
          />
        )}
      </div>

      {/* Photo Display */}
      <div className="flex-1 relative overflow-hidden" onClick={() => setShowMeta(prev => !prev)}>
        <AnimatePresence mode="wait">
          {currentPhoto && (
            <motion.div
              key={currentPhoto.id}
              className="absolute inset-0 touch-none"
              style={{ x, y, rotate, opacity }}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.7}
              onDragEnd={handleDragEnd}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <img
                src={currentPhoto.image_url}
                alt={currentPhoto.description || ''}
                className="w-full h-full object-contain select-none pointer-events-none"
                draggable={false}
              />
              {/* Priority indicator */}
              <div className={`absolute top-4 left-4 w-3 h-3 rounded-full ${
                currentPhoto.color_priority === 'red' ? 'bg-red-500' :
                currentPhoto.color_priority === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
              } ring-2 ring-white/30`} />
            </motion.div>
          )}
        </AnimatePresence>
        
        <MetadataPanel photo={currentPhoto} visible={showMeta} />
      </div>

      {/* Swipe hints */}
      <div className="relative z-20 py-3 px-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between text-[10px] text-white/40 font-medium tracking-wider uppercase">
          <span>← Done</span>
          <span>↑ Skip</span>
          <span>Later →</span>
        </div>
      </div>
    </div>
  );
}
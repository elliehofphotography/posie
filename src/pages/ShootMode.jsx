import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { X, RotateCcw, Grid3X3 } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import ShootTimer from '../components/shoot/ShootTimer';
import CategoryBar from '../components/shoot/CategoryBar';
import MetadataPanel from '../components/shoot/MetadataPanel';

const PRIORITY_ORDER = { red: 0, yellow: 1, green: 2 };

export default function ShootMode() {
  const urlParams = new URLSearchParams(window.location.search);
  // Support single id= OR multi ids= (comma-separated gallery IDs) + optional shotlist=
  const singleId = urlParams.get('id');
  const multiIds = urlParams.get('ids');
  const shotListOverrideId = urlParams.get('shotlist');
  const templateId = singleId || (multiIds ? multiIds.split(',')[0] : null);
  const galleryIds = multiIds ? multiIds.split(',') : (singleId ? [singleId] : []);
  const isMulti = !!multiIds;
  const navigate = useNavigate();

  const [queue, setQueue] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeta, setShowMeta] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [initialPhotos, setInitialPhotos] = useState([]);

  // For single template, fetch normally
  const { data: photos = [] } = useQuery({
    queryKey: ['shoot-photos', singleId],
    queryFn: () => base44.entities.TemplatePhoto.filter({ template_id: singleId }, 'sort_order'),
    enabled: !!singleId && !isMulti,
  });

  const [allMultiPhotos, setAllMultiPhotos] = useState([]);

  useEffect(() => {
    if (!isMulti || galleryIds.length === 0) return;
    Promise.all(
      galleryIds.map(id => base44.entities.TemplatePhoto.filter({ template_id: id }, 'sort_order'))
    ).then(results => {
      const merged = results.flat();
      // Shuffle
      const shuffled = [...merged].sort(() => Math.random() - 0.5);
      setAllMultiPhotos(shuffled);
    });
  }, [multiIds]);

  const sourcePhotos = isMulti ? allMultiPhotos : photos;

  useEffect(() => {
    if (sourcePhotos.length > 0 && initialPhotos.length === 0) {
      const sorted = isMulti
        ? sourcePhotos // already shuffled
        : [...sourcePhotos].sort(
            (a, b) => (PRIORITY_ORDER[a.color_priority] || 2) - (PRIORITY_ORDER[b.color_priority] || 2)
          );
      setQueue(sorted);
      setInitialPhotos(sorted);
    }
  }, [sourcePhotos]);

  useEffect(() => {
    let wakeLock = null;
    const acquire = async () => {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen').catch(() => null);
      }
    };
    acquire();
    return () => { if (wakeLock) wakeLock.release(); };
  }, []);

  const filteredQueue = activeCategory === 'all'
    ? queue
    : queue.filter(p => p.pose_category === activeCategory);

  const currentPhoto = filteredQueue[currentIndex];
  const availableCategories = [...new Set(queue.map(p => p.pose_category).filter(Boolean))];

  const handleDone = useCallback(() => {
    if (!currentPhoto) return;
    setCompleted(prev => [...prev, currentPhoto.id]);
    setQueue(prev => prev.filter(p => p.id !== currentPhoto.id));
    if (currentIndex >= filteredQueue.length - 1) setCurrentIndex(Math.max(0, currentIndex - 1));
  }, [currentPhoto, currentIndex, filteredQueue.length]);

  const handleLater = useCallback(() => {
    if (!currentPhoto) return;
    setQueue(prev => {
      const rest = prev.filter(p => p.id !== currentPhoto.id);
      return [...rest, currentPhoto];
    });
    if (currentIndex >= filteredQueue.length - 1) setCurrentIndex(0);
  }, [currentPhoto, currentIndex, filteredQueue.length]);

  const handleRestart = () => {
    setQueue([...initialPhotos]);
    setCompleted([]);
    setCurrentIndex(0);
    setActiveCategory('all');
  };

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const doneOpacity = useTransform(x, [-80, -20], [1, 0]);
  const laterOpacity = useTransform(x, [20, 80], [0, 1]);

  const handleDragEnd = (_, info) => {
    const { offset, velocity } = info;
    if (offset.y < -80 && Math.abs(offset.y) > Math.abs(offset.x)) {
      handleDone();
    } else if (offset.x < -80 || velocity.x < -400) {
      handleDone();
    } else if (offset.x > 80 || velocity.x > 400) {
      handleLater();
    }
  };

  if (queue.length === 0 && initialPhotos.length > 0) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <span className="text-4xl">✨</span>
        </div>
        <h2 className="font-playfair text-2xl font-semibold text-foreground mb-2">Shoot Complete</h2>
        <p className="font-dm text-muted-foreground text-sm mb-8">{completed.length} poses captured</p>
        <div className="flex gap-3">
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border font-dm text-sm text-foreground hover:bg-muted transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-dm text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0d0d0d] flex flex-col">
      {/* Top bar */}
      <div className="relative z-20 pb-1 px-4 bg-gradient-to-b from-black/70 to-transparent" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate(-1)}
            className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center">
            <span className="font-dm text-white/70 text-xs">
              {Math.min(currentIndex + 1, filteredQueue.length)} / {filteredQueue.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ShootTimer />
            <Link to={shotListOverrideId ? `/ShotList?id=${shotListOverrideId}` : `/ChecklistOverview?id=${templateId}`}>
              <button className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors ml-1">
                <Grid3X3 className="w-4 h-4" />
              </button>
            </Link>
            <button
              onClick={handleRestart}
              className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="h-0.5 bg-white/10 rounded-full overflow-hidden mx-1">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${initialPhotos.length > 0 ? (completed.length / initialPhotos.length) * 100 : 0}%` }}
          />
        </div>

        {availableCategories.length > 1 && (
          <CategoryBar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            availableCategories={availableCategories}
          />
        )}
      </div>

      {/* Photo */}
      <div className="flex-1 relative overflow-hidden" onClick={() => setShowMeta(p => !p)}>
        <AnimatePresence mode="wait">
          {currentPhoto && (
            <motion.div
              key={currentPhoto.id}
              className="absolute inset-0 touch-none"
              style={{ x, rotate }}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.65}
              onDragEnd={handleDragEnd}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <img
                src={currentPhoto.image_url}
                alt={currentPhoto.description || ''}
                className="w-full h-full object-contain select-none pointer-events-none"
                draggable={false}
              />

              {/* Swipe overlays */}
              <motion.div
                className="absolute inset-0 bg-primary/20 flex items-center justify-center rounded-lg pointer-events-none"
                style={{ opacity: doneOpacity }}
              >
                <div className="border-4 border-primary rounded-xl px-6 py-3 rotate-12">
                  <span className="font-playfair text-primary text-3xl font-bold">DONE</span>
                </div>
              </motion.div>
              <motion.div
                className="absolute inset-0 bg-accent/20 flex items-center justify-center rounded-lg pointer-events-none"
                style={{ opacity: laterOpacity }}
              >
                <div className="border-4 border-accent rounded-xl px-6 py-3 -rotate-12">
                  <span className="font-playfair text-accent text-3xl font-bold">LATER</span>
                </div>
              </motion.div>

              {/* Priority dot */}
              <div className={`absolute top-4 left-4 w-3 h-3 rounded-full ${
                currentPhoto.color_priority === 'red' ? 'bg-red-500' :
                currentPhoto.color_priority === 'yellow' ? 'bg-yellow-400' : 'bg-green-500'
              } ring-2 ring-white/30`} />
            </motion.div>
          )}
        </AnimatePresence>
        <MetadataPanel photo={currentPhoto} visible={showMeta} />
      </div>

      {/* Bottom bar */}
      <div className="z-20 pb-4 px-5 bg-gradient-to-t from-black/70 to-transparent" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-dm text-[10px] text-white/35 uppercase tracking-widest">← Skip</span>
          <span className="font-dm text-[10px] text-white/35 uppercase tracking-widest">↑ Skip</span>
          <span className="font-dm text-[10px] text-white/35 uppercase tracking-widest">Later →</span>
        </div>
        <button
          onClick={handleDone}
          className="w-full py-3 rounded-full bg-white/15 backdrop-blur-sm text-white font-dm text-sm font-medium hover:bg-white/25 transition-colors select-none"
        >
          Skip Photo
        </button>
      </div>
    </div>
  );
}
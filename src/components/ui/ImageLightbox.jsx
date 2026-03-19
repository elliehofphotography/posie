import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageLightbox({ image, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!image) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
        onClick={onClose}
      >
        {/* Back button */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-4 left-4 z-10 h-11 w-11 rounded-full bg-muted/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-muted transition-colors select-none"
          style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Image */}
        <motion.img
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          src={image}
          alt=""
          onClick={(e) => e.stopPropagation()}
          className="max-w-full max-h-full w-full h-full object-contain"
          style={{ padding: '0' }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Aperture, Sun, Move, StickyNote } from 'lucide-react';

export default function MetadataPanel({ photo, visible }) {
  if (!photo) return null;

  const hasTechnical = photo.lens_suggestion || photo.aperture_suggestion || photo.lighting_notes || photo.camera_angle || photo.technical_notes;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-5 pt-20 pointer-events-none"
        >
          {photo.description && (
            <p className="font-dm text-white/90 text-sm leading-relaxed mb-3">{photo.description}</p>
          )}

          {hasTechnical && (
            <div className="flex flex-wrap gap-2">
              {photo.lens_suggestion && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm">
                  <Aperture className="w-3 h-3 text-primary" />
                  <span className="font-dm text-white/80 text-xs">{photo.lens_suggestion}</span>
                </div>
              )}
              {photo.aperture_suggestion && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm">
                  <Aperture className="w-3 h-3 text-primary" />
                  <span className="font-dm text-white/80 text-xs">{photo.aperture_suggestion}</span>
                </div>
              )}
              {photo.lighting_notes && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm">
                  <Sun className="w-3 h-3 text-primary" />
                  <span className="font-dm text-white/80 text-xs">{photo.lighting_notes}</span>
                </div>
              )}
              {photo.camera_angle && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm">
                  <Move className="w-3 h-3 text-primary" />
                  <span className="font-dm text-white/80 text-xs">{photo.camera_angle}</span>
                </div>
              )}
              {photo.technical_notes && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm">
                  <StickyNote className="w-3 h-3 text-primary" />
                  <span className="font-dm text-white/80 text-xs">{photo.technical_notes}</span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
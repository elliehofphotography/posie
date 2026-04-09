import React, { useEffect } from 'react';
import { ArrowLeft, Camera, Aperture, Zap, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const categoryLabels = {
  standing: 'Standing', sitting: 'Sitting', walking: 'Walking',
  close_up: 'Close-up', wide_shot: 'Wide Shot', detail: 'Detail',
  interaction: 'Interaction', candid: 'Candid', other: 'Other',
};

const priorityColors = {
  red: 'bg-red-500', yellow: 'bg-yellow-400', green: 'bg-green-500',
};

export default function PhotoDetailLightbox({ photo, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!photo) return null;

  const hasDetails = photo.description || photo.pose_category || photo.lens_suggestion ||
    photo.aperture_suggestion || photo.lighting_notes || photo.camera_angle || photo.technical_notes;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col"
      >
        {/* Back button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute left-4 z-20 h-11 w-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors select-none"
          style={{ top: 'calc(max(1rem, env(safe-area-inset-top)) + 0.25rem)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Image — fills remaining space above the sheet */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <img
            src={photo.image_url}
            alt={photo.description || ''}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Bottom info sheet */}
        {hasDetails && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="bg-background rounded-t-3xl px-5 pt-5 pb-6 space-y-3"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Priority + category row */}
            <div className="flex items-center gap-2 flex-wrap">
              {photo.color_priority && (
                <div className={`w-2.5 h-2.5 rounded-full ${priorityColors[photo.color_priority] || priorityColors.green}`} />
              )}
              {photo.pose_category && (
                <span className="px-2.5 py-0.5 rounded-full bg-muted font-dm text-xs text-muted-foreground">
                  {categoryLabels[photo.pose_category] || photo.pose_category}
                </span>
              )}
            </div>

            {/* Description */}
            {photo.description && (
              <p className="font-dm text-sm text-foreground leading-relaxed">{photo.description}</p>
            )}

            {/* Technical details */}
            <div className="grid grid-cols-2 gap-2">
              {photo.lens_suggestion && (
                <div className="flex items-start gap-2 bg-muted rounded-xl px-3 py-2">
                  <Camera className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-dm text-[10px] text-muted-foreground uppercase tracking-wider">Lens</p>
                    <p className="font-dm text-xs text-foreground">{photo.lens_suggestion}</p>
                  </div>
                </div>
              )}
              {photo.aperture_suggestion && (
                <div className="flex items-start gap-2 bg-muted rounded-xl px-3 py-2">
                  <Aperture className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-dm text-[10px] text-muted-foreground uppercase tracking-wider">Aperture</p>
                    <p className="font-dm text-xs text-foreground">{photo.aperture_suggestion}</p>
                  </div>
                </div>
              )}
              {photo.camera_angle && (
                <div className="flex items-start gap-2 bg-muted rounded-xl px-3 py-2">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-dm text-[10px] text-muted-foreground uppercase tracking-wider">Angle</p>
                    <p className="font-dm text-xs text-foreground">{photo.camera_angle}</p>
                  </div>
                </div>
              )}
              {photo.lighting_notes && (
                <div className="flex items-start gap-2 bg-muted rounded-xl px-3 py-2 col-span-2">
                  <Zap className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-dm text-[10px] text-muted-foreground uppercase tracking-wider">Lighting</p>
                    <p className="font-dm text-xs text-foreground">{photo.lighting_notes}</p>
                  </div>
                </div>
              )}
            </div>

            {photo.technical_notes && (
              <p className="font-dm text-xs text-muted-foreground leading-relaxed">{photo.technical_notes}</p>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Slider } from '@/components/ui/slider';
import { X, Check, RotateCcw } from 'lucide-react';

const ASPECT = 16 / 9;
const OUTPUT_W = 1280;
const OUTPUT_H = Math.round(OUTPUT_W / ASPECT);

export default function CoverImageEditor({ open, onOpenChange, imageSrc, onApply }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [applying, setApplying] = useState(false);
  const dragRef = useRef(null);
  const frameRef = useRef(null);

  // Reset state whenever a new image is loaded
  useEffect(() => {
    if (open && imageSrc) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      const img = new Image();
      img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = imageSrc;
    }
  }, [open, imageSrc]);

  const getDisplaySize = useCallback((z) => {
    const frame = frameRef.current;
    if (!frame || !imgSize.w) return { dispW: 0, dispH: 0, maxX: 0, maxY: 0 };
    const fw = frame.clientWidth;
    const fh = frame.clientHeight;
    // object-cover scale: the larger of the two ratios
    const coverScale = Math.max(fw / imgSize.w, fh / imgSize.h);
    const dispW = imgSize.w * coverScale * z;
    const dispH = imgSize.h * coverScale * z;
    const maxX = Math.max(0, (dispW - fw) / 2);
    const maxY = Math.max(0, (dispH - fh) / 2);
    return { dispW, dispH, maxX, maxY };
  }, [imgSize]);

  const clampOffset = useCallback((x, y, z) => {
    const { maxX, maxY } = getDisplaySize(z);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, [getDisplaySize]);

  const onPointerDown = (e) => {
    e.preventDefault();
    const { maxX, maxY } = getDisplaySize(zoom);
    if (maxX === 0 && maxY === 0) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startOff = { ...offset };
    const dragging = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const clamped = clampOffset(startOff.x + dx, startOff.y + dy, zoom);
      setOffset(clamped);
    };
    dragRef.current = dragging;
    window.addEventListener('pointermove', dragging);
    window.addEventListener('pointerup', () => {
      window.removeEventListener('pointermove', dragging);
      dragRef.current = null;
    }, { once: true });
  };

  const handleZoomChange = (val) => {
    const z = val[0];
    const clamped = clampOffset(offset.x, offset.y, z);
    setOffset(clamped);
    setZoom(z);
  };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_W;
      canvas.height = OUTPUT_H;
      const ctx = canvas.getContext('2d');
      const frame = frameRef.current;
      const fw = frame.clientWidth;
      const fh = frame.clientHeight;

      // Load the source image at full resolution
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageSrc;
      });

      // Scale factor from displayed pixels to output pixels
      const scale = OUTPUT_W / fw;

      // Cover-fit the image using the same object-cover logic as the preview
      const coverScale = Math.max(fw / img.naturalWidth, fh / img.naturalHeight);
      const dispW = img.naturalWidth * coverScale * zoom;
      const dispH = img.naturalHeight * coverScale * zoom;
      // position of image top-left within the frame (before scaling)
      const imgLeft = (fw - dispW) / 2 + offset.x;
      const imgTop = (fh - dispH) / 2 + offset.y;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, OUTPUT_W, OUTPUT_H);

      // Draw the source image mapped from its natural size into the display rect, scaled up
      ctx.drawImage(
        img,
        0, 0, img.naturalWidth, img.naturalHeight,
        imgLeft * scale, imgTop * scale, dispW * scale, dispH * scale
      );

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      onApply(blob);
    } catch (err) {
      console.error('Crop failed', err);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-border max-h-[92vh]">
        <DrawerHeader className="flex items-center justify-between pb-2">
          <DrawerTitle className="font-playfair text-xl text-foreground">Adjust Cover Image</DrawerTitle>
          <DrawerClose asChild>
            <button className="h-8 w-8 rounded-full bg-muted flex items-center justify-center select-none">
              <X className="w-4 h-4" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4">
          <p className="font-dm text-xs text-muted-foreground -mt-1">
            Drag to reposition and use the slider to zoom in. The crop matches your cover's 16:9 ratio.
          </p>

          {/* Crop frame */}
          <div
            ref={frameRef}
            data-vaul-no-drag
            className="relative w-full overflow-hidden rounded-2xl bg-black select-none"
            style={{ aspectRatio: `${ASPECT}`, touchAction: 'none' }}
          >
            {imageSrc && (
              <img
                src={imageSrc}
                alt="Cover preview"
                draggable={false}
                onPointerDown={onPointerDown}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: dragRef.current ? 'none' : 'transform 0.05s linear',
                  cursor: zoom > 1 ? 'grab' : 'default',
                }}
              />
            )}
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <span className="font-dm text-xs text-muted-foreground shrink-0">Zoom</span>
            <Slider
              value={[zoom]}
              onValueChange={handleZoomChange}
              min={1}
              max={3}
              step={0.01}
              className="flex-1"
            />
            <button
              type="button"
              onClick={reset}
              className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <DrawerFooter className="px-4 pt-0">
          <button
            type="button"
            onClick={handleApply}
            disabled={applying}
            className="w-full py-3 rounded-full bg-primary text-primary-foreground font-dm text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 select-none"
          >
            {applying ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                Applying…
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Apply Crop
              </>
            )}
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
import React, { useState } from 'react';
import {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerClose,
  DrawerTitle,
} from '@/components/ui/drawer';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileMenu({ trigger, items, open, onOpenChange, title, align = 'end' }) {
  const hapticFeedback = (type = 'light') => {
    if (window.navigator?.vibrate) {
      const patterns = {
        light: 10,
        medium: 20,
        heavy: 30,
      };
      window.navigator.vibrate(patterns[type] || 10);
    }
  };

  const handleItemClick = (item, e) => {
    e?.stopPropagation?.();
    hapticFeedback(item.destructive ? 'heavy' : 'medium');
    item.onClick?.(e);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <div onClick={() => onOpenChange(true)}>
          {trigger}
        </div>
      )}

      <DrawerPortal>
        <DrawerOverlay className="bg-black/40" />
        <DrawerContent className="bg-card border-t border-border max-h-[80vh]" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center justify-between px-4 py-3">
            {title && <DrawerTitle className="font-playfair text-lg text-foreground">{title}</DrawerTitle>}
            <DrawerClose className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center text-foreground transition-colors">
              <X className="w-4 h-4" />
            </DrawerClose>
          </div>

          <div className="flex flex-col divide-y divide-border px-4 pb-4">
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={(e) => handleItemClick(item, e)}
                disabled={item.disabled}
                className={cn(
                  'flex items-center gap-3 py-3 px-0 text-left font-dm text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-12 min-h-[44px]',
                  item.destructive
                    ? 'text-destructive hover:bg-destructive/5'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                {item.icon && (
                  <span className="w-4 h-4 flex items-center justify-center shrink-0">
                    {item.icon}
                  </span>
                )}
                <span className="flex-1">{item.label}</span>
              </button>
            ))}
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}

export default MobileMenu;
import React, { useState } from 'react';
import {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerClose,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Check, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Mobile-native bottom-sheet replacement for Radix Select.
 * Usage:
 *   <BottomSheetSelect
 *     label="Category"
 *     value={form.pose_category}
 *     onChange={(v) => update('pose_category', v)}
 *     options={[{ value: 'standing', label: 'Standing' }]}
 *   />
 */
export default function BottomSheetSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  className = '',
  renderOption,
}) {
  const [open, setOpen] = useState(false);

  const selected = options.find(o => o.value === value);

  const handleSelect = (optValue) => {
    onChange(optValue);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center justify-between w-full h-10 px-3 rounded-lg bg-muted border border-border font-dm text-sm text-left transition-colors hover:bg-muted/80 select-none',
          !selected && 'text-muted-foreground',
          className
        )}
      >
        <span className="truncate flex-1">
          {selected ? (renderOption ? renderOption(selected) : selected.label) : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-1.5" />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerPortal>
          <DrawerOverlay className="bg-black/40" />
          <DrawerContent
            className="bg-card border-t border-border max-h-[70vh]"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              {label && <DrawerTitle className="font-playfair text-lg text-foreground">{label}</DrawerTitle>}
              <DrawerClose className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center text-foreground transition-colors ml-auto">
                <X className="w-4 h-4" />
              </DrawerClose>
            </div>

            <div className="overflow-y-auto flex flex-col divide-y divide-border px-4 pb-2">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'flex items-center gap-3 py-3.5 text-left font-dm text-sm transition-colors min-h-[48px]',
                      isSelected ? 'text-primary font-medium' : 'text-foreground'
                    )}
                  >
                    <span className="flex-1">
                      {renderOption ? renderOption(opt) : opt.label}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    </>
  );
}
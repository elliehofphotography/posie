import React from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'standing', label: 'Standing' },
  { value: 'sitting', label: 'Sitting' },
  { value: 'walking', label: 'Walking' },
  { value: 'close_up', label: 'Close-up' },
  { value: 'wide_shot', label: 'Wide' },
  { value: 'detail', label: 'Detail' },
  { value: 'interaction', label: 'Interaction' },
  { value: 'other', label: 'Other' },
];

export default function CategoryBar({ activeCategory, onCategoryChange, availableCategories = [] }) {
  const filteredCategories = CATEGORIES.filter(
    c => c.value === 'all' || availableCategories.includes(c.value)
  );

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-1.5 px-4 py-2">
        {filteredCategories.map(c => (
          <button
            key={c.value}
            onClick={() => onCategoryChange(c.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === c.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
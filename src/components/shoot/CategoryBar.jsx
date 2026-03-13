import React from 'react';

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
  const visible = CATEGORIES.filter(c => c.value === 'all' || availableCategories.includes(c.value));

  return (
    <div className="flex gap-1.5 overflow-x-auto py-2 px-1" style={{ scrollbarWidth: 'none' }}>
      {visible.map(c => (
        <button
          key={c.value}
          onClick={() => onCategoryChange(c.value)}
          className={`px-3 py-1 rounded-full font-dm text-xs font-medium whitespace-nowrap transition-all ${
            activeCategory === c.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
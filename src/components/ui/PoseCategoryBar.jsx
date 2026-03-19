import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getUserPoseCategories } from '@/lib/poseCategories';

export default function PoseCategoryBar({ activeCategory, onChange }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    base44.auth.me().then(u => {
      setCategories(getUserPoseCategories(u?.pose_categories));
    }).catch(() => {
      setCategories(getUserPoseCategories(null));
    });
  }, []);

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-2" style={{ scrollbarWidth: 'none' }}>
      {activeCategory && (
        <button
          onClick={() => onChange(null)}
          className="shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {categories.map(cat => (
        <button
          key={cat.value}
          onClick={() => onChange(activeCategory === cat.value ? null : cat.value)}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-dm font-medium whitespace-nowrap transition-all border ${
            activeCategory === cat.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:border-primary/40'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
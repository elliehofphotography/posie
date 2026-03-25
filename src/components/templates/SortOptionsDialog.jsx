import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Layers, Clock, Check, Shuffle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getUserPoseCategories } from '@/lib/poseCategories';
import { cn } from '@/lib/utils';

export default function SortOptionsDialog({ open, onOpenChange, onSelect }) {
  const [categoryOrder, setCategoryOrder] = useState('');
  const [selected, setSelected] = useState(new Set(['color']));

  useEffect(() => {
    if (open) {
      base44.auth.me().then(u => {
        const cats = getUserPoseCategories(u?.pose_categories);
        const labels = cats.map(c => c.label);
        const displayLabels = labels.length > 3 ? labels.slice(0, 3).join(' → ') + '...' : labels.join(' → ');
        setCategoryOrder(displayLabels);
      }).catch(() => {
        setCategoryOrder('Standing → Sitting → Walking...');
      });
    }
  }, [open]);

  // Exclusive options that can't be combined with others
  const EXCLUSIVE = new Set(['natural', 'random']);

  const toggleOption = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (EXCLUSIVE.has(id)) {
        return new Set([id]);
      }
      // Clear any exclusive selections
      EXCLUSIVE.forEach(e => next.delete(e));
      if (next.has(id)) {
        next.delete(id);
        if (next.size === 0) next.add('natural'); // fallback
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleStart = () => {
    let sortKey;
    if (selected.has('random')) {
      sortKey = 'random';
    } else if (selected.has('color') && selected.has('category')) {
      sortKey = 'color+category';
    } else if (selected.has('color')) {
      sortKey = 'color';
    } else if (selected.has('category')) {
      sortKey = 'category';
    } else {
      sortKey = 'natural';
    }
    onSelect(sortKey);
    onOpenChange(false);
  };

  const options = [
    {
      id: 'color',
      label: 'Color Priority',
      description: 'Red → Yellow → Green',
      icon: Sparkles,
    },
    {
      id: 'category',
      label: 'Category Sort',
      description: `${categoryOrder || '...'} (change in settings)`,
      icon: Layers,
    },
    {
      id: 'random',
      label: 'Randomized',
      description: 'All photos in a random order, no repeats',
      icon: Shuffle,
    },
    {
      id: 'natural',
      label: 'Natural Order',
      description: 'Most recently added first',
      icon: Clock,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-vina text-2xl text-primary tracking-widest uppercase">
            How to Shoot
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = selected.has(option.id);
            return (
              <button
                key={option.id}
                onClick={() => toggleOption(option.id)}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3 rounded-2xl border transition-colors text-left',
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:bg-muted'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                  isSelected ? 'bg-primary' : 'bg-primary/10'
                )}>
                  <Icon className={cn('w-4 h-4', isSelected ? 'text-primary-foreground' : 'text-primary')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-dm text-sm font-medium text-foreground">{option.label}</p>
                  <p className="font-dm text-xs text-muted-foreground mt-0.5 leading-snug">{option.description}</p>
                </div>
                {isSelected && !EXCLUSIVE.has(option.id) && (
                  <Check className="w-4 h-4 text-primary shrink-0 mt-3" />
                )}
              </button>
            );
          })}
        </div>

        <Button onClick={handleStart} className="w-full mt-1">
          Start Shoot
        </Button>
      </DialogContent>
    </Dialog>
  );
}
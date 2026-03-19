import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { GripVertical, Plus, X } from 'lucide-react';
import { Reorder } from 'framer-motion';
import { DEFAULT_POSE_CATEGORIES } from '@/lib/poseCategories';
import { base44 } from '@/api/base44Client';

export default function CategorySortingSheet({ open, onOpenChange, user, onSaved }) {
  const [categories, setCategories] = useState(
    user?.pose_categories && user.pose_categories.length > 0
      ? user.pose_categories
      : DEFAULT_POSE_CATEGORIES.map(c => c.value)
  );
  const [saving, setSaving] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  useEffect(() => {
    if (user?.pose_categories && user.pose_categories.length > 0) {
      setCategories(user.pose_categories);
    }
  }, [user?.pose_categories, open]);

  const handleToggle = (value) => {
    setCategories(prev => {
      if (prev.includes(value)) {
        return prev.filter(c => c !== value);
      } else {
        // Add to end
        return [...prev, value];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ pose_categories: categories });
      onSaved({ pose_categories: categories });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCategories(DEFAULT_POSE_CATEGORIES.map(c => c.value));
  };

  const availableForAdding = DEFAULT_POSE_CATEGORIES.filter(c => !categories.includes(c.value));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border flex flex-col max-h-screen overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-playfair text-lg text-foreground">Category Sorting</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 py-4">
          <div>
            <p className="font-dm text-xs uppercase tracking-wider text-muted-foreground mb-3">Active Categories (drag to reorder)</p>
            <Reorder.Group values={categories} onReorder={setCategories} className="space-y-2">
              {categories.map(value => {
                const label = DEFAULT_POSE_CATEGORIES.find(c => c.value === value)?.label || value;
                return (
                  <Reorder.Item key={value} value={value} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-dm text-sm text-foreground flex-1">{label}</span>
                    <button
                      onClick={() => handleToggle(value)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </div>

          {availableForAdding.length > 0 && (
            <div>
              <p className="font-dm text-xs uppercase tracking-wider text-muted-foreground mb-3">Add Categories</p>
              <div className="space-y-1.5">
                {availableForAdding.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => handleToggle(cat.value)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-dashed border-border hover:border-primary/40 transition-colors text-left"
                  >
                    <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-dm text-sm text-foreground">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4 space-y-2 mt-4">
          <Button
            onClick={handleReset}
            variant="ghost"
            className="w-full font-dm"
          >
            Reset to Default
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-dm"
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
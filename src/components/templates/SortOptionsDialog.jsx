import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Layers, Clock } from 'lucide-react';

export default function SortOptionsDialog({ open, onOpenChange, onSelect }) {
  const options = [
    {
      id: 'color',
      label: 'Color Priority',
      description: 'Red → Yellow → Green',
      icon: Sparkles,
    },
    {
      id: 'category',
      label: 'Category Priority',
      description: 'Standing → Closeup → Walking → Wide → Sitting → Interaction → Detail → Candid → Other',
      icon: Layers,
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
            return (
              <button
                key={option.id}
                onClick={() => {
                  onSelect(option.id);
                  onOpenChange(false);
                }}
                className="w-full flex items-start gap-3 px-4 py-3 rounded-2xl border border-border bg-card hover:bg-muted transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-dm text-sm font-medium text-foreground">{option.label}</p>
                  <p className="font-dm text-xs text-muted-foreground mt-0.5 leading-snug">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
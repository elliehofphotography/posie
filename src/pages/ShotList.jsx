import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShotList() {
  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newItem, setNewItem] = useState('');

  const { data: items = [] } = useQuery({
    queryKey: ['shotlist', templateId],
    queryFn: () => base44.entities.ShotListItem.filter({ template_id: templateId }, 'sort_order'),
    enabled: !!templateId,
  });

  const addMutation = useMutation({
    mutationFn: (text) => base44.entities.ShotListItem.create({
      template_id: templateId,
      text,
      sort_order: items.length,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shotlist', templateId] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }) => base44.entities.ShotListItem.update(id, { is_completed: completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shotlist', templateId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ShotListItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shotlist', templateId] }),
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    addMutation.mutate(newItem.trim());
    setNewItem('');
  };

  const completedCount = items.filter(i => i.is_completed).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-playfair text-lg font-semibold text-foreground">Shot List</h1>
            <p className="font-dm text-xs text-muted-foreground">{completedCount} of {items.length} done</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-dm text-xs text-muted-foreground">{completedCount} completed</span>
            <span className="font-dm text-xs font-medium text-foreground">{Math.round((completedCount / items.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / items.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* List */}
      <div className="p-5 space-y-2.5">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -80 }}
              className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all ${
                item.is_completed
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-card border-border'
              }`}
            >
              <Checkbox
                checked={item.is_completed}
                onCheckedChange={(checked) => toggleMutation.mutate({ id: item.id, completed: checked })}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0"
              />
              <span className={`flex-1 font-dm text-sm leading-snug ${
                item.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'
              }`}>
                {item.text}
              </span>
              <button
                className="text-muted-foreground hover:text-destructive transition-colors p-1"
                onClick={() => deleteMutation.mutate(item.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="text-center py-16">
            <p className="font-playfair text-lg text-muted-foreground italic mb-1">Nothing yet</p>
            <p className="font-dm text-sm text-muted-foreground/60">Add your first group shot below</p>
          </div>
        )}
      </div>

      {/* Add input pinned above bottom nav */}
      <div className="fixed bottom-20 left-0 right-0 px-5 pb-2">
        <form onSubmit={handleAdd} className="flex gap-2 bg-card border border-border rounded-2xl p-2 shadow-sm">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="e.g. Bride + Parents"
            className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 font-dm text-sm placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!newItem.trim()}
            className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
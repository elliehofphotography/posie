import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GripVertical, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShotList() {
  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newItem, setNewItem] = useState('');

  const { data: items = [], isLoading } = useQuery({
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
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Shot List</h1>
              <p className="text-xs text-muted-foreground">{completedCount} of {items.length} completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      {items.length > 0 && (
        <div className="px-4 pt-4">
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / items.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* List */}
      <div className="p-4 space-y-2">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                item.is_completed
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-card border-border'
              }`}
            >
              <Checkbox
                checked={item.is_completed}
                onCheckedChange={(checked) => toggleMutation.mutate({ id: item.id, completed: checked })}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className={`flex-1 text-sm ${item.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {item.text}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => deleteMutation.mutate(item.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add item */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="e.g. Bride + Parents"
            className="flex-1 bg-card border-border"
          />
          <Button type="submit" disabled={!newItem.trim()} size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
            <Plus className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
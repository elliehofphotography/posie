import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Check, GripVertical, RotateCcw } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import PageHeader from '../components/ui/PageHeader';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';


export default function ShotList() {
  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newItem, setNewItem] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const editInputRef = useRef(null);

  const { data: rawItems = [] } = useQuery({
    queryKey: ['shotlist', templateId],
    queryFn: () => base44.entities.ShotListItem.filter({ template_id: templateId }, 'sort_order'),
    enabled: !!templateId,
  });

  // Completed items always at bottom
  const items = [
    ...rawItems.filter(i => !i.is_completed),
    ...rawItems.filter(i => i.is_completed),
  ];

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

  const editTextMutation = useMutation({
    mutationFn: ({ id, text }) => base44.entities.ShotListItem.update(id, { text }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shotlist', templateId] }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (reordered) => {
      await Promise.all(reordered.map((item, index) =>
        base44.entities.ShotListItem.update(item.id, { sort_order: index })
      ));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shotlist', templateId] }),
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    // Optimistic update
    queryClient.setQueryData(['shotlist', templateId], reordered);
    reorderMutation.mutate(reordered);
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditingText(item.text);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const commitEdit = () => {
    if (editingText.trim() && editingText.trim() !== items.find(i => i.id === editingId)?.text) {
      editTextMutation.mutate({ id: editingId, text: editingText.trim() });
    }
    setEditingId(null);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    addMutation.mutate(newItem.trim());
    setNewItem('');
  };

  const completedCount = items.filter(i => i.is_completed).length;

  const restartMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(rawItems.map(item =>
        base44.entities.ShotListItem.update(item.id, { is_completed: false })
      ));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shotlist', templateId] }),
  });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Shot List"
        subtitle={`${completedCount} of ${items.length} done`}
        right={completedCount > 0 && (
          <button
            onClick={() => restartMutation.mutate()}
            disabled={restartMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-muted text-muted-foreground text-xs font-dm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
        )}
      />

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
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="shotlist">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2.5">
                {items.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(drag) => (
                      <div
                        ref={drag.innerRef}
                        {...drag.draggableProps}
                        className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all ${
                          item.is_completed
                            ? 'bg-primary/5 border-primary/20'
                            : 'bg-card border-border'
                        }`}
                      >
                        <span {...drag.dragHandleProps} className="text-muted-foreground/50 shrink-0 cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-4 h-4" />
                        </span>
                        <Checkbox
                          checked={item.is_completed}
                          onCheckedChange={(checked) => toggleMutation.mutate({ id: item.id, completed: checked })}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0"
                        />
                        {editingId === item.id ? (
                          <input
                            ref={editInputRef}
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                            className="flex-1 bg-transparent border-none outline-none font-dm text-sm text-foreground"
                          />
                        ) : (
                          <span
                            className={`flex-1 font-dm text-sm leading-snug cursor-text ${
                              item.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}
                            onDoubleClick={() => !item.is_completed && startEditing(item)}
                          >
                            {item.text}
                          </span>
                        )}
                        {editingId === item.id ? (
                          <button className="text-primary p-1" onClick={commitEdit}>
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            onClick={() => deleteMutation.mutate(item.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {items.length === 0 && (
          <div className="text-center py-16">
            <p className="font-playfair text-lg text-muted-foreground italic mb-1">Nothing yet</p>
            <p className="font-dm text-sm text-muted-foreground/60">Add your first group shot below</p>
          </div>
        )}
      </div>

      {/* Add input pinned above bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-2" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
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
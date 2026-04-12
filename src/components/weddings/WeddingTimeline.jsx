import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Clock, ChevronRight, Pencil, Trash2, Link, CheckCircle2, Circle, ChevronDown } from 'lucide-react';
import AddTimelineEventDialog from './AddTimelineEventDialog';

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function EventRow({ event, galleries, onToggle, onEdit, onDelete, onGalleryOpen }) {
  const linkedGallery = galleries.find(g => g.id === event.related_gallery_id);

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${event.is_completed ? 'bg-muted/40 border-border/50 opacity-70' : 'bg-card border-border'}`}>
      <button onClick={() => onToggle(event)} className="mt-0.5 shrink-0 text-primary" aria-label="Toggle complete">
        {event.is_completed
          ? <CheckCircle2 className="w-5 h-5 text-primary" />
          : <Circle className="w-5 h-5 text-muted-foreground/40" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-dm text-xs text-muted-foreground">
            {formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
          </span>
          {linkedGallery && (
            <button onClick={() => onGalleryOpen(linkedGallery.id)} className="flex items-center gap-1 text-primary">
              <Link className="w-3 h-3" />
              <span className="font-dm text-[10px] font-medium">{linkedGallery.title}</span>
            </button>
          )}
        </div>
        <p className={`font-dm text-sm font-medium ${event.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{event.title}</p>
        {event.description && <p className="font-dm text-xs text-muted-foreground mt-0.5">{event.description}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onEdit(event)} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(event.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function WeddingTimeline({ folderId, events, galleries, onGalleryOpen }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: (event) => base44.entities.TimelineEvent.update(event.id, { is_completed: !event.is_completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timeline_events', folderId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TimelineEvent.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timeline_events', folderId] }),
  });

  const sorted = [...events].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  const pending = sorted.filter(e => !e.is_completed);
  const completed = sorted.filter(e => e.is_completed);

  const commonProps = {
    galleries,
    onToggle: (e) => toggleMutation.mutate(e),
    onEdit: (e) => setEditingEvent(e),
    onDelete: (id) => deleteMutation.mutate(id),
    onGalleryOpen,
  };

  return (
    <div className="px-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-vina text-xl text-primary uppercase tracking-widest">Timeline</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-foreground text-xs font-dm font-medium hover:bg-secondary transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Event
        </button>
      </div>

      {/* Pending events */}
      <div className="space-y-2">
        {pending.length === 0 && completed.length === 0 && (
          <p className="font-dm text-xs text-muted-foreground py-4 text-center">
            {'No events yet. Tap "Add Event" to start building the timeline.'}
          </p>
        )}
        {pending.length === 0 && completed.length > 0 && (
          <p className="font-dm text-xs text-muted-foreground py-2 text-center">All events completed! 🎉</p>
        )}
        {pending.map(event => <EventRow key={event.id} event={event} {...commonProps} />)}
      </div>

      {/* Completed section */}
      {completed.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowCompleted(v => !v)}
            className="flex items-center gap-2 mb-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="font-dm text-xs font-medium uppercase tracking-wider">Completed ({completed.length})</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showCompleted ? 'rotate-180' : ''}`} />
          </button>
          {showCompleted && (
            <div className="space-y-2">
              {completed.map(event => <EventRow key={event.id} event={event} {...commonProps} />)}
            </div>
          )}
        </div>
      )}

      <AddTimelineEventDialog
        open={showAdd || !!editingEvent}
        onOpenChange={(v) => { if (!v) { setShowAdd(false); setEditingEvent(null); } }}
        folderId={folderId}
        galleries={galleries}
        editEvent={editingEvent}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['timeline_events', folderId] });
          setShowAdd(false);
          setEditingEvent(null);
        }}
      />
    </div>
  );
}
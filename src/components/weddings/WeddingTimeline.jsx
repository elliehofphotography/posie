import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Clock, ChevronRight, Pencil, Trash2, Link } from 'lucide-react';
import AddTimelineEventDialog from './AddTimelineEventDialog';

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function WeddingTimeline({ folderId, events, galleries, weddingDayMode, onGalleryOpen }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TimelineEvent.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timeline_events', folderId] }),
  });

  const sorted = [...events].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  if (weddingDayMode) {
    return (
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-vina text-2xl text-primary uppercase tracking-widest">Timeline</h2>
        </div>
        <div className="space-y-3">
          {sorted.length === 0 && (
            <p className="font-dm text-sm text-muted-foreground text-center py-8">No events added yet.</p>
          )}
          {sorted.map((event) => {
            const linkedGallery = galleries.find(g => g.id === event.related_gallery_id);
            return (
              <button
                key={event.id}
                className="w-full text-left rounded-2xl border border-border bg-card p-5 active:scale-[0.98] transition-transform"
                onClick={() => linkedGallery && onGalleryOpen(linkedGallery.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-dm text-sm font-semibold text-primary">
                        {formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
                      </span>
                    </div>
                    <p className="font-vina text-xl text-foreground uppercase tracking-wider">{event.title}</p>
                    {event.description && <p className="font-dm text-sm text-muted-foreground mt-1 leading-snug">{event.description}</p>}
                    {linkedGallery && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Link className="w-3 h-3 text-primary" />
                        <span className="font-dm text-xs text-primary font-medium">{linkedGallery.title}</span>
                      </div>
                    )}
                  </div>
                  {linkedGallery && <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5">
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

      <div className="space-y-2">
        {sorted.length === 0 && (
          <p className="font-dm text-xs text-muted-foreground py-4 text-center">No events yet. Tap "Add Event" to start building the timeline.</p>
        )}
        {sorted.map((event) => {
          const linkedGallery = galleries.find(g => g.id === event.related_gallery_id);
          return (
            <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="shrink-0 pt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-dm text-xs text-muted-foreground">
                    {formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
                  </span>
                  {linkedGallery && (
                    <button
                      onClick={() => onGalleryOpen(linkedGallery.id)}
                      className="flex items-center gap-1 text-primary"
                    >
                      <Link className="w-3 h-3" />
                      <span className="font-dm text-[10px] font-medium">{linkedGallery.title}</span>
                    </button>
                  )}
                </div>
                <p className="font-dm text-sm font-medium text-foreground">{event.title}</p>
                {event.description && <p className="font-dm text-xs text-muted-foreground mt-0.5">{event.description}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setEditingEvent(event)} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteMutation.mutate(event.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

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
import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, ChevronRight, Pencil, Trash2, Images } from 'lucide-react';
import AddWeddingGalleryDialog from './AddWeddingGalleryDialog';

const TYPE_LABELS = {
  engagement: 'Engagement',
  bridals: 'Bridals',
  wedding_day: 'Wedding Day',
  reception: 'Reception',
  details: 'Details',
  custom: 'Custom',
};

export default function WeddingGalleriesSection({ folderId, galleries, onGalleryOpen }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editingGallery, setEditingGallery] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WeddingGallery.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wedding_galleries', folderId] }),
  });

  return (
    <div className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-dm text-xl font-bold text-foreground">Galleries</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-foreground text-xs font-dm font-medium hover:bg-secondary transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Gallery
        </button>
      </div>

      <div className="space-y-2">
        {galleries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Images className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="font-dm text-xs text-muted-foreground">No galleries yet. Tap "Add Gallery" to create one.</p>
          </div>
        )}
        {galleries.map((gallery) => (
          <div
            key={gallery.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => onGalleryOpen(gallery.id)}
          >
            <div className="flex-1 min-w-0">
              <p className="font-dm text-sm font-medium text-foreground truncate">{gallery.title}</p>
              <p className="font-dm text-xs text-muted-foreground">{TYPE_LABELS[gallery.type] || gallery.type}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setEditingGallery(gallery); }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(gallery.id); }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>

      <AddWeddingGalleryDialog
        open={showAdd || !!editingGallery}
        onOpenChange={(v) => { if (!v) { setShowAdd(false); setEditingGallery(null); } }}
        folderId={folderId}
        editGallery={editingGallery}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['wedding_galleries', folderId] });
          setShowAdd(false);
          setEditingGallery(null);
        }}
      />
    </div>
  );
}
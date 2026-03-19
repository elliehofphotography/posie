import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

export default function ChangeCoverDialog({ open, onOpenChange, template, onSelect }) {
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['photos', template?.id],
    queryFn: () => base44.entities.TemplatePhoto.filter({ template_id: template.id }, 'sort_order'),
    enabled: !!template?.id && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-vina text-2xl text-primary tracking-widest uppercase">
            Cover Photo
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : photos.length === 0 ? (
          <p className="font-dm text-sm text-muted-foreground text-center py-8">
            No photos in this gallery yet.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 mt-1">
            {photos.map((photo) => {
              const isCurrent = template?.cover_image === photo.image_url;
              return (
                <button
                  key={photo.id}
                  onClick={() => { onSelect(photo.image_url); onOpenChange(false); }}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    isCurrent ? 'border-primary' : 'border-transparent hover:border-primary/50'
                  }`}
                >
                  <img src={photo.image_url} alt="" className="w-full h-full object-cover" />
                  {isCurrent && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
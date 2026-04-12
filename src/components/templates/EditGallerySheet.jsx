import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, X, ImagePlus, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PoseCategoryBar from '../ui/PoseCategoryBar';
import ChangeCoverDialog from './ChangeCoverDialog';

export default function EditGallerySheet({ open, onOpenChange, template }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [name, setName] = useState(template?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) setName(template?.name || '');
  }, [open, template?.name]);

  const renameMutation = useMutation({
    mutationFn: (newName) => base44.entities.ShootTemplate.update(template.id, { name: newName }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['photos', template?.id],
    queryFn: () => base44.entities.TemplatePhoto.filter({ template_id: template.id }, 'sort_order'),
    enabled: !!template?.id && open,
  });

  const deletePhotosMutation = useMutation({
    mutationFn: async (photoIds) => {
      await Promise.all(photoIds.map(id => base44.entities.TemplatePhoto.delete(id)));
      await base44.entities.ShootTemplate.update(template.id, {
        photo_count: Math.max(0, (template.photo_count || 0) - photoIds.length),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', template.id] });
      queryClient.invalidateQueries({ queryKey: ['template', template.id] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSelected([]);
    },
  });

  const handleRemovePhotos = () => {
    deletePhotosMutation.mutate(selected);
  };

  const handleSave = async () => {
    if (name.trim() && name.trim() !== template?.name) {
      setIsSaving(true);
      await renameMutation.mutateAsync(name.trim());
      setIsSaving(false);
      onOpenChange(false);
    } else {
      onOpenChange(false);
    }
  };

  const filteredPhotos = activeCategory 
    ? photos.filter(p => p.pose_category === activeCategory)
    : photos;

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col bg-card border-border rounded-t-3xl">
        <SheetHeader className="border-b border-border pb-3 gap-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-playfair text-foreground">Edit Gallery</SheetTitle>
            <div className="flex gap-2">
              <button
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
                className="h-8 px-3 rounded-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 font-dm text-xs font-medium"
              >
                <Check className="w-3.5 h-3.5" />
                Save
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Gallery name"
              className="bg-muted border-border font-dm text-sm flex-1"
            />
            <button
              onClick={() => setShowCoverPicker(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-secondary text-foreground font-dm text-xs font-medium transition-colors shrink-0"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              Cover
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {photos.length > 0 && (
            <PoseCategoryBar activeCategory={activeCategory} onChange={setActiveCategory} />
          )}

          <div className="p-4">
            {isLoading ? (
              <div className="columns-2 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="break-inside-avoid mb-3 aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : filteredPhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="font-dm text-muted-foreground text-sm">No photos in this gallery</p>
              </div>
            ) : (
              <div className="columns-2 gap-3">
                {filteredPhotos.map(photo => (
                  <button
                    key={photo.id}
                    onClick={() => toggleSelect(photo.id)}
                    className={`break-inside-avoid mb-3 relative rounded-2xl overflow-hidden transition-all ${
                      selected.includes(photo.id) ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <img
                      src={photo.image_url}
                      alt={photo.description || 'Photo'}
                      className="w-full h-auto block"
                    />
                    {selected.includes(photo.id) && (
                      <div className="absolute inset-0 bg-primary/30" />
                    )}
                    {selected.includes(photo.id) && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                        <X className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selected.length > 0 && (
          <div className="border-t border-border p-4">
            <Button
              onClick={handleRemovePhotos}
              disabled={deletePhotosMutation.isPending}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deletePhotosMutation.isPending ? 'Removing...' : `Remove (${selected.length})`}
            </Button>
          </div>
        )}
      </SheetContent>

      {showCoverPicker && (
        <ChangeCoverDialog
          open={showCoverPicker}
          onOpenChange={setShowCoverPicker}
          template={template}
          onSelect={(imageUrl) => {
            base44.entities.ShootTemplate.update(template.id, { cover_image: imageUrl });
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            setShowCoverPicker(false);
          }}
        />
      )}
    </Sheet>
  );
}
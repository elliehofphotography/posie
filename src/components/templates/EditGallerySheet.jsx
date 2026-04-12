import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { X, ImagePlus, Check } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ChangeCoverDialog from './ChangeCoverDialog';

export default function EditGallerySheet({ open, onOpenChange, template }) {
  const queryClient = useQueryClient();
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto flex flex-col bg-card border-border rounded-t-3xl p-5">
        <SheetHeader className="border-b border-border pb-4 gap-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-playfair text-foreground">Edit Gallery</SheetTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
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

        <div className="border-t border-border mt-4 pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="w-full py-3 rounded-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 font-dm font-medium"
          >
            <Check className="w-4 h-4" />
            Save
          </button>
        </div>

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
      </SheetContent>
    </Sheet>
  );
}
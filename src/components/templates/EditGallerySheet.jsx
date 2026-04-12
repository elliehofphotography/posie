import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, ImagePlus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ChangeCoverDialog from './ChangeCoverDialog';

export default function EditGallerySheet({ open, onOpenChange, template }) {
  const queryClient = useQueryClient();
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && template) {
      setName(template.name || '');
      setDescription(template.description || '');
    }
  }, [open, template]);

  const renameMutation = useMutation({
    mutationFn: (data) => base44.entities.ShootTemplate.update(template.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const handleSave = async () => {
    if (name.trim()) {
      setIsSaving(true);
      await renameMutation.mutateAsync({ name: name.trim(), description });
      setIsSaving(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background border-border rounded-lg p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <div className="relative">
          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Title */}
            <h2 className="text-center font-vina text-2xl uppercase tracking-widest text-primary">
              Name Your Template
            </h2>

            {/* Cover selector */}
            <button
              onClick={() => setShowCoverPicker(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-full bg-muted hover:bg-secondary text-foreground font-dm text-sm transition-colors"
            >
              <ImagePlus className="w-5 h-5" />
              <span>Photo Gallery</span>
              <span className="ml-auto font-semibold">Change</span>
            </button>

            {/* Template Name */}
            <div className="space-y-2">
              <label className="font-dm text-xs uppercase tracking-wider text-primary font-semibold">
                Template Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Couples Sunset Shoot"
                className="bg-muted border-muted text-foreground placeholder:text-muted-foreground font-dm rounded-2xl h-12 px-4"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="font-dm text-xs uppercase tracking-wider text-primary font-semibold">
                Description (Optional)
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief concept description…"
                className="bg-muted border-muted text-foreground placeholder:text-muted-foreground font-dm rounded-2xl p-4 resize-none h-24"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 font-dm font-semibold text-sm"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>

            {/* Back Button */}
            <button
              onClick={() => onOpenChange(false)}
              className="w-full py-2 text-center text-foreground font-dm text-sm hover:opacity-70 transition-opacity"
            >
              Back
            </button>
          </div>
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
      </DialogContent>
    </Dialog>
  );
}
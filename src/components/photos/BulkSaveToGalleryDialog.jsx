import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderPlus, Loader2, X, CheckCircle2 } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function BulkSaveToGalleryDialog({ open, onOpenChange, imageUrls = [], photos = [], galleries, onDone }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState('pick'); // 'pick' | 'create'
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleClose = (v) => {
    if (!v) { setMode('pick'); setNewName(''); setDone(false); }
    onOpenChange(v);
  };

  const saveToTemplate = async (templateId, targetGallery) => {
    setSaving(true);
    const existing = await base44.entities.TemplatePhoto.filter({ template_id: templateId }, 'sort_order');
    let offset = existing.length;

    for (const url of imageUrls) {
      const photo = photos.find(p => p.image_url === url) || {};
      await base44.entities.TemplatePhoto.create({
        template_id: templateId,
        image_url: url,
        description: photo.description || '',
        pose_category: photo.pose_category || '',
        color_priority: photo.color_priority || 'green',
        lens_suggestion: photo.lens_suggestion || '',
        aperture_suggestion: photo.aperture_suggestion || '',
        lighting_notes: photo.lighting_notes || '',
        camera_angle: photo.camera_angle || '',
        sort_order: offset++,
      });
    }

    await base44.entities.ShootTemplate.update(templateId, {
      photo_count: offset,
      cover_image: existing.length === 0 && imageUrls[0] ? imageUrls[0] : targetGallery?.cover_image,
    });

    queryClient.invalidateQueries({ queryKey: ['templates'] });
    queryClient.invalidateQueries({ queryKey: ['all_photos'] });
    setSaving(false);
    setDone(true);
  };

  const handleSaveToExisting = (gallery) => {
    saveToTemplate(gallery.id, gallery);
  };

  const handleCreateNew = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    const newTemplate = await base44.entities.ShootTemplate.create({
      name,
      template_type: 'gallery',
      photo_count: 0,
    });
    await saveToTemplate(newTemplate.id, null);
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="bg-card border-border max-h-[85vh] flex flex-col">
        <DrawerHeader className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border shrink-0">
          <DrawerTitle className="font-vina text-xl text-primary tracking-widest uppercase">
            Add {imageUrls.length} Photo{imageUrls.length !== 1 ? 's' : ''} to Gallery
          </DrawerTitle>
          <button
            onClick={() => handleClose(false)}
            className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {done ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <p className="font-dm text-sm text-foreground font-medium">
                {imageUrls.length} photo{imageUrls.length !== 1 ? 's' : ''} added!
              </p>
              <button onClick={() => { handleClose(false); onDone?.(); }} className="font-dm text-xs text-primary hover:underline">
                Done
              </button>
            </div>
          ) : mode === 'pick' ? (
            <div className="space-y-2">
              {/* Create new */}
              <button
                onClick={() => setMode('create')}
                disabled={saving}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-border hover:border-primary/40 bg-card transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <FolderPlus className="w-4 h-4 text-primary" />
                </div>
                <p className="font-dm text-sm font-medium text-primary">Create new gallery…</p>
              </button>

              {galleries.length > 0 && (
                <>
                  <div className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-border" />
                    <span className="font-dm text-[10px] uppercase tracking-[0.15em] text-muted-foreground">or pick existing</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  {galleries.map(g => (
                    <button
                      key={g.id}
                      onClick={() => handleSaveToExisting(g)}
                      disabled={saving}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-border hover:border-primary/40 bg-card transition-all text-left"
                    >
                      {g.cover_image ? (
                        <img src={g.cover_image} alt={g.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <FolderPlus className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-dm text-sm font-medium text-foreground truncate">{g.name}</p>
                        <p className="font-dm text-[11px] text-muted-foreground">{g.photo_count || 0} photos</p>
                      </div>
                      {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
                    </button>
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Gallery Name</Label>
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Couples Summer Shoot"
                  className="bg-muted border-border font-dm"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="font-dm flex-1" onClick={() => setMode('pick')}>Back</Button>
                <Button
                  disabled={!newName.trim() || saving}
                  onClick={handleCreateNew}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-dm rounded-full px-6 flex-1"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create & Save'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
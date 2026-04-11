import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BottomSheetSelect from '@/components/ui/BottomSheetSelect';
import { useQuery } from '@tanstack/react-query';

const TYPES = [
  { value: 'engagement', label: 'Engagement' },
  { value: 'bridals', label: 'Bridals' },
  { value: 'wedding_day', label: 'Wedding Day' },
  { value: 'reception', label: 'Reception' },
  { value: 'details', label: 'Details' },
  { value: 'custom', label: 'Custom' },
];

const EMPTY = { title: '', type: 'custom', notes: '', template_id: '', is_visible_to_client: false };

export default function AddWeddingGalleryDialog({ open, onOpenChange, folderId, editGallery, onSuccess }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ShootTemplate.list('-created_date'),
  });

  const galleryTemplates = templates.filter(t => t.template_type !== 'shot_list');

  useEffect(() => {
    if (editGallery) {
      setForm({
        title: editGallery.title || '',
        type: editGallery.type || 'custom',
        notes: editGallery.notes || '',
        template_id: editGallery.template_id || '',
        is_visible_to_client: editGallery.is_visible_to_client || false,
      });
    } else {
      setForm(EMPTY);
    }
  }, [editGallery, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = { ...form, folder_id: folderId };
    if (!payload.template_id) delete payload.template_id;
    if (editGallery) {
      await base44.entities.WeddingGallery.update(editGallery.id, payload);
    } else {
      await base44.entities.WeddingGallery.create(payload);
    }
    setSaving(false);
    onSuccess?.();
  };

  const templateOptions = [
    { value: '', label: 'None (standalone)' },
    ...galleryTemplates.map(t => ({ value: t.id, label: t.name })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary text-2xl font-extralight uppercase tracking-widest">
            {editGallery ? 'Edit Gallery' : 'Add Gallery'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Title *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Bridal Portraits" className="bg-muted border-border font-dm" />
          </div>

          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Type</Label>
            <BottomSheetSelect
              label="Type"
              value={form.type}
              onChange={(v) => set('type', v)}
              options={TYPES}
              placeholder="Select type"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Link to Template (optional)</Label>
            <BottomSheetSelect
              label="Template"
              value={form.template_id}
              onChange={(v) => set('template_id', v)}
              options={templateOptions}
              placeholder="None"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes for this gallery..." className="bg-muted border-border h-16 resize-none font-dm" />
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="ghost" className="font-dm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!form.title.trim() || saving} className="bg-primary text-primary-foreground font-dm rounded-full px-6">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editGallery ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
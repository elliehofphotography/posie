import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BottomSheetSelect from '@/components/ui/BottomSheetSelect';

const EMPTY = { title: '', start_time: '', end_time: '', description: '', related_gallery_id: '' };

export default function AddTimelineEventDialog({ open, onOpenChange, folderId, galleries, editEvent, onSuccess }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editEvent) {
      setForm({
        title: editEvent.title || '',
        start_time: editEvent.start_time || '',
        end_time: editEvent.end_time || '',
        description: editEvent.description || '',
        related_gallery_id: editEvent.related_gallery_id || '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [editEvent, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.start_time) return;
    setSaving(true);
    const payload = { ...form, folder_id: folderId };
    if (!payload.end_time) delete payload.end_time;
    if (!payload.related_gallery_id) delete payload.related_gallery_id;
    if (editEvent) {
      await base44.entities.TimelineEvent.update(editEvent.id, payload);
    } else {
      await base44.entities.TimelineEvent.create(payload);
    }
    setSaving(false);
    onSuccess?.();
  };

  const galleryOptions = [
    { value: '', label: 'None' },
    ...galleries.map(g => ({ value: g.id, label: g.title })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary text-2xl font-extralight uppercase tracking-widest">
            {editEvent ? 'Edit Event' : 'Add Event'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Title *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Ceremony" className="bg-muted border-border font-dm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Start Time *</Label>
              <Input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} className="bg-muted border-border font-dm" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">End Time</Label>
              <Input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} className="bg-muted border-border font-dm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Notes</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Location, notes..." className="bg-muted border-border h-16 resize-none font-dm" />
          </div>

          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Link to Gallery</Label>
            <BottomSheetSelect
              label="Gallery"
              value={form.related_gallery_id}
              onChange={(v) => set('related_gallery_id', v)}
              options={galleryOptions}
              placeholder="None"
            />
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="ghost" className="font-dm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!form.title.trim() || !form.start_time || saving} className="bg-primary text-primary-foreground font-dm rounded-full px-6">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editEvent ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
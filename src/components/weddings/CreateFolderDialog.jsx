import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const EMPTY = { title: '', date: '', description: '' };

export default function CreateFolderDialog({ open, onOpenChange, editFolder, onSuccess }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editFolder) {
      setForm({
        title: editFolder.title || '',
        date: editFolder.date || '',
        description: editFolder.description || '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [editFolder, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    if (editFolder) {
      await base44.entities.WeddingFolder.update(editFolder.id, form);
    } else {
      await base44.entities.WeddingFolder.create(form);
    }
    setSaving(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary text-2xl font-extralight uppercase tracking-widest">
            {editFolder ? 'Edit Folder' : 'New Wedding'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Client / Title *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Sarah & James" className="bg-muted border-border font-dm" />
          </div>

          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Wedding Date</Label>
            <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="bg-muted border-border font-dm" />
          </div>

          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Notes</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Venue, style notes, contact info..." className="bg-muted border-border h-20 resize-none font-dm" />
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="ghost" className="font-dm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!form.title.trim() || saving} className="bg-primary text-primary-foreground font-dm rounded-full px-6">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editFolder ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
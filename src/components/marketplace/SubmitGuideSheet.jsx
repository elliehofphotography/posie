import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CATEGORIES = ['Wedding', 'Engagement', 'Portrait', 'Family', 'Fashion', 'Graduation', 'Newborn', 'Boudoir', 'Other'];

export default function SubmitGuideSheet({ open, onOpenChange, onSubmit }) {
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    cover_image: '',
  });

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update('cover_image', file_url);
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category) return;
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
    setForm({ name: '', description: '', category: '', price: '', cover_image: '' });
    onOpenChange(false);
  };

  const valid = form.name.trim() && form.category;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-border max-h-[92vh]">
        <DrawerHeader className="flex items-center justify-between pb-2">
          <DrawerTitle className="font-playfair text-xl text-foreground">Submit Your Guide</DrawerTitle>
          <DrawerClose asChild>
            <button className="h-8 w-8 rounded-full bg-muted flex items-center justify-center select-none">
              <X className="w-4 h-4" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-4 pb-4 space-y-4">

          {/* Cover image */}
          {form.cover_image ? (
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-muted">
              <img src={form.cover_image} alt="Cover" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => update('cover_image', '')}
                className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full bg-black/50 text-white font-dm text-xs"
              >
                Change
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-[16/9] rounded-2xl border-2 border-dashed border-border bg-muted/50 cursor-pointer hover:border-primary/40 transition-colors">
              {uploading ? (
                <div className="w-6 h-6 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground mb-1.5" />
                  <span className="font-dm text-sm text-muted-foreground">Upload cover image</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          )}

          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Guide Title *</Label>
            <Input
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="e.g. 50 Golden Hour Couples Poses"
              className="bg-muted border-border font-dm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Description</Label>
            <Textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="What's included in your guide?"
              className="bg-muted border-border h-20 resize-none font-dm text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Category *</Label>
              <Select value={form.category} onValueChange={v => update('category', v)}>
                <SelectTrigger className="bg-muted border-border font-dm text-sm">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border font-dm">
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Price (USD)</Label>
              <Input
                value={form.price}
                onChange={e => update('price', e.target.value)}
                placeholder="e.g. 4.99 or Free"
                className="bg-muted border-border font-dm text-sm"
              />
            </div>
          </div>

          <p className="font-dm text-[11px] text-muted-foreground leading-relaxed bg-muted rounded-xl px-3 py-2.5">
            Submissions are reviewed before going live. You'll be notified once your guide is approved and published to the marketplace.
          </p>

          <DrawerFooter className="px-0 pt-2">
            <button
              type="submit"
              disabled={!valid || submitting}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-dm text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 select-none"
            >
              {submitting ? 'Submitting…' : 'Submit for Review'}
            </button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CATEGORIES = ['Wedding', 'Engagement', 'Portrait', 'Family', 'Fashion', 'Graduation', 'Newborn', 'Boudoir', 'Other'];

function ImageUploadField({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange(file_url);
    setUploading(false);
  };
  return (
    <div className="space-y-1.5">
      <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">{label}</Label>
      {value ? (
        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button type="button" onClick={() => onChange('')} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-border bg-muted/50 cursor-pointer hover:border-primary/40 transition-colors">
          {uploading ? (
            <div className="w-5 h-5 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
          ) : (
            <>
              <Upload className="w-5 h-5 text-muted-foreground mb-1" />
              <span className="font-dm text-xs text-muted-foreground">Upload image</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      )}
    </div>
  );
}

export default function AdminGuideSheet({ open, onOpenChange, onSaved, listing = null }) {
  const isEditing = !!listing;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', author: '', category: '',
    price: '', cover_image: '', preview_image_1: '', preview_image_2: '',
  });

  // Populate form when editing
  React.useEffect(() => {
    if (listing) {
      setForm({
        name: listing.name || '',
        description: listing.description || '',
        author: listing.author || '',
        category: listing.category || '',
        price: listing.price != null ? String(listing.price) : '',
        cover_image: listing.cover_image || '',
        preview_image_1: listing.preview_image_1 || '',
        preview_image_2: listing.preview_image_2 || '',
      });
    } else {
      setForm({ name: '', description: '', author: '', category: '', price: '', cover_image: '', preview_image_1: '', preview_image_2: '' });
    }
  }, [listing, open]);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    const data = { ...form, price: parseFloat(form.price) || 0, is_published: true };
    if (isEditing) {
      await base44.entities.MarketplaceListing.update(listing.id, data);
    } else {
      await base44.entities.MarketplaceListing.create(data);
    }
    setSubmitting(false);
    onOpenChange(false);
    onSaved();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-border max-h-[92vh]">
        <DrawerHeader className="flex items-center justify-between pb-2">
          <DrawerTitle className="font-playfair text-xl text-foreground">{isEditing ? 'Edit Guide' : 'Add New Guide'}</DrawerTitle>
          <DrawerClose asChild>
            <button className="h-8 w-8 rounded-full bg-muted flex items-center justify-center select-none">
              <X className="w-4 h-4" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-4 pb-4 space-y-4">
          <ImageUploadField label="Cover Image" value={form.cover_image} onChange={v => update('cover_image', v)} />

          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Title *</Label>
            <Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. 50 Golden Hour Couples Poses" className="bg-muted border-border font-dm" />
          </div>

          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Author</Label>
            <Input value={form.author} onChange={e => update('author', e.target.value)} placeholder="e.g. Studio Elite" className="bg-muted border-border font-dm" />
          </div>

          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Description</Label>
            <Textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="What's included in this guide?" className="bg-muted border-border h-20 resize-none font-dm text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Category</Label>
              <Select value={form.category} onValueChange={v => update('category', v)}>
                <SelectTrigger className="bg-muted border-border font-dm text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-card border-border font-dm">
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Price (USD)</Label>
              <Input value={form.price} onChange={e => update('price', e.target.value)} placeholder="e.g. 4.99 or 0" className="bg-muted border-border font-dm text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ImageUploadField label="Pose Preview 1" value={form.preview_image_1} onChange={v => update('preview_image_1', v)} />
            <ImageUploadField label="Pose Preview 2" value={form.preview_image_2} onChange={v => update('preview_image_2', v)} />
          </div>

          <DrawerFooter className="px-0 pt-2">
            <button
              type="submit"
              disabled={!form.name.trim() || submitting}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-dm text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 select-none"
            >
              {submitting ? 'Publishing…' : 'Publish Guide'}
            </button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
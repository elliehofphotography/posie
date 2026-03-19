import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ImagePlus, Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CATEGORIES = [
'Wedding', 'Bridal', 'Couples', 'Portrait', 'Graduation', 'Maternity',
'Newborn', 'Family', 'Fashion', 'Boudoir', 'Engagement', 'Other'];


const POSE_CATEGORIES = [
  { value: 'standing', label: 'Standing' },
  { value: 'sitting', label: 'Sitting' },
  { value: 'walking', label: 'Walking' },
  { value: 'close_up', label: 'Close-up' },
  { value: 'wide_shot', label: 'Wide Shot' },
  { value: 'detail', label: 'Detail' },
  { value: 'interaction', label: 'Interaction' },
  { value: 'candid', label: 'Candid' },
  { value: 'other', label: 'Other' },
];

const EMPTY = {
  image_url: '',
  category: '',
  pose_category: '',
  title: '',
  description: '',
  photographer_name: '',
  lens: '',
  aperture: '',
  lighting_notes: '',
  owns_copyright: false
};

export default function AddDiscoverPostDialog({ open, onOpenChange, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('image_url', file_url);
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.image_url || !form.category || !form.owns_copyright) return;
    onSubmit(form);
    setForm(EMPTY);
    setPreview(null);
  };

  const handleClose = (val) => {
    if (!val) {setForm(EMPTY);setPreview(null);}
    onOpenChange(val);
  };

  const canSubmit = form.image_url && form.category && form.owns_copyright && !uploading;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary text-2xl font-extralight uppercase tracking-widest">SHARE A PHOTO</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div>
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider mb-1.5 block">Photo *</Label>
            <label className="block cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
              <div className={`w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden transition-colors hover:border-primary/50 ${preview ? 'border-solid border-primary/30' : ''}`}>
                {uploading ?
                <Loader2 className="w-7 h-7 text-muted-foreground animate-spin" /> :
                preview ?
                <img src={preview} alt="preview" className="w-full h-full object-cover" /> :

                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImagePlus className="w-8 h-8" />
                    <span className="font-dm text-xs">Tap to upload</span>
                  </div>
                }
              </div>
            </label>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Category *</Label>
            <Select value={form.category} onValueChange={(v) => set('category', v)}>
              <SelectTrigger className="bg-muted border-border font-dm">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Shot Type / Pose Category */}
          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Shot Type</Label>
            <Select value={form.pose_category} onValueChange={(v) => set('pose_category', v)}>
              <SelectTrigger className="bg-muted border-border font-dm">
                <SelectValue placeholder="e.g. Standing, Sitting..." />
              </SelectTrigger>
              <SelectContent>
                {POSE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Title / Caption</Label>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Golden hour portrait"
              className="bg-muted border-border font-dm" />
            
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Shot Details</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Pose instructions, location, mood..."
              className="bg-muted border-border h-20 resize-none font-dm" />
            
          </div>

          {/* Photographer name */}
          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Your Name / Handle</Label>
            <Input
              value={form.photographer_name}
              onChange={(e) => set('photographer_name', e.target.value)}
              placeholder="e.g. @janedoe"
              className="bg-muted border-border font-dm" />
            
          </div>

          {/* Technical details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Lens</Label>
              <Input value={form.lens} onChange={(e) => set('lens', e.target.value)} placeholder="e.g. 85mm f/1.8" className="bg-muted border-border font-dm" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Aperture</Label>
              <Input value={form.aperture} onChange={(e) => set('aperture', e.target.value)} placeholder="e.g. f/2.0" className="bg-muted border-border font-dm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Lighting Notes</Label>
            <Input value={form.lighting_notes} onChange={(e) => set('lighting_notes', e.target.value)} placeholder="e.g. Natural backlight, reflector" className="bg-muted border-border font-dm" />
          </div>

          {/* IP Confirmation */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/8 border border-primary/20">
            <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-dm text-xs text-foreground leading-relaxed mb-3">
                By submitting, you confirm that <strong>you are the original photographer</strong> and hold full intellectual property rights to this image. Do not submit work that is not your own.
              </p>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ip-confirm"
                  checked={form.owns_copyright}
                  onCheckedChange={(v) => set('owns_copyright', !!v)} />
                
                <label htmlFor="ip-confirm" className="font-dm text-xs text-foreground cursor-pointer">
                  I confirm this is my original photo *
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="ghost" className="font-dm" onClick={() => handleClose(false)}>Cancel</Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-dm rounded-full px-6">
              
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Share'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>);

}
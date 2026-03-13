import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CATEGORIES = [
  { value: 'standing', label: 'Standing' },
  { value: 'sitting', label: 'Sitting' },
  { value: 'walking', label: 'Walking' },
  { value: 'close_up', label: 'Close-up' },
  { value: 'wide_shot', label: 'Wide Shot' },
  { value: 'detail', label: 'Detail' },
  { value: 'interaction', label: 'Interaction' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES = [
  { value: 'red', label: 'Must Capture', color: 'bg-red-500' },
  { value: 'yellow', label: 'Recommended', color: 'bg-yellow-500' },
  { value: 'green', label: 'Optional', color: 'bg-green-500' },
];

export default function AddPhotoDialog({ open, onOpenChange, onSubmit, editPhoto = null }) {
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(editPhoto || {
    image_url: '',
    description: '',
    pose_category: 'standing',
    color_priority: 'green',
    lens_suggestion: '',
    aperture_suggestion: '',
    lighting_notes: '',
    camera_angle: '',
    technical_notes: '',
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, image_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.image_url) return;
    onSubmit(form);
    if (!editPhoto) {
      setForm({
        image_url: '',
        description: '',
        pose_category: 'standing',
        color_priority: 'green',
        lens_suggestion: '',
        aperture_suggestion: '',
        lighting_notes: '',
        camera_angle: '',
        technical_notes: '',
      });
    }
  };

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">{editPhoto ? 'Edit Photo' : 'Add Inspiration Photo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image upload */}
          {form.image_url ? (
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-secondary">
              <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute bottom-2 right-2 bg-black/50 text-white hover:bg-black/70"
                onClick={() => update('image_url', '')}
              >
                Change
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-[4/3] rounded-xl border-2 border-dashed border-border bg-secondary/50 cursor-pointer hover:border-primary/50 transition-colors">
              {uploading ? (
                <div className="w-6 h-6 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload photo</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Pose Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Describe the pose or instructions..."
              className="bg-secondary border-border h-16 resize-none text-sm"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Category</Label>
              <Select value={form.pose_category} onValueChange={(v) => update('pose_category', v)}>
                <SelectTrigger className="bg-secondary border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Priority</Label>
              <Select value={form.color_priority} onValueChange={(v) => update('color_priority', v)}>
                <SelectTrigger className="bg-secondary border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {PRIORITIES.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                        {p.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Technical Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Lens</Label>
              <Input value={form.lens_suggestion} onChange={(e) => update('lens_suggestion', e.target.value)} placeholder="e.g. 85mm" className="bg-secondary border-border text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Aperture</Label>
              <Input value={form.aperture_suggestion} onChange={(e) => update('aperture_suggestion', e.target.value)} placeholder="e.g. f/1.8" className="bg-secondary border-border text-sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Camera Angle</Label>
            <Input value={form.camera_angle} onChange={(e) => update('camera_angle', e.target.value)} placeholder="e.g. Low angle, eye level" className="bg-secondary border-border text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Lighting Notes</Label>
            <Input value={form.lighting_notes} onChange={(e) => update('lighting_notes', e.target.value)} placeholder="e.g. Golden hour backlight" className="bg-secondary border-border text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Other Technical Notes</Label>
            <Textarea value={form.technical_notes} onChange={(e) => update('technical_notes', e.target.value)} placeholder="Any other notes..." className="bg-secondary border-border h-14 resize-none text-sm" />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!form.image_url} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {editPhoto ? 'Save Changes' : 'Add Photo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
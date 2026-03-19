import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getUserPoseCategories } from '@/lib/poseCategories';

const PRIORITIES = [
  { value: 'red', label: 'Must Capture', color: 'bg-red-500' },
  { value: 'yellow', label: 'Recommended', color: 'bg-yellow-400' },
  { value: 'green', label: 'Optional', color: 'bg-green-500' },
];

export default function AddPhotoDialog({ open, onOpenChange, onSubmit, editPhoto = null }) {
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(editPhoto || {
    image_url: '',
    description: '',
    pose_category: '',
    color_priority: 'green',
    lens_suggestion: '',
    aperture_suggestion: '',
    lighting_notes: '',
    camera_angle: '',
    technical_notes: '',
  });

  useEffect(() => {
    if (open) {
      base44.auth.me().then(u => {
        const cats = getUserPoseCategories(u?.pose_categories);
        setCategories(cats);
        if (!editPhoto && cats.length > 0 && !form.pose_category) {
          setForm(prev => ({ ...prev, pose_category: cats[0].value }));
        }
      }).catch(() => {
        const cats = getUserPoseCategories(null);
        setCategories(cats);
        if (!editPhoto && cats.length > 0 && !form.pose_category) {
          setForm(prev => ({ ...prev, pose_category: cats[0].value }));
        }
      });
    }
  }, [open]);

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
      setForm({ image_url: '', description: '', pose_category: 'standing', color_priority: 'green', lens_suggestion: '', aperture_suggestion: '', lighting_notes: '', camera_angle: '', technical_notes: '' });
    }
  };

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-playfair text-xl text-foreground">
            {editPhoto ? 'Edit Photo' : 'Add Inspiration Photo'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Image upload */}
          {form.image_url ? (
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
              <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-full bg-black/50 text-white font-dm text-xs hover:bg-black/70 transition-colors"
                onClick={() => update('image_url', '')}
              >
                Change
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-[4/3] rounded-2xl border-2 border-dashed border-border bg-muted/50 cursor-pointer hover:border-primary/40 transition-colors">
              {uploading ? (
                <div className="w-6 h-6 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-7 h-7 text-muted-foreground mb-2" />
                  <span className="font-dm text-sm text-muted-foreground">Upload photo</span>
                  <span className="font-dm text-xs text-muted-foreground/60 mt-0.5">or paste a URL below</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          )}

          {!form.image_url && (
            <Input
              value={form.image_url}
              onChange={(e) => update('image_url', e.target.value)}
              placeholder="https://... or upload above"
              className="bg-muted border-border font-dm text-sm"
            />
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Pose Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Describe the pose or instructions..."
              className="bg-muted border-border h-16 resize-none font-dm text-sm"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Category</Label>
              <Select value={form.pose_category} onValueChange={(v) => update('pose_category', v)}>
                <SelectTrigger className="bg-muted border-border font-dm text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border font-dm">
                  {categories.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Priority</Label>
              <Select value={form.color_priority} onValueChange={(v) => update('color_priority', v)}>
                <SelectTrigger className="bg-muted border-border font-dm text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border font-dm">
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
              <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Lens</Label>
              <Input value={form.lens_suggestion} onChange={(e) => update('lens_suggestion', e.target.value)} placeholder="e.g. 85mm" className="bg-muted border-border font-dm text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Aperture</Label>
              <Input value={form.aperture_suggestion} onChange={(e) => update('aperture_suggestion', e.target.value)} placeholder="e.g. f/1.8" className="bg-muted border-border font-dm text-sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Camera Angle</Label>
            <Input value={form.camera_angle} onChange={(e) => update('camera_angle', e.target.value)} placeholder="e.g. Low angle, eye level" className="bg-muted border-border font-dm text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Lighting Notes</Label>
            <Input value={form.lighting_notes} onChange={(e) => update('lighting_notes', e.target.value)} placeholder="e.g. Golden hour backlight" className="bg-muted border-border font-dm text-sm" />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" className="font-dm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              type="submit"
              disabled={!form.image_url}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-dm rounded-full px-6"
            >
              {editPhoto ? 'Save Changes' : 'Add Photo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
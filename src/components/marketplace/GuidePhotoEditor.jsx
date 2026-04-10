import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react';

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

const PRIORITY_COLORS = [
  { value: 'green', label: 'Normal', dot: 'bg-green-500' },
  { value: 'yellow', label: 'Important', dot: 'bg-yellow-500' },
  { value: 'red', label: 'Must Have', dot: 'bg-red-500' },
];

const EMPTY_PHOTO = {
  image_url: '', description: '', pose_category: '', lens_suggestion: '',
  aperture_suggestion: '', lighting_notes: '', camera_angle: '', color_priority: 'green',
};

function PhotoFormCard({ photo, onSave, onDelete, isNew = false }) {
  const [expanded, setExpanded] = useState(isNew);
  const [form, setForm] = useState({ ...EMPTY_PHOTO, ...photo });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update('image_url', file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.image_url) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    if (isNew) setForm({ ...EMPTY_PHOTO });
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 p-3">
        {form.image_url ? (
          <img src={form.image_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Upload className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-dm text-sm font-medium text-foreground truncate">
            {form.description || (isNew ? 'New photo' : 'Untitled')}
          </p>
          {form.pose_category && (
            <p className="font-dm text-xs text-muted-foreground capitalize">{form.pose_category.replace('_', ' ')}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!isNew && onDelete && (
            <button type="button" onClick={onDelete} className="h-8 w-8 rounded-full hover:bg-destructive/10 flex items-center justify-center text-destructive transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button type="button" onClick={() => setExpanded(e => !e)} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded form */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
          {/* Image upload */}
          {!form.image_url ? (
            <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-border bg-muted/50 cursor-pointer hover:border-primary/40 transition-colors">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="font-dm text-xs text-muted-foreground">Upload photo</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          ) : (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
              <img src={form.image_url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => update('image_url', '')}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                <Trash2 className="w-3 h-3 text-white" />
              </button>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Pose Description</Label>
            <Textarea value={form.description} onChange={e => update('description', e.target.value)}
              placeholder="Describe the pose and what the client should do…"
              className="bg-muted border-border h-16 resize-none font-dm text-xs" />
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Category</Label>
              <Select value={form.pose_category} onValueChange={v => update('pose_category', v)}>
                <SelectTrigger className="bg-muted border-border font-dm text-xs h-8"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-card border-border font-dm">
                  {POSE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Priority</Label>
              <Select value={form.color_priority} onValueChange={v => update('color_priority', v)}>
                <SelectTrigger className="bg-muted border-border font-dm text-xs h-8"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border font-dm">
                  {PRIORITY_COLORS.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Camera angle */}
          <div className="space-y-1">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Camera Angle</Label>
            <Input value={form.camera_angle} onChange={e => update('camera_angle', e.target.value)}
              placeholder="e.g. Eye level, Low angle, Bird's eye"
              className="bg-muted border-border font-dm text-xs h-8" />
          </div>

          {/* Lens + Aperture */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Lens</Label>
              <Input value={form.lens_suggestion} onChange={e => update('lens_suggestion', e.target.value)}
                placeholder="e.g. 85mm" className="bg-muted border-border font-dm text-xs h-8" />
            </div>
            <div className="space-y-1">
              <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Camera Settings (ISO, F/, SS)</Label>
              <Input value={form.aperture_suggestion} onChange={e => update('aperture_suggestion', e.target.value)}
                placeholder="e.g. f/1.8" className="bg-muted border-border font-dm text-xs h-8" />
            </div>
          </div>

          {/* Lighting */}
          <div className="space-y-1">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Lighting Notes</Label>
            <Textarea value={form.lighting_notes} onChange={e => update('lighting_notes', e.target.value)}
              placeholder="e.g. Backlit golden hour, reflector on left…"
              className="bg-muted border-border h-14 resize-none font-dm text-xs" />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!form.image_url || saving}
            className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-dm text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : isNew ? 'Add Photo' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function GuidePhotoEditor({ listingId }) {
  const queryClient = useQueryClient();

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['guide_photos', listingId],
    queryFn: () => base44.entities.GuidePhoto.filter({ listing_id: listingId }, 'sort_order'),
    enabled: !!listingId,
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.GuidePhoto.create({ ...data, listing_id: listingId, sort_order: photos.length }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guide_photos', listingId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GuidePhoto.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guide_photos', listingId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GuidePhoto.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guide_photos', listingId] }),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">
          Guide Photos ({photos.length})
        </Label>
        <span className="font-dm text-[10px] text-muted-foreground">Visible to buyers only</span>
      </div>

      {isLoading ? (
        <div className="h-16 rounded-2xl bg-muted animate-pulse" />
      ) : (
        <>
          {photos.map((photo) => (
            <PhotoFormCard
              key={photo.id}
              photo={photo}
              onSave={(data) => updateMutation.mutateAsync({ id: photo.id, data })}
              onDelete={() => deleteMutation.mutate(photo.id)}
            />
          ))}

          {/* Add new photo card */}
          <div className="rounded-2xl border-2 border-dashed border-border overflow-hidden">
            <div className="flex items-center gap-2 p-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <span className="font-dm text-sm text-muted-foreground font-medium">Add a photo to the guide</span>
            </div>
            <div className="px-3 pb-3 border-t border-border pt-3">
              <PhotoFormCard
                isNew
                photo={{}}
                onSave={(data) => addMutation.mutateAsync(data)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
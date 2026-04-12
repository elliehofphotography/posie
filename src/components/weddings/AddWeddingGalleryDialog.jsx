import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BottomSheetSelect from '@/components/ui/BottomSheetSelect';
import CreateTemplateDialog from '@/components/templates/CreateTemplateDialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const BASE_TYPES = [
  { value: 'engagement', label: 'Engagement' },
  { value: 'bridals', label: 'Bridals' },
  { value: 'wedding_day', label: 'Wedding Day' },
  { value: 'reception', label: 'Reception' },
  { value: 'details', label: 'Details' },
];

const CUSTOM_TYPES_KEY = 'wedding_gallery_custom_types';

function loadCustomTypes() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_TYPES_KEY) || '[]'); } catch { return []; }
}

function saveCustomType(label) {
  const existing = loadCustomTypes();
  if (!existing.includes(label)) {
    localStorage.setItem(CUSTOM_TYPES_KEY, JSON.stringify([...existing, label]));
  }
}

const EMPTY = { title: '', type: 'custom', notes: '', template_id: '', is_visible_to_client: false };

export default function AddWeddingGalleryDialog({ open, onOpenChange, folderId, editGallery, onSuccess }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [customTypes, setCustomTypes] = useState(loadCustomTypes);
  const [addingCustom, setAddingCustom] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templateMode, setTemplateMode] = useState('link'); // 'link' | 'duplicate'
  const queryClient = useQueryClient();

  const { data: templates = [], refetch: refetchTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ShootTemplate.list('-created_date'),
  });

  const galleryTemplates = templates.filter(t => t.template_type !== 'shot_list');

  useEffect(() => {
    setCustomTypes(loadCustomTypes());
    setAddingCustom(false);
    setCustomInput('');
    setTemplateMode('link');
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

  const handleAddCustomType = () => {
    const label = customInput.trim();
    if (!label) return;
    saveCustomType(label);
    setCustomTypes(loadCustomTypes());
    set('type', label);
    setAddingCustom(false);
    setCustomInput('');
  };

  const handleCreateTemplate = async ({ name, description, template_type }) => {
    const newTemplate = await base44.entities.ShootTemplate.create({
      name,
      description,
      template_type,
      photo_count: 0,
    });
    await refetchTemplates();
    queryClient.invalidateQueries({ queryKey: ['templates'] });
    set('template_id', newTemplate.id);
    setShowCreateTemplate(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    let resolvedTemplateId = form.template_id;

    // Duplicate template if requested
    if (form.template_id && templateMode === 'duplicate') {
      const source = galleryTemplates.find(t => t.id === form.template_id);
      const newTemplate = await base44.entities.ShootTemplate.create({
        name: `${source?.name || 'Template'} (Copy)`,
        description: source?.description || '',
        template_type: source?.template_type || 'gallery',
        cover_image: source?.cover_image || '',
        photo_count: source?.photo_count || 0,
        tags: source?.tags || [],
      });
      const sourcePhotos = await base44.entities.TemplatePhoto.filter({ template_id: form.template_id }, 'sort_order');
      await Promise.all(sourcePhotos.map(p =>
        base44.entities.TemplatePhoto.create({
          template_id: newTemplate.id,
          image_url: p.image_url,
          description: p.description || '',
          pose_category: p.pose_category || '',
          color_priority: p.color_priority || 'green',
          lens_suggestion: p.lens_suggestion || '',
          aperture_suggestion: p.aperture_suggestion || '',
          lighting_notes: p.lighting_notes || '',
          camera_angle: p.camera_angle || '',
          sort_order: p.sort_order || 0,
        })
      ));
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      resolvedTemplateId = newTemplate.id;
    }

    const payload = { ...form, folder_id: folderId, template_id: resolvedTemplateId };
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
    { value: '__create_new__', label: '+ Create new Gallery Template' },
  ];

  return (
    <React.Fragment>
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
                onChange={(v) => {
                  if (v === '__add_custom__') {
                    setAddingCustom(true);
                  } else {
                    set('type', v);
                  }
                }}
                options={[
                  ...BASE_TYPES,
                  ...customTypes.map(t => ({ value: t, label: t })),
                  { value: '__add_custom__', label: '+ Add Custom Type...' },
                ]}
                placeholder="Select type"
              />
              {addingCustom && (
                <div className="flex gap-2 mt-2">
                  <Input
                    autoFocus
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomType(); } if (e.key === 'Escape') setAddingCustom(false); }}
                    placeholder="e.g. Cake Cutting"
                    className="bg-muted border-border font-dm flex-1"
                  />
                  <Button type="button" size="icon" onClick={handleAddCustomType} disabled={!customInput.trim()} className="shrink-0">
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Link to Template</Label>
              <BottomSheetSelect
                label="Template"
                value={form.template_id}
                onChange={(v) => {
                  if (v === '__create_new__') {
                    setShowCreateTemplate(true);
                  } else {
                    set('template_id', v);
                    setTemplateMode('link');
                  }
                }}
                options={templateOptions}
                placeholder="None"
              />
              {form.template_id && form.template_id !== '__create_new__' && (
                <div className="mt-2 rounded-xl border border-border bg-muted/50 p-3 space-y-2">
                  <p className="font-dm text-xs text-muted-foreground leading-snug">How would you like to use this template?</p>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTemplateMode('link')}
                      className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                        templateMode === 'link' ? 'border-primary bg-primary/10' : 'border-border bg-card'
                      }`}
                    >
                      <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        templateMode === 'link' ? 'border-primary' : 'border-muted-foreground'
                      }`}>
                        {templateMode === 'link' && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </div>
                      <div>
                        <p className="font-dm text-sm font-medium text-foreground">Add this gallery</p>
                        <p className="font-dm text-[11px] text-muted-foreground">Links directly — edits affect all uses of this template</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateMode('duplicate')}
                      className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                        templateMode === 'duplicate' ? 'border-primary bg-primary/10' : 'border-border bg-card'
                      }`}
                    >
                      <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        templateMode === 'duplicate' ? 'border-primary' : 'border-muted-foreground'
                      }`}>
                        {templateMode === 'duplicate' && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </div>
                      <div>
                        <p className="font-dm text-sm font-medium text-foreground">Create editable duplicate</p>
                        <p className="font-dm text-[11px] text-muted-foreground">Copies all photos into a new standalone template</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
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

      <CreateTemplateDialog
        open={showCreateTemplate}
        onOpenChange={setShowCreateTemplate}
        onSubmit={handleCreateTemplate}
      />
    </React.Fragment>
  );
}
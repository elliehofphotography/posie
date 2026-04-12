import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
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
  const [pendingTemplateId, setPendingTemplateId] = useState(null);
  const [duplicating, setDuplicating] = useState(false);
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
                  } else if (v && v !== '') {
                    setPendingTemplateId(v);
                  } else {
                    set('template_id', v);
                  }
                }}
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

      <CreateTemplateDialog
        open={showCreateTemplate}
        onOpenChange={setShowCreateTemplate}
        onSubmit={handleCreateTemplate}
      />

      <AlertDialog open={!!pendingTemplateId} onOpenChange={(v) => { if (!v) setPendingTemplateId(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-playfair text-foreground text-lg">Use this template?</AlertDialogTitle>
            <AlertDialogDescription className="font-dm text-muted-foreground text-sm">
              Would you like to link to this gallery, or create an editable duplicate of it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              disabled={duplicating}
              onClick={async () => {
                setDuplicating(true);
                const src = galleryTemplates.find(t => t.id === pendingTemplateId);
                const srcPhotos = await base44.entities.TemplatePhoto.filter({ template_id: pendingTemplateId }, 'sort_order');
                const newT = await base44.entities.ShootTemplate.create({
                  name: `${src?.name || 'Gallery'} (Copy)`,
                  description: src?.description || '',
                  template_type: 'gallery',
                  photo_count: 0,
                  cover_image: src?.cover_image || '',
                });
                for (const p of srcPhotos) {
                  await base44.entities.TemplatePhoto.create({ ...p, id: undefined, template_id: newT.id });
                }
                await base44.entities.ShootTemplate.update(newT.id, { photo_count: srcPhotos.length });
                await refetchTemplates();
                queryClient.invalidateQueries({ queryKey: ['templates'] });
                set('template_id', newT.id);
                setDuplicating(false);
                setPendingTemplateId(null);
              }}
              className="w-full bg-primary text-primary-foreground font-dm rounded-full"
            >
              {duplicating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Editable Duplicate'}
            </Button>
            <Button
              variant="outline"
              onClick={() => { set('template_id', pendingTemplateId); setPendingTemplateId(null); }}
              className="w-full font-dm rounded-full"
            >
              Link to This Gallery
            </Button>
            <Button variant="ghost" onClick={() => setPendingTemplateId(null)} className="w-full font-dm text-muted-foreground">
              Cancel
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </React.Fragment>
  );
}
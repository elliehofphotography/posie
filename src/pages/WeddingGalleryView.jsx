import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '../components/ui/PageHeader';
import PhotoDetailLightbox from '../components/ui/PhotoDetailLightbox';
import PhotoCard from '../components/photos/PhotoCard';
import AddPhotoDialog from '../components/photos/AddPhotoDialog';

import SaveToGalleryDialog from '../components/photos/SaveToGalleryDialog';
import PoseCategoryBar from '../components/ui/PoseCategoryBar';
import { Play, Plus } from 'lucide-react';

export default function WeddingGalleryView() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const folderId = params.get('folder');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);

  const [savingPhoto, setSavingPhoto] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const { data: gallery, isLoading } = useQuery({
    queryKey: ['wedding_gallery', id],
    queryFn: () => base44.entities.WeddingGallery.filter({ id }),
    select: (d) => d[0],
    enabled: !!id,
  });

  const templateId = gallery?.template_id;

  const { data: photos = [] } = useQuery({
    queryKey: ['template_photos', templateId],
    queryFn: () => base44.entities.TemplatePhoto.filter({ template_id: templateId }, 'sort_order'),
    enabled: !!templateId,
  });

  const { data: allTemplates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ShootTemplate.list('-created_date'),
  });

  const otherGalleries = allTemplates.filter(t => t.template_type !== 'shot_list' && t.id !== templateId && !t.listing_id);

  const addPhotoMutation = useMutation({
    mutationFn: async (form) => {
      const photo = await base44.entities.TemplatePhoto.create({
        ...form,
        template_id: templateId,
        sort_order: photos.length,
      });
      await base44.entities.ShootTemplate.update(templateId, {
        photo_count: photos.length + 1,
        cover_image: photos.length === 0 ? form.image_url : undefined,
      });
      return photo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template_photos', templateId] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowAddPhoto(false);
    },
  });

  const editPhotoMutation = useMutation({
    mutationFn: (form) => base44.entities.TemplatePhoto.update(editingPhoto.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template_photos', templateId] });
      setEditingPhoto(null);
    },
  });

  // Remove from this gallery only
  const removePhotoMutation = useMutation({
    mutationFn: async (photo) => {
      await base44.entities.TemplatePhoto.delete(photo.id);
      const remaining = photos.filter(p => p.id !== photo.id);
      await base44.entities.ShootTemplate.update(templateId, {
        photo_count: remaining.length,
        cover_image: remaining[0]?.image_url || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template_photos', templateId] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  // Delete from ALL galleries that share the same image_url
  const deletePhotoMutation = useMutation({
    mutationFn: async (photo) => {
      const allPhotos = await base44.entities.TemplatePhoto.filter({ image_url: photo.image_url });
      await Promise.all(allPhotos.map(p => base44.entities.TemplatePhoto.delete(p.id)));
      const affectedIds = [...new Set(allPhotos.map(p => p.template_id))];
      await Promise.all(affectedIds.map(async (tid) => {
        const remaining = await base44.entities.TemplatePhoto.filter({ template_id: tid });
        await base44.entities.ShootTemplate.update(tid, {
          photo_count: remaining.length,
          cover_image: remaining.length > 0 ? remaining[0].image_url : '',
        });
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template_photos', templateId] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['all_photos'] });
    },
  });

  const saveToGalleryMutation = useMutation({
    mutationFn: async ({ photo, targetTemplateId }) => {
      const target = allTemplates.find(t => t.id === targetTemplateId);
      const existing = await base44.entities.TemplatePhoto.filter({ template_id: targetTemplateId }, 'sort_order');
      await base44.entities.TemplatePhoto.create({
        template_id: targetTemplateId,
        image_url: photo.image_url,
        description: photo.description || '',
        pose_category: photo.pose_category || '',
        color_priority: photo.color_priority || 'green',
        lens_suggestion: photo.lens_suggestion || '',
        aperture_suggestion: photo.aperture_suggestion || '',
        lighting_notes: photo.lighting_notes || '',
        camera_angle: photo.camera_angle || '',
        sort_order: existing.length,
      });
      await base44.entities.ShootTemplate.update(targetTemplateId, {
        photo_count: existing.length + 1,
        cover_image: existing.length === 0 ? photo.image_url : target?.cover_image,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSavingPhoto(null);
      setIsSaving(false);
    },
  });

  const createAndSaveMutation = useMutation({
    mutationFn: async ({ photo, name }) => {
      const newTemplate = await base44.entities.ShootTemplate.create({
        name,
        template_type: 'gallery',
        photo_count: 1,
        cover_image: photo.image_url,
      });
      await base44.entities.TemplatePhoto.create({
        template_id: newTemplate.id,
        image_url: photo.image_url,
        description: photo.description || '',
        pose_category: photo.pose_category || '',
        color_priority: photo.color_priority || 'green',
        lens_suggestion: photo.lens_suggestion || '',
        aperture_suggestion: photo.aperture_suggestion || '',
        lighting_notes: photo.lighting_notes || '',
        camera_angle: photo.camera_angle || '',
        sort_order: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSavingPhoto(null);
      setIsSaving(false);
    },
  });

  const handleShootMode = () => {
    if (templateId) navigate(`/ShootMode?id=${templateId}`);
  };

  const filteredPhotos = activeCategory ? photos.filter(p => p.pose_category === activeCategory) : photos;

  if (isLoading || !gallery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <PageHeader
        title={gallery.title}
        backTo={folderId ? `/WeddingFolder?id=${folderId}` : '/Weddings'}
        right={
          templateId && (
            <button
              onClick={handleShootMode}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary text-primary-foreground text-xs font-dm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Shoot
            </button>
          )
        }
      />


      {templateId ? (
        <div className="p-4">
          {photos.length > 0 && (
            <PoseCategoryBar activeCategory={activeCategory} onChange={setActiveCategory} />
          )}

          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="font-dm text-muted-foreground text-sm mb-6">No photos yet. Tap + to add your first.</p>
              <button
                onClick={() => setShowAddPhoto(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-dm text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Photo
              </button>
            </div>
          ) : (
            <div className="columns-2 gap-3">
              {filteredPhotos.map((photo) => (
                <div key={photo.id} className="break-inside-avoid mb-3">
                  <PhotoCard
                    photo={photo}
                    onClick={() => setLightboxPhoto(photo)}
                    onEdit={(p) => setEditingPhoto(p)}
                    onRemove={(p) => removePhotoMutation.mutate(p)}
                    onDelete={(p) => deletePhotoMutation.mutate(p)}
                    onSaveToGallery={(p) => setSavingPhoto(p)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center px-5">
          <p className="font-dm text-muted-foreground text-sm">
            This gallery isn't linked to a template yet.<br />
            Edit the gallery to attach an existing template.
          </p>
        </div>
      )}

      {/* FAB */}
      {templateId && photos.length > 0 && (
        <button
          onClick={() => setShowAddPhoto(true)}
          className="fixed bottom-24 right-5 h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {lightboxPhoto && <PhotoDetailLightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />}

      <AddPhotoDialog
        open={showAddPhoto}
        onOpenChange={setShowAddPhoto}
        onSubmit={(form) => addPhotoMutation.mutate(form)}
      />

      {editingPhoto && (
        <AddPhotoDialog
          open={!!editingPhoto}
          onOpenChange={(v) => { if (!v) setEditingPhoto(null); }}
          editPhoto={editingPhoto}
          onSubmit={(form) => editPhotoMutation.mutate(form)}
        />
      )}

      {savingPhoto && (
        <SaveToGalleryDialog
          open={true}
          onOpenChange={(v) => { if (!v) { setSavingPhoto(null); setIsSaving(false); } }}
          photo={savingPhoto}
          galleries={otherGalleries}
          onSaveToExisting={(targetTemplateId) => { setIsSaving(true); saveToGalleryMutation.mutate({ photo: savingPhoto, targetTemplateId }); }}
          onCreateNew={(name) => { setIsSaving(true); createAndSaveMutation.mutate({ photo: savingPhoto, name }); }}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
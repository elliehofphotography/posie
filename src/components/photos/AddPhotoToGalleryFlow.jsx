/**
 * A two-step flow: AddPhotoDialog → SaveToGalleryDialog.
 * Used from Home and AllPhotos to add a photo and pick where it goes.
 */
import React, { useState } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AddPhotoDialog from './AddPhotoDialog';
import SaveToGalleryDialog from './SaveToGalleryDialog';

export default function AddPhotoToGalleryFlow({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [pendingPhoto, setPendingPhoto] = useState(null); // photo data after step 1
  const [isSaving, setIsSaving] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ShootTemplate.list('-updated_date'),
    enabled: open,
  });

  const galleryTemplates = templates.filter(t => t.template_type !== 'shot_list' && !t.listing_id);

  const saveToExistingMutation = useMutation({
    mutationFn: async ({ photo, templateId }) => {
      const target = galleryTemplates.find(t => t.id === templateId);
      const existing = await base44.entities.TemplatePhoto.filter({ template_id: templateId }, 'sort_order');
      await base44.entities.TemplatePhoto.create({
        template_id: templateId,
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
      await base44.entities.ShootTemplate.update(templateId, {
        photo_count: existing.length + 1,
        cover_image: existing.length === 0 ? photo.image_url : target?.cover_image,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setPendingPhoto(null);
      setIsSaving(false);
      onOpenChange(false);
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
      setPendingPhoto(null);
      setIsSaving(false);
      onOpenChange(false);
    },
  });

  const handlePhotoSubmit = (photoData) => {
    setPendingPhoto(photoData);
  };

  const handleClose = (v) => {
    if (!v) {
      setPendingPhoto(null);
      setIsSaving(false);
    }
    onOpenChange(v);
  };

  return (
    <>
      {/* Step 1: Add photo details */}
      <AddPhotoDialog
        open={open && !pendingPhoto}
        onOpenChange={handleClose}
        onSubmit={handlePhotoSubmit}
      />

      {/* Step 2: Pick gallery */}
      {pendingPhoto && (
        <SaveToGalleryDialog
          open={true}
          onOpenChange={(v) => { if (!v) { setPendingPhoto(null); onOpenChange(false); } }}
          photo={pendingPhoto}
          galleries={galleryTemplates}
          onSaveToExisting={(templateId) => { setIsSaving(true); saveToExistingMutation.mutate({ photo: pendingPhoto, templateId }); }}
          onCreateNew={(name) => { setIsSaving(true); createAndSaveMutation.mutate({ photo: pendingPhoto, name }); }}
          isSaving={isSaving}
        />
      )}
    </>
  );
}
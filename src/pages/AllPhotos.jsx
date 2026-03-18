import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Images } from 'lucide-react';
import PhotoCard from '../components/photos/PhotoCard';
import SaveToGalleryDialog from '../components/photos/SaveToGalleryDialog';

export default function AllPhotos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [savingPhoto, setSavingPhoto] = useState(null);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['all_photos'],
    queryFn: () => base44.entities.TemplatePhoto.list('-created_date'),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ShootTemplate.list('-created_date'),
  });

  // Only gallery-type templates
  const galleryTemplates = templates.filter(t => t.template_type !== 'shot_list');

  const saveMutation = useMutation({
    mutationFn: async ({ photo, targetTemplateId }) => {
      const targetPhotos = await base44.entities.TemplatePhoto.filter({ template_id: targetTemplateId }, 'sort_order');
      await base44.entities.TemplatePhoto.create({
        template_id: targetTemplateId,
        image_url: photo.image_url,
        description: photo.description,
        pose_category: photo.pose_category,
        color_priority: photo.color_priority,
        lens_suggestion: photo.lens_suggestion,
        aperture_suggestion: photo.aperture_suggestion,
        lighting_notes: photo.lighting_notes,
        camera_angle: photo.camera_angle,
        technical_notes: photo.technical_notes,
        sort_order: targetPhotos.length,
      });
      const target = templates.find(t => t.id === targetTemplateId);
      await base44.entities.ShootTemplate.update(targetTemplateId, {
        photo_count: targetPhotos.length + 1,
        cover_image: targetPhotos.length === 0 ? photo.image_url : target?.cover_image,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSavingPhoto(null);
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
        description: photo.description,
        pose_category: photo.pose_category,
        color_priority: photo.color_priority,
        lens_suggestion: photo.lens_suggestion,
        aperture_suggestion: photo.aperture_suggestion,
        lighting_notes: photo.lighting_notes,
        camera_angle: photo.camera_angle,
        technical_notes: photo.technical_notes,
        sort_order: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSavingPhoto(null);
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/Home')}
            className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-playfair text-lg font-semibold text-foreground leading-tight">All Photos</h1>
            <p className="font-dm text-xs text-muted-foreground">{photos.length} photos across all galleries</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Images className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-playfair text-lg font-semibold text-foreground mb-1.5">No photos yet</h3>
            <p className="font-dm text-muted-foreground text-sm max-w-[220px] leading-relaxed">
              Photos added to any gallery will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {photos.map(p => (
              <PhotoCard
                key={p.id}
                photo={p}
                onEdit={() => {}}
                onDelete={() => {}}
                onSaveToGallery={() => setSavingPhoto(p)}
                hideEdit
                hideDelete
              />
            ))}
          </div>
        )}
      </div>

      {savingPhoto && (
        <SaveToGalleryDialog
          open={true}
          onOpenChange={(v) => { if (!v) setSavingPhoto(null); }}
          photo={savingPhoto}
          galleries={galleryTemplates}
          onSaveToExisting={(templateId) => saveMutation.mutate({ photo: savingPhoto, targetTemplateId: templateId })}
          onCreateNew={(name) => createAndSaveMutation.mutate({ photo: savingPhoto, name })}
          isSaving={saveMutation.isPending || createAndSaveMutation.isPending}
        />
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import PhotoCard from '../components/photos/PhotoCard';
import SaveToGalleryDialog from '../components/photos/SaveToGalleryDialog';
import ImageLightbox from '../components/ui/ImageLightbox';

export default function AllPhotos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [savingPhoto, setSavingPhoto] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['all_photos'],
    queryFn: () => base44.entities.TemplatePhoto.list('-created_date'),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ShootTemplate.list('-created_date'),
  });

  const galleryTemplates = templates.filter(t => t.template_type !== 'shot_list');

  const saveToExistingMutation = useMutation({
    mutationFn: async ({ photo, templateId }) => {
      const target = galleryTemplates.find(t => t.id === templateId);
      const existing = await base44.entities.TemplatePhoto.filter({ template_id: templateId }, 'sort_order');
      await base44.entities.TemplatePhoto.create({
        template_id: templateId,
        image_url: photo.image_url,
        description: photo.description || '',
        sort_order: existing.length,
      });
      await base44.entities.ShootTemplate.update(templateId, {
        photo_count: existing.length + 1,
        cover_image: existing.length === 0 ? photo.image_url : target?.cover_image,
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); setSavingPhoto(null); setIsSaving(false); },
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
        sort_order: 0,
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); setSavingPhoto(null); setIsSaving(false); },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-colors select-none"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-playfair text-lg font-semibold text-foreground leading-tight">All Photos</h1>
            <p className="font-dm text-xs text-muted-foreground">{photos.length} photos</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4">
        {isLoading ? (
          <div className="columns-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="break-inside-avoid mb-3 aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ImageIcon className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-playfair text-lg font-semibold text-foreground mb-1.5">No photos yet</h3>
            <p className="font-dm text-muted-foreground text-sm max-w-[200px] leading-relaxed">
              Add photos to your templates to see them here
            </p>
          </div>
        ) : (
          <div className="columns-2 gap-3">
            {photos.map(photo => (
              <div key={photo.id} className="break-inside-avoid mb-3">
                <PhotoCard
                  photo={photo}
                  hideEdit
                  hideDelete
                  onClick={() => setLightboxImage(photo.image_url)}
                  onSaveToGallery={(p) => setSavingPhoto(p)}
                />
              </div>
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
          onSaveToExisting={(templateId) => { setIsSaving(true); saveToExistingMutation.mutate({ photo: savingPhoto, templateId }); }}
          onCreateNew={(name) => { setIsSaving(true); createAndSaveMutation.mutate({ photo: savingPhoto, name }); }}
          isSaving={isSaving}
        />
      )}

      {lightboxImage && (
        <ImageLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}
    </div>
  );
}
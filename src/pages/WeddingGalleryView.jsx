import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '../components/ui/PageHeader';
import ImageLightbox from '../components/ui/ImageLightbox';
import PhotoCard from '../components/photos/PhotoCard';
import AddPhotoDialog from '../components/photos/AddPhotoDialog';
import BatchUploader from '../components/photos/BatchUploader';
import { Play, Plus, Upload } from 'lucide-react';

export default function WeddingGalleryView() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const folderId = params.get('folder');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [lightboxImage, setLightboxImage] = useState(null);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [showBatchUploader, setShowBatchUploader] = useState(false);

  const { data: gallery, isLoading } = useQuery({
    queryKey: ['wedding_gallery', id],
    queryFn: () => base44.entities.WeddingGallery.filter({ id }),
    select: (d) => d[0],
    enabled: !!id,
  });

  const templateId = gallery?.template_id;

  const { data: photos = [], refetch: refetchPhotos } = useQuery({
    queryKey: ['template_photos', templateId],
    queryFn: () => base44.entities.TemplatePhoto.filter({ template_id: templateId }, 'sort_order'),
    enabled: !!templateId,
  });

  // Also fetch all gallery templates for the batch uploader
  const { data: allTemplates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ShootTemplate.list('-created_date'),
  });

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

  const deletePhotoMutation = useMutation({
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

  const handleShootMode = () => {
    if (templateId) navigate(`/ShootMode?id=${templateId}`);
  };

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
          <div className="flex items-center gap-2">
            {templateId && (
              <button
                onClick={handleShootMode}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary text-primary-foreground text-xs font-dm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Shoot
              </button>
            )}
          </div>
        }
      />

      {gallery.notes && (
        <div className="px-5 pt-4 pb-2">
          <p className="font-dm text-sm text-muted-foreground leading-relaxed">{gallery.notes}</p>
        </div>
      )}

      {templateId ? (
        <div className="px-4 pt-4">
          {/* Action buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowAddPhoto(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-dm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Photo
            </button>
            <button
              onClick={() => setShowBatchUploader(v => !v)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-xs font-dm font-medium hover:bg-secondary transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Batch Upload
            </button>
          </div>

          {showBatchUploader && (
            <BatchUploader
              galleries={allTemplates.filter(t => t.template_type !== 'shot_list')}
              onDone={() => {
                setShowBatchUploader(false);
                queryClient.invalidateQueries({ queryKey: ['template_photos', templateId] });
              }}
            />
          )}

          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-dm text-muted-foreground text-sm">No photos yet. Add your first photo above.</p>
            </div>
          ) : (
            <div className="columns-2 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="break-inside-avoid mb-3">
                  <PhotoCard
                    photo={photo}
                    onClick={() => setLightboxImage(photo.image_url)}
                    onEdit={(p) => setEditingPhoto(p)}
                    onDelete={(p) => deletePhotoMutation.mutate(p)}
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

      {lightboxImage && <ImageLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />}

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
    </div>
  );
}
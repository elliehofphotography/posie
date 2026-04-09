import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Play, List, Image as ImageIcon } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import PoseCategoryBar from '../components/ui/PoseCategoryBar';
import { Button } from '@/components/ui/button';
import PhotoCard from '../components/photos/PhotoCard';
import AddPhotoDialog from '../components/photos/AddPhotoDialog';
import PhotoDetailLightbox from '../components/ui/PhotoDetailLightbox';
import SortOptionsDialog from '../components/templates/SortOptionsDialog';
import UpgradeModal from '../components/subscription/UpgradeModal';
import SaveToGalleryDialog from '../components/photos/SaveToGalleryDialog';
import { canAddPhoto, FREE_PHOTO_LIMIT } from '../lib/subscription';

export default function Template() {
  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showSortDialog, setShowSortDialog] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [user, setUser] = useState(null);
  const [savingPhoto, setSavingPhoto] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: template } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => base44.entities.ShootTemplate.filter({ id: templateId }),
    select: (data) => data[0],
    enabled: !!templateId,
  });

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['photos', templateId],
    queryFn: () => base44.entities.TemplatePhoto.filter({ template_id: templateId }, 'sort_order'),
    enabled: !!templateId,
  });

  const { data: allTemplates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ShootTemplate.list('-updated_date'),
  });

  const otherGalleries = allTemplates.filter(t => t.template_type !== 'shot_list' && t.id !== templateId && !t.listing_id);

  const addPhotoMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.TemplatePhoto.create({
        ...data,
        template_id: templateId,
        sort_order: photos.length,
      });
      await base44.entities.ShootTemplate.update(templateId, {
        photo_count: photos.length + 1,
        cover_image: photos.length === 0 ? data.image_url : template?.cover_image,
      });
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['photos', templateId] });
      const previous = queryClient.getQueryData(['photos', templateId]);
      queryClient.setQueryData(['photos', templateId], (old = []) => [
        ...old,
        { id: `optimistic-${Date.now()}`, ...data, template_id: templateId, sort_order: old.length },
      ]);
      return { previous };
    },
    onError: (_err, _data, ctx) => {
      queryClient.setQueryData(['photos', templateId], ctx.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', templateId] });
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowAddPhoto(false);
    },
  });

  const editPhotoMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await base44.entities.TemplatePhoto.update(id, data);
      await base44.entities.ShootTemplate.update(templateId, { updated_date: new Date().toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', templateId] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setEditingPhoto(null);
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

  // Remove from this gallery only
  const removePhotoMutation = useMutation({
    mutationFn: async (photo) => {
      await base44.entities.TemplatePhoto.delete(photo.id);
      await base44.entities.ShootTemplate.update(templateId, {
        photo_count: Math.max(0, (template?.photo_count || 1) - 1),
      });
    },
    onMutate: async (photo) => {
      await queryClient.cancelQueries({ queryKey: ['photos', templateId] });
      const previous = queryClient.getQueryData(['photos', templateId]);
      queryClient.setQueryData(['photos', templateId], (old = []) => old.filter(p => p.id !== photo.id));
      return { previous };
    },
    onError: (_err, _photo, ctx) => {
      queryClient.setQueryData(['photos', templateId], ctx.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', templateId] });
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  // Delete photo across ALL galleries that share the same image_url
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
    onMutate: async (photo) => {
      await queryClient.cancelQueries({ queryKey: ['photos', templateId] });
      const previous = queryClient.getQueryData(['photos', templateId]);
      queryClient.setQueryData(['photos', templateId], (old = []) => old.filter(p => p.id !== photo.id));
      return { previous };
    },
    onError: (_err, _photo, ctx) => {
      queryClient.setQueryData(['photos', templateId], ctx.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', templateId] });
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['all_photos'] });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={template?.name || 'Template'}
        subtitle={`${photos.length} poses`}
        backTo="/Home"
        right={
          <>
            <Link to={`/ShotList?id=${templateId}`}>
              <button className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-colors">
                <List className="w-4 h-4" />
              </button>
            </Link>
            {photos.length > 0 && (
              <button
                onClick={() => setShowSortDialog(true)}
                className="flex items-center gap-1.5 px-4 py-2 h-11 rounded-full bg-primary text-primary-foreground font-dm text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Shoot
              </button>
            )}
          </>
        }
      />

      {/* Pose Category Filter */}
      {photos.length > 0 && (
        <PoseCategoryBar activeCategory={activeCategory} onChange={setActiveCategory} />
      )}

      {/* Photo Grid */}
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
            <p className="font-dm text-muted-foreground text-sm mb-6 max-w-[200px] leading-relaxed">
              Add inspiration photos to build your shoot plan
            </p>
            <button
              onClick={() => {
                if (!canAddPhoto(user, photos.length)) {
                  setShowUpgrade(true);
                } else {
                  setShowAddPhoto(true);
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-dm text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Photo
            </button>
          </div>
        ) : (
          <div className="columns-2 gap-3">
            {(activeCategory ? photos.filter(p => p.pose_category === activeCategory) : photos).map(p => (
              <div key={p.id} className="break-inside-avoid mb-3">
                <PhotoCard
                  photo={p}
                  onEdit={(photo) => setEditingPhoto(photo)}
                  onRemove={(photo) => removePhotoMutation.mutate(photo)}
                  onDelete={(photo) => deletePhotoMutation.mutate(photo)}
                  onClick={() => setLightboxPhoto(p)}
                  onSaveToGallery={(photo) => setSavingPhoto(photo)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      {photos.length > 0 && (
        <button
          onClick={() => {
            if (!canAddPhoto(user, photos.length)) {
              setShowUpgrade(true);
            } else {
              setShowAddPhoto(true);
            }
          }}
          className="fixed bottom-24 right-5 h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <UpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        reason={`Free accounts are limited to ${FREE_PHOTO_LIMIT} photos per gallery. Upgrade to Pro for unlimited photos.`}
      />

      <AddPhotoDialog
        open={showAddPhoto}
        onOpenChange={setShowAddPhoto}
        onSubmit={(data) => addPhotoMutation.mutate(data)}
      />

      {lightboxPhoto && (
        <PhotoDetailLightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />
      )}

      {editingPhoto && (
        <AddPhotoDialog
          open={true}
          onOpenChange={() => setEditingPhoto(null)}
          editPhoto={editingPhoto}
          onSubmit={(data) => editPhotoMutation.mutate({ id: editingPhoto.id, data })}
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

      <SortOptionsDialog
        open={showSortDialog}
        onOpenChange={setShowSortDialog}
        onSelect={(sortBy) => {
          navigate(`/ShootMode?id=${templateId}&sortBy=${sortBy}`);
        }}
      />
    </div>
  );
}
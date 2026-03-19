import React, { useState, useEffect } from 'react';
import { ArrowLeft, Image as ImageIcon, CheckSquare, X, Trash2 } from 'lucide-react';
import PoseCategoryBar from '../components/ui/PoseCategoryBar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import PhotoCard from '../components/photos/PhotoCard';
import SaveToGalleryDialog from '../components/photos/SaveToGalleryDialog';
import ImageLightbox from '../components/ui/ImageLightbox';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AllPhotos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [savingPhoto, setSavingPhoto] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['all_photos'],
    queryFn: () => base44.entities.TemplatePhoto.list('-created_date'),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ShootTemplate.list('-created_date'),
  });

  const { data: discoverPosts = [] } = useQuery({
    queryKey: ['discover_posts'],
    queryFn: () => base44.entities.DiscoverPost.filter({ created_by: user?.email }),
    enabled: !!user?.email,
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

  // Delete selected photos only from current user's galleries
  const hapticFeedback = () => {
    if (window.navigator?.vibrate) {
      window.navigator.vibrate([10, 5, 10]);
    }
  };

  const deleteSelectedMutation = useMutation({
    mutationFn: async (selectedIds) => {
      hapticFeedback();
      const selectedPhotos = photos.filter(p => selectedIds.includes(p.id));
      const selectedImageUrls = selectedPhotos.map(p => p.image_url);

      // Get only current user's templates
      const userTemplates = templates.filter(t => t.created_by === user?.email);
      const userTemplateIds = userTemplates.map(t => t.id);

      // Find TemplatePhoto records in ONLY the current user's templates with matching image URLs
      const userTemplatePhotos = await base44.entities.TemplatePhoto.list();
      const toDelete = userTemplatePhotos.filter(p =>
        userTemplateIds.includes(p.template_id) && selectedImageUrls.includes(p.image_url)
      );

      // Delete only from current user's templates
      await Promise.all(toDelete.map(p => base44.entities.TemplatePhoto.delete(p.id)));

      // Update photo counts for affected user templates only
      const affectedTemplateIds = [...new Set(toDelete.map(p => p.template_id))];
      await Promise.all(affectedTemplateIds.map(async (templateId) => {
        const remaining = await base44.entities.TemplatePhoto.filter({ template_id: templateId });
        await base44.entities.ShootTemplate.update(templateId, {
          photo_count: remaining.length,
          cover_image: remaining.length > 0 ? remaining[0].image_url : '',
        });
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_photos'] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSelected([]);
      setSelectMode(false);
      setShowDeleteConfirm(false);
    },
  });

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected([]);
  };

  const filteredPhotos = activeCategory ? photos.filter(p => p.pose_category === activeCategory) : photos;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        {selectMode ? (
          <div className="flex items-center gap-2">
            <button
              onClick={exitSelectMode}
              className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-colors select-none"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <p className="font-dm text-sm font-medium text-foreground">
                {selected.length > 0 ? `${selected.length} selected` : 'Select photos'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
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
            {photos.length > 0 && (
              <button
                onClick={() => setSelectMode(true)}
                className="px-4 py-2 rounded-full bg-muted font-dm text-sm text-foreground hover:bg-secondary transition-colors select-none"
              >
                Select
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pose Category Filter */}
      <PoseCategoryBar activeCategory={activeCategory} onChange={setActiveCategory} />

      {/* Grid */}
      <div className="p-4">
        {isLoading ? (
          <div className="columns-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="break-inside-avoid mb-3 aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ImageIcon className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-playfair text-lg font-semibold text-foreground mb-1.5">No photos yet</h3>
            <p className="font-dm text-muted-foreground text-sm max-w-[200px] leading-relaxed">
              Add photos to your templates to see them here
            </p>
          </div>
        ) : selectMode ? (
          <div className="columns-2 gap-3">
            {filteredPhotos.map(photo => (
              <button
                key={photo.id}
                onClick={() => toggleSelect(photo.id)}
                className={`break-inside-avoid mb-3 w-full relative rounded-2xl overflow-hidden transition-all ${
                  selected.includes(photo.id) ? 'ring-2 ring-primary' : ''
                }`}
              >
                <img
                  src={photo.image_url}
                  alt={photo.description || 'Photo'}
                  className="w-full h-auto block"
                />
                {selected.includes(photo.id) && (
                  <div className="absolute inset-0 bg-primary/30" />
                )}
                <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 transition-all ${
                  selected.includes(photo.id)
                    ? 'bg-primary border-primary'
                    : 'bg-white/30 border-white/70'
                } flex items-center justify-center`}>
                  {selected.includes(photo.id) && (
                    <X className="w-3 h-3 text-white" strokeWidth={3} />
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="columns-2 gap-3">
            {filteredPhotos.map(photo => (
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

      {/* Delete Button (select mode) */}
      {selectMode && selected.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-5 pb-4 z-40" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <button
            onClick={() => { setShowDeleteConfirm(true); hapticFeedback(); }}
            className="w-full min-h-[48px] py-4 rounded-2xl bg-destructive text-destructive-foreground font-dm text-sm font-semibold flex items-center justify-center gap-2 shadow-lg"
          >
            <Trash2 className="w-4 h-4" />
            Delete ({selected.length})
          </button>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-playfair text-foreground">Delete these images?</AlertDialogTitle>
            <AlertDialogDescription className="font-dm text-muted-foreground">
              Photos will be removed from your galleries only. Other users' galleries are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-dm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSelectedMutation.mutate(selected)}
              disabled={deleteSelectedMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-dm"
            >
              {deleteSelectedMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
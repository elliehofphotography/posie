import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, X, Upload } from 'lucide-react';
import BatchUploader from '../components/photos/BatchUploader';
import PageHeader from '../components/ui/PageHeader';
import PhotoCard from '../components/photos/PhotoCard';
import PhotoDetailLightbox from '../components/ui/PhotoDetailLightbox';
import SaveToGalleryDialog from '../components/photos/SaveToGalleryDialog';
import BulkSaveToGalleryDialog from '../components/photos/BulkSaveToGalleryDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AllPhotos() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [savingPhoto, setSavingPhoto] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Bulk select
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [showBulkSave, setShowBulkSave] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allPhotosRaw = [], isLoading: loadingPhotos } = useQuery({
    queryKey: ['all_photos'],
    queryFn: () => base44.entities.TemplatePhoto.list('-created_date'),
  });

  const { data: discoverPosts = [], isLoading: loadingDiscover } = useQuery({
    queryKey: ['discover_posts'],
    queryFn: () => base44.entities.DiscoverPost.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const isLoading = loadingPhotos || loadingDiscover;

  // Merge TemplatePhotos + DiscoverPosts (adapt discover posts to same shape)
  const discoverAsPhotos = discoverPosts.map(p => ({
    id: `discover-${p.id}`,
    image_url: p.image_url,
    description: p.description || '',
    pose_category: p.pose_category || '',
    color_priority: 'green',
    lens_suggestion: p.lens || '',
    aperture_suggestion: p.aperture || '',
    lighting_notes: p.lighting_notes || '',
    created_date: p.created_date,
  }));

  const combined = [...allPhotosRaw, ...discoverAsPhotos];
  // Deduplicate by image_url — show one card per unique photo
  const seen = new Set();
  const photos = combined.filter(p => {
    if (seen.has(p.image_url)) return false;
    seen.add(p.image_url);
    return true;
  });

  const { data: allTemplates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ShootTemplate.list('-updated_date'),
  });

  const galleries = allTemplates.filter(t => t.template_type !== 'shot_list' && !t.listing_id);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['all_photos'] });
    queryClient.invalidateQueries({ queryKey: ['templates'] });
  };

  // Delete a single photo across ALL galleries
  const deletePhotoMutation = useMutation({
    mutationFn: async (photo) => {
      if (photo.id?.startsWith('discover-')) {
        // It's a Discover post — delete the DiscoverPost record
        const discoverPostId = photo.id.replace('discover-', '');
        await base44.entities.DiscoverPost.delete(discoverPostId);
      } else {
        // It's a TemplatePhoto — delete from all galleries
        const matches = await base44.entities.TemplatePhoto.filter({ image_url: photo.image_url });
        await Promise.all(matches.map(p => base44.entities.TemplatePhoto.delete(p.id)));
        const affectedIds = [...new Set(matches.map(p => p.template_id))];
        await Promise.all(affectedIds.map(async (tid) => {
          const remaining = await base44.entities.TemplatePhoto.filter({ template_id: tid });
          await base44.entities.ShootTemplate.update(tid, {
            photo_count: remaining.length,
            cover_image: remaining.length > 0 ? remaining[0].image_url : '',
          });
        }));
      }
    },
    onMutate: async (photo) => {
      await queryClient.cancelQueries({ queryKey: ['all_photos'] });
      await queryClient.cancelQueries({ queryKey: ['discover_posts'] });
      const previous = queryClient.getQueryData(['all_photos']);
      queryClient.setQueryData(['all_photos'], (old = []) => old.filter(p => p.image_url !== photo.image_url));
      queryClient.setQueryData(['discover_posts'], (old = []) => (old || []).filter(p => p.image_url !== photo.image_url));
      return { previous };
    },
    onError: (_e, _p, ctx) => queryClient.setQueryData(['all_photos'], ctx.previous),
    onSuccess: () => window.location.reload(),
  });

  // Bulk delete
  const bulkDeleteMutation = useMutation({
    mutationFn: async (imageUrls) => {
      // Fetch all matching records for every selected URL in parallel
      const allMatchArrays = await Promise.all(
        imageUrls.map(url => base44.entities.TemplatePhoto.filter({ image_url: url }))
      );
      const allMatches = allMatchArrays.flat();
      // Delete every matched record in parallel
      await Promise.all(allMatches.map(p => base44.entities.TemplatePhoto.delete(p.id)));
      // Update affected template metadata
      const affectedIds = [...new Set(allMatches.map(p => p.template_id))];
      await Promise.all(affectedIds.map(async (tid) => {
        const remaining = await base44.entities.TemplatePhoto.filter({ template_id: tid });
        await base44.entities.ShootTemplate.update(tid, {
          photo_count: remaining.length,
          cover_image: remaining.length > 0 ? remaining[0].image_url : '',
        });
      }));
    },
    onMutate: async (imageUrls) => {
      await queryClient.cancelQueries({ queryKey: ['all_photos'] });
      const previous = queryClient.getQueryData(['all_photos']);
      queryClient.setQueryData(['all_photos'], (old = []) => old.filter(p => !imageUrls.includes(p.image_url)));
      return { previous };
    },
    onError: (_e, _p, ctx) => queryClient.setQueryData(['all_photos'], ctx.previous),
    onSuccess: () => window.location.reload(),
  });

  // Save to existing gallery
  const saveToExistingMutation = useMutation({
    mutationFn: async ({ photo, templateId }) => {
      const target = galleries.find(t => t.id === templateId);
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
      invalidateAll();
      setSavingPhoto(null);
      setIsSaving(false);
    },
  });

  // Create new gallery and save
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
      invalidateAll();
      setSavingPhoto(null);
      setIsSaving(false);
    },
  });

  const toggleSelect = (imageUrl) => {
    setSelected(prev => prev.includes(imageUrl) ? prev.filter(u => u !== imageUrl) : [...prev, imageUrl]);
  };

  const exitSelectMode = () => { setSelectMode(false); setSelected([]); };

  const headerRight = selectMode ? null : (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowUploader(v => !v)}
        className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-colors select-none"
        aria-label="Batch upload"
      >
        <Upload className="w-4 h-4" />
      </button>
      {photos.length > 0 && (
        <button
          onClick={() => setSelectMode(true)}
          className="px-4 py-2 rounded-full bg-muted font-dm text-sm text-foreground hover:bg-secondary transition-colors select-none"
        >
          Select
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {selectMode ? (
        <div
          className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border px-4 flex items-center gap-2"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
        >
          <button
            onClick={exitSelectMode}
            className="px-4 py-2.5 rounded-full bg-muted font-dm text-sm text-foreground hover:bg-secondary transition-colors select-none whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            disabled={selected.length === 0}
            onClick={() => setShowBulkSave(true)}
            className="flex-1 py-2.5 rounded-full bg-primary/15 text-primary font-dm text-sm font-medium hover:bg-primary/25 transition-colors disabled:opacity-30 select-none whitespace-nowrap"
          >
            Add to Gallery{selected.length > 0 ? ` (${selected.length})` : ''}
          </button>
          <button
            disabled={selected.length === 0}
            onClick={() => setShowBulkConfirm(true)}
            className="flex-1 py-2.5 rounded-full bg-destructive/15 text-destructive font-dm text-sm font-medium hover:bg-destructive/25 transition-colors disabled:opacity-30 select-none whitespace-nowrap"
          >
            Delete{selected.length > 0 ? ` (${selected.length})` : ''}
          </button>
        </div>
      ) : (
        <PageHeader
          title="All Photos"
          subtitle={`${photos.length} photos`}
          backTo="/Home"
          right={headerRight}
        />
      )}

      <div className="p-4">
        {showUploader && (
          <BatchUploader
            galleries={galleries}
            onDone={() => { setShowUploader(false); queryClient.invalidateQueries({ queryKey: ['all_photos'] }); }}
          />
        )}
        {isLoading ? (
          <div className="columns-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="break-inside-avoid mb-3 aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Trash2 className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-playfair text-lg font-semibold text-foreground mb-1.5">No photos yet</h3>
            <p className="font-dm text-muted-foreground text-sm max-w-[200px] leading-relaxed">
              Photos you add to any gallery will appear here
            </p>
          </div>
        ) : (
          <div className="columns-2 gap-3">
            {photos.map(p => (
              <div
                key={p.image_url}
                className="break-inside-avoid mb-3 relative"
                onClick={selectMode ? () => toggleSelect(p.image_url) : undefined}
              >
                {selectMode && (
                  <div className={`absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selected.includes(p.image_url) ? 'bg-primary border-primary' : 'bg-white/60 border-white'}`}>
                    {selected.includes(p.image_url) && <X className="w-3 h-3 text-white" />}
                  </div>
                )}
                <PhotoCard
                  photo={p}
                  hideEdit
                  hideDelete={false}
                  onDelete={(photo) => deletePhotoMutation.mutate(photo)}
                  onSaveToGallery={!selectMode ? (photo) => setSavingPhoto(photo) : undefined}
                  onClick={!selectMode ? () => setLightboxPhoto(p) : undefined}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxPhoto && (
        <PhotoDetailLightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />
      )}

      {savingPhoto && (
        <SaveToGalleryDialog
          open={true}
          onOpenChange={(v) => { if (!v) { setSavingPhoto(null); setIsSaving(false); } }}
          photo={savingPhoto}
          galleries={galleries}
          onSaveToExisting={(templateId) => { setIsSaving(true); saveToExistingMutation.mutate({ photo: savingPhoto, templateId }); }}
          onCreateNew={(name) => { setIsSaving(true); createAndSaveMutation.mutate({ photo: savingPhoto, name }); }}
          isSaving={isSaving}
        />
      )}

      <BulkSaveToGalleryDialog
        open={showBulkSave}
        onOpenChange={setShowBulkSave}
        imageUrls={selected}
        photos={photos}
        galleries={galleries}
        onDone={exitSelectMode}
      />

      <AlertDialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-playfair text-foreground">Delete {selected.length} photo{selected.length !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription className="font-dm text-muted-foreground">
              This will permanently delete the selected photos from all galleries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-dm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setShowBulkConfirm(false); bulkDeleteMutation.mutate(selected); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-dm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
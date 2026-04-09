import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, User, Tag, Trash2, Sparkles } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { isPro } from '../lib/subscription';

export default function GuideDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const [user, setUser] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => base44.entities.MarketplaceListing.filter({ id }),
    select: (data) => data[0],
    enabled: !!id
  });

  const { data: downloads = [] } = useQuery({
    queryKey: ['downloads', id, user?.email],
    queryFn: () => base44.entities.Download.filter({ listing_id: id, user_email: user.email }),
    enabled: !!id && !!user?.email
  });

  const alreadyDownloaded = downloads.length > 0;

  const { data: guidePhotos = [] } = useQuery({
    queryKey: ['guide_photos', id],
    queryFn: () => base44.entities.GuidePhoto.filter({ listing_id: id }, 'sort_order'),
    enabled: !!id
  });

  // Creates a Download record AND a ShootTemplate in the user's gallery
  const downloadMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Download.create({ listing_id: id, user_email: user.email });
      
      // Create new template for this guide
      const newTemplate = await base44.entities.ShootTemplate.create({
        name: listing.name,
        description: listing.description || '',
        cover_image: listing.cover_image || '',
        template_type: 'gallery',
        is_public: false,
        tags: listing.category ? [listing.category] : [],
        photo_count: guidePhotos.length,
        listing_id: id,
      });

      // Find existing "All Photos" template
      const templates = await base44.entities.ShootTemplate.list();
      const allPhotosTemplate = templates.find(t => t.name === 'All Photos');

      // Add all guide photos to new template and to All Photos if it exists
      let newTemplatePhotoCount = 0;
      let allPhotosPhotoCount = 0;
      if (allPhotosTemplate) {
        allPhotosPhotoCount = await base44.entities.TemplatePhoto.filter({ template_id: allPhotosTemplate.id }).then(p => p.length);
      }

      for (const photo of guidePhotos) {
        // Add to new template
        await base44.entities.TemplatePhoto.create({
          template_id: newTemplate.id,
          image_url: photo.image_url,
          description: photo.description || '',
          pose_category: photo.pose_category || '',
          sort_order: newTemplatePhotoCount
        });
        newTemplatePhotoCount++;

        // Add to All Photos if it exists
        if (allPhotosTemplate) {
          await base44.entities.TemplatePhoto.create({
            template_id: allPhotosTemplate.id,
            image_url: photo.image_url,
            description: photo.description || '',
            pose_category: photo.pose_category || '',
            sort_order: allPhotosPhotoCount
          });
          allPhotosPhotoCount++;
        }
      }

      // Update template photo counts
      await base44.entities.ShootTemplate.update(newTemplate.id, { photo_count: newTemplatePhotoCount });
      if (allPhotosTemplate) {
        await base44.entities.ShootTemplate.update(allPhotosTemplate.id, { photo_count: allPhotosPhotoCount });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downloads', id, user?.email] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      const download = downloads[0];

      // Delete the download record
      await base44.entities.Download.delete(download.id);

      // Get all guide photo image URLs
      const guideImageUrls = new Set(guidePhotos.map(p => p.image_url));

      // Find all TemplatePhotos belonging to this user that match those URLs
      const allTemplatePhotos = await base44.entities.TemplatePhoto.list();
      const toDelete = allTemplatePhotos.filter(p => guideImageUrls.has(p.image_url));

      await Promise.all(toDelete.map(p => base44.entities.TemplatePhoto.delete(p.id)));

      // Update photo counts for affected templates
      const affectedTemplateIds = [...new Set(toDelete.map(p => p.template_id))];
      await Promise.all(affectedTemplateIds.map(async (templateId) => {
        const remaining = await base44.entities.TemplatePhoto.filter({ template_id: templateId });
        await base44.entities.ShootTemplate.update(templateId, {
          photo_count: remaining.length,
          cover_image: remaining.length > 0 ? remaining[0].image_url : '',
        });
      }));

      // Delete any ShootTemplate that was created for this guide (same name, now empty or still named the same)
      const allTemplates = await base44.entities.ShootTemplate.list();
      const guideTemplate = allTemplates.find(t => t.name === listing.name && t.created_by === user.email);
      if (guideTemplate) {
        await base44.entities.ShootTemplate.delete(guideTemplate.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downloads', id, user?.email] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['all_photos'] });
    }
  });

  if (isLoading || !listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>);

  }

  return (
    <div className="min-h-screen bg-background pb-52">
      <PageHeader title={listing?.name || ''} backTo="/Marketplace" />

      {/* Cover Image */}
      {listing.cover_image &&
      <div className="w-full aspect-[4/3] bg-muted overflow-hidden">
          <img src={listing.cover_image} alt={listing.name} className="w-full h-full object-cover" />
        </div>
      }

      {/* Title & Meta */}
      <div className="px-5 pt-5 pb-1">
        <h1 className="text-primary text-3xl font-light uppercase tracking-wide leading-tight">{listing.name}</h1>

        <div className="flex items-center gap-4 mt-3">
          {listing.author &&
          <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-dm text-sm text-muted-foreground">{listing.author}</span>
            </div>
          }
          {listing.category &&
          <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-dm text-sm text-muted-foreground">{listing.category}</span>
            </div>
          }
          <span className="font-dm text-sm font-semibold text-primary ml-auto">
            {listing.price && listing.price > 0
              ? isPro(user)
                ? <span className="flex items-center gap-1">
                    <span className="line-through text-muted-foreground font-normal">${listing.price.toFixed(2)}</span>
                    <span className="text-primary">FREE</span>
                  </span>
                : `$${listing.price.toFixed(2)}`
              : 'Free'}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 mt-4 h-px bg-border" />

      {/* Description */}
      {listing.description &&
      <div className="px-5 pt-4">
          <p className="font-dm text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">About This Guide</p>
          <p className="font-dm text-sm text-foreground leading-relaxed">{listing.description}</p>
        </div>
      }

      {/* Pose Previews */}
      {(listing.preview_image_1 || listing.preview_image_2) &&
      <div className="px-5 pt-6">
          <p className="font-dm text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">Sample Poses</p>
          <div className="grid grid-cols-2 gap-4">
            {listing.preview_image_1 &&
          <div>
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted">
                  <img src={listing.preview_image_1} alt="Sample pose 1" className="w-full h-full object-cover" />
                  {listing.preview_image_1_direction && (
                    <div className="absolute inset-0 flex items-end">
                      <div className="w-full bg-gradient-to-t from-black/70 to-transparent px-3 py-3">
                        <p className="font-dm text-white text-xs leading-snug">{listing.preview_image_1_direction}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
          }
            {listing.preview_image_2 &&
          <div>
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted">
                  <img src={listing.preview_image_2} alt="Sample pose 2" className="w-full h-full object-cover" />
                  {listing.preview_image_2_direction && (
                    <div className="absolute inset-0 flex items-end">
                      <div className="w-full bg-gradient-to-t from-black/70 to-transparent px-3 py-3">
                        <p className="font-dm text-white text-xs leading-snug">{listing.preview_image_2_direction}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
          }
          </div>
        </div>
      }

      {/* What's Included note */}
      <div className="mx-5 mt-6 p-4 rounded-2xl bg-primary/8 border border-primary/20">
        <p className="font-dm text-xs text-primary font-medium mb-0.5">What you'll get</p>
        <p className="font-dm text-xs text-muted-foreground leading-relaxed">
          This guide will be added directly to your template gallery, ready to use in shoot mode.
        </p>
      </div>

      {/* Download CTA */}
      <div
        className="fixed left-0 right-0 px-5 py-4 bg-background/95 backdrop-blur-xl border-t border-border"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        
        {alreadyDownloaded ? (
          <button
            onClick={() => setShowRemoveConfirm(true)}
            className="w-full py-4 rounded-2xl bg-muted text-destructive font-dm text-sm font-semibold hover:bg-destructive/10 transition-colors select-none flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Remove from Downloaded Guides
          </button>
        ) : listing?.price > 0 && !isPro(user) ? (
          <button
            onClick={async () => {
              if (window.self !== window.top) {
                alert('Checkout only works from the published app.');
                return;
              }
              const res = await base44.functions.invoke('createCheckoutSession', {
                listing_id: id,
                success_url: `${window.location.origin}/GuideDetail?id=${id}`,
                cancel_url: `${window.location.origin}/GuideDetail?id=${id}`,
              });
              if (res.data?.url) window.location.href = res.data.url;
            }}
            disabled={!user}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-vina text-xl tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50 select-none flex items-center justify-center gap-3"
          >
            <Download className="w-5 h-5" />
            Buy — ${listing.price.toFixed(2)}
          </button>
        ) : (
          <button
            onClick={() => downloadMutation.mutate()}
            disabled={downloadMutation.isPending || !user}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-vina text-xl tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50 select-none flex items-center justify-center gap-3"
          >
            <Download className="w-5 h-5" />
            {downloadMutation.isPending ? 'Downloading…' : isPro(user) && listing?.price > 0 ? 'Download Free with Pro' : 'Download'}
          </button>
        )}
      </div>

      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-playfair text-foreground">Remove this guide?</AlertDialogTitle>
            <AlertDialogDescription className="font-dm text-muted-foreground">
              Are you sure you want to remove this guide? All photos connected with the guide will also be removed from your galleries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-dm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { removeMutation.mutate(); setShowRemoveConfirm(false); }}
              disabled={removeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-dm"
            >
              {removeMutation.isPending ? 'Removing…' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);

}
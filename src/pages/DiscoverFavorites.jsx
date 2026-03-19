import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Bookmark } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import DiscoverSaveToGalleryDialog from '@/components/discover/DiscoverSaveToGalleryDialog';
import ImageLightbox from '@/components/ui/ImageLightbox';

export default function DiscoverFavorites() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [savingPost, setSavingPost] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: favorites = [] } = useQuery({
    queryKey: ['discover_favorites', user?.email],
    queryFn: () => base44.entities.DiscoverFavorite.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: allPosts = [] } = useQuery({
    queryKey: ['discover_posts'],
    queryFn: () => base44.entities.DiscoverPost.list('-created_date'),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ShootTemplate.list('-created_date'),
  });

  const galleryTemplates = templates.filter(t => t.template_type !== 'shot_list');
  const favoritedPostIds = new Set(favorites.map(f => f.post_id));
  const favoritedPosts = allPosts.filter(p => favoritedPostIds.has(p.id));

  const unfavoriteMutation = useMutation({
    mutationFn: async (postId) => {
      const fav = favorites.find(f => f.post_id === postId);
      if (fav) await base44.entities.DiscoverFavorite.delete(fav.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discover_favorites', user?.email] }),
  });

  const saveToAllPhotosMutation = useMutation({
    mutationFn: async (post) => {
      let targetTemplate = galleryTemplates[0];
      if (!targetTemplate) {
        targetTemplate = await base44.entities.ShootTemplate.create({
          name: 'Saved from Discover',
          template_type: 'gallery',
          photo_count: 0,
        });
      }
      const existing = await base44.entities.TemplatePhoto.filter({ template_id: targetTemplate.id }, 'sort_order');
      await base44.entities.TemplatePhoto.create({
        template_id: targetTemplate.id,
        image_url: post.image_url,
        description: post.description || '',
        sort_order: existing.length,
      });
      await base44.entities.ShootTemplate.update(targetTemplate.id, {
        photo_count: existing.length + 1,
        cover_image: existing.length === 0 ? post.image_url : targetTemplate.cover_image,
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); setSavingPost(null); },
  });

  const saveToExistingMutation = useMutation({
    mutationFn: async ({ post, templateId }) => {
      const target = galleryTemplates.find(t => t.id === templateId);
      const existing = await base44.entities.TemplatePhoto.filter({ template_id: templateId }, 'sort_order');
      await base44.entities.TemplatePhoto.create({
        template_id: templateId,
        image_url: post.image_url,
        description: post.description || '',
        sort_order: existing.length,
      });
      await base44.entities.ShootTemplate.update(templateId, {
        photo_count: existing.length + 1,
        cover_image: existing.length === 0 ? post.image_url : target?.cover_image,
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); setSavingPost(null); },
  });

  const createAndSaveMutation = useMutation({
    mutationFn: async ({ post, name }) => {
      const newTemplate = await base44.entities.ShootTemplate.create({
        name,
        template_type: 'gallery',
        photo_count: 1,
        cover_image: post.image_url,
      });
      await base44.entities.TemplatePhoto.create({
        template_id: newTemplate.id,
        image_url: post.image_url,
        description: post.description || '',
        sort_order: 0,
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); setSavingPost(null); },
  });

  const isSaving = saveToAllPhotosMutation.isPending || saveToExistingMutation.isPending || createAndSaveMutation.isPending;

  return (
    <div className="min-h-screen bg-background pb-28">
      <div
        className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/Discover')}
            className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-colors select-none"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <h1 className="font-playfair text-lg font-semibold text-foreground">Favorites</h1>
          </div>
        </div>
      </div>

      <div className="p-4">
        {favoritedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Heart className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-playfair text-lg font-semibold text-foreground mb-1.5">No favorites yet</h3>
            <p className="font-dm text-muted-foreground text-sm max-w-[220px] leading-relaxed">
              Tap the heart on any photo in Discover to save it here.
            </p>
          </div>
        ) : (
          <div className="columns-2 gap-3">
            {favoritedPosts.map((post) => (
              <div
                key={post.id}
                className="break-inside-avoid mb-3 relative group rounded-2xl overflow-hidden bg-muted cursor-pointer"
                onClick={() => setLightboxImage(post.image_url)}
              >
                <img src={post.image_url} alt={post.category} className="w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between">
                    <span className="font-dm text-[10px] text-white/70 uppercase tracking-wider">{post.category}</span>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-red-400 hover:text-white transition-colors"
                        onClick={(e) => { e.stopPropagation(); unfavoriteMutation.mutate(post.id); }}
                      >
                        <Heart className="w-3.5 h-3.5 fill-red-400" />
                      </button>
                      <button
                        className="text-white/80 hover:text-white transition-colors"
                        onClick={(e) => { e.stopPropagation(); setSavingPost(post); }}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {savingPost && (
        <DiscoverSaveToGalleryDialog
          open={true}
          onOpenChange={(v) => { if (!v) setSavingPost(null); }}
          post={savingPost}
          galleries={galleryTemplates}
          onSaveToAllPhotos={() => saveToAllPhotosMutation.mutate(savingPost)}
          onSaveToExisting={(templateId) => saveToExistingMutation.mutate({ post: savingPost, templateId })}
          onCreateNew={(name) => createAndSaveMutation.mutate({ post: savingPost, name })}
          isSaving={isSaving}
        />
      )}

      {lightboxImage && (
        <ImageLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}
    </div>
  );
}
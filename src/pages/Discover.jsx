import React, { useState, useEffect } from 'react';
import { Search, Heart, Bookmark, TrendingUp, Plus, MoreVertical, Trash2, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import PullToRefresh from '../components/layout/PullToRefresh';
import PoseCategoryBar from '../components/ui/PoseCategoryBar';
import AddDiscoverPostDialog from '../components/discover/AddDiscoverPostDialog';
import DiscoverSaveToGalleryDialog from '../components/discover/DiscoverSaveToGalleryDialog';
import ImageLightbox from '../components/ui/ImageLightbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const SAMPLE_CATEGORIES = [
  'Wedding', 'Bridal', 'Couples', 'Portrait', 'Graduation', 'Maternity',
  'Newborn', 'Family', 'Fashion', 'Boudoir', 'Engagement',
];

export default function Discover() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [activePoseCategory, setActivePoseCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [savingPost, setSavingPost] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.role === 'admin';

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: userPosts = [] } = useQuery({
    queryKey: ['discover_posts'],
    queryFn: () => base44.entities.DiscoverPost.list('-created_date'),
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['discover_favorites', user?.email],
    queryFn: () => base44.entities.DiscoverFavorite.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ShootTemplate.list('-created_date'),
  });

  const galleryTemplates = templates.filter(t => t.template_type !== 'shot_list');
  const favoritedPostIds = new Set(favorites.map(f => f.post_id));

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DiscoverPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discover_posts'] });
      setShowAdd(false);
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (postId) => {
      if (favoritedPostIds.has(postId)) {
        const fav = favorites.find(f => f.post_id === postId);
        if (fav) await base44.entities.DiscoverFavorite.delete(fav.id);
      } else {
        await base44.entities.DiscoverFavorite.create({ post_id: postId, user_email: user.email });
      }
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

  const filtered = userPosts.filter(img => {
    if (activeCategory && img.category !== activeCategory) return false;
    if (activePoseCategory && img.pose_category && img.pose_category !== activePoseCategory) return false;
    if (search && !(img.category || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: ['discover_posts'] })}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="px-5 pb-5 flex items-center justify-between" style={{ paddingTop: 'max(3.5rem, env(safe-area-inset-top))' }}>
          <h1 className="font-vina text-4xl font-light uppercase tracking-widest text-primary">
            Discover
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/DiscoverFavorites')}
              className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors select-none relative"
            >
              <Heart className="w-5 h-5 text-red-500" />
              {favorites.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white font-dm text-[9px] flex items-center justify-center">
                  {favorites.length > 9 ? '9+' : favorites.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors select-none"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 mb-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search poses, styles..."
              className="pl-10 bg-muted border-border font-dm rounded-full"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 px-5 mb-2" style={{ scrollbarWidth: 'none' }}>
          {SAMPLE_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => {
                const next = activeCategory === cat ? null : cat;
                setActiveCategory(next);
                if (!next) setActivePoseCategory(null);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-dm font-medium whitespace-nowrap transition-all border ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Pose Category Filter — only shown once a category is selected */}
        {activeCategory && (
          <PoseCategoryBar activeCategory={activePoseCategory} onChange={setActivePoseCategory} />
        )}

        {/* Trending label */}
        <div className="flex items-center gap-2 px-5 mb-4">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <span className="font-dm text-xs font-semibold text-foreground uppercase tracking-wider">Trending</span>
        </div>

        {/* Masonry Grid */}
        <div className="px-5 pb-6 columns-2 gap-3">
          {filtered.length === 0 && (
            <div className="col-span-2 flex flex-col items-center justify-center py-20 text-center">
              <p className="font-dm text-muted-foreground text-sm">No photos yet. Be the first to share!</p>
            </div>
          )}
          {filtered.map((img) => {
            const isFavorited = favoritedPostIds.has(img.id);
            return (
              <div
                key={img.id}
                className="break-inside-avoid mb-3 group relative rounded-2xl overflow-hidden bg-muted cursor-pointer"
                onClick={() => setLightboxImage(img.image_url)}
              >
                <img src={img.image_url} alt={img.category} className="w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between">
                    <div>
                      {img.title && <p className="font-dm text-[10px] text-white font-medium">{img.title}</p>}
                      <span className="font-dm text-[10px] text-white/70 uppercase tracking-wider">{img.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-white/80 hover:text-white transition-colors"
                        onClick={(e) => { e.stopPropagation(); user && toggleFavoriteMutation.mutate(img.id); }}
                      >
                        <Heart className={`w-3.5 h-3.5 transition-all ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                      <button
                        className="text-white/80 hover:text-white transition-colors"
                        onClick={(e) => { e.stopPropagation(); setSavingPost(img); }}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AddDiscoverPostDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onSubmit={(data) => createMutation.mutate(data)}
      />

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
    </PullToRefresh>
  );
}
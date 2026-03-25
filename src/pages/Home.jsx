import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Camera, Settings, Search, X, ShoppingBag, Shuffle, Images, Image as ImageIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import TemplateCard from '../components/templates/TemplateCard';
import SelectableTemplateCard from '../components/templates/SelectableTemplateCard';
import CreateTemplateDialog from '../components/templates/CreateTemplateDialog';
import MarketplaceCard from '../components/marketplace/MarketplaceCard';
import PullToRefresh from '../components/layout/PullToRefresh';
import UpgradeModal from '../components/subscription/UpgradeModal';
import AddPhotoToGalleryFlow from '../components/photos/AddPhotoToGalleryFlow';
import { isPro, canCreateGallery, FREE_GALLERY_LIMIT } from '../lib/subscription';

function TemplateGrid({ templates, search, onClearSearch, onDelete, onRename, onChangeCover, selectMode, selected, onToggle }) {
  const filtered = templates.filter((t) =>
  t.name.toLowerCase().includes(search.toLowerCase())
  );
  if (filtered.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="font-dm text-muted-foreground text-sm">No templates match &ldquo;{search}&rdquo;</p>
      <button onClick={onClearSearch} className="mt-3 font-dm text-xs text-primary hover:underline">Clear search</button>
    </div>);

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* All Photos — permanent first card */}
      {!search && (
        <Link to="/AllPhotos">
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-primary/10 border-2 border-primary/20 flex flex-col items-center justify-center gap-2 hover:bg-primary/15 transition-colors">
            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-1">
              <Images className="w-6 h-6 text-primary" />
            </div>
            <span className="font-dm text-sm font-semibold text-primary">All Photos</span>

          </div>
        </Link>
      )}
      {filtered.map((t) => selectMode ?
      <SelectableTemplateCard
        key={t.id}
        template={t}
        selected={selected.includes(t.id)}
        onToggle={onToggle}
        onDelete={onDelete}
        onRename={onRename} /> :


      <TemplateCard key={t.id} template={t} onDelete={onDelete} onRename={onRename} onChangeCover={onChangeCover} />
      )}
    </div>);

}

export default function Home() {
  const [showCreate, setShowCreate] = useState(false);
  const [renaming, setRenaming] = useState(null);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAddPhotoMenu, setShowAddPhotoMenu] = useState(false);
  const [showAddPhotoFlow, setShowAddPhotoFlow] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: downloads = [] } = useQuery({
    queryKey: ['my_downloads', user?.email],
    queryFn: () => base44.entities.Download.filter({ user_email: user.email }),
    enabled: !!user?.email
  });

  const downloadedListingIds = downloads.map((d) => d.listing_id);

  const { data: downloadedListings = [] } = useQuery({
    queryKey: ['downloaded_listings', downloadedListingIds.join(',')],
    queryFn: async () => {
      if (downloadedListingIds.length === 0) return [];
      const all = await base44.entities.MarketplaceListing.list();
      return all.filter((l) => downloadedListingIds.includes(l.id));
    },
    enabled: downloadedListingIds.length > 0
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ShootTemplate.list('-updated_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ShootTemplate.create(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['templates'] });
      const previous = queryClient.getQueryData(['templates']);
      queryClient.setQueryData(['templates'], (old = []) => [
      { id: `optimistic-${Date.now()}`, ...data, photo_count: 0 },
      ...old]
      );
      return { previous };
    },
    onError: (_err, _data, ctx) => {
      queryClient.setQueryData(['templates'], ctx.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowCreate(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ShootTemplate.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['templates'] });
      const previous = queryClient.getQueryData(['templates']);
      queryClient.setQueryData(['templates'], (old = []) => old.filter((t) => t.id !== id));
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      queryClient.setQueryData(['templates'], ctx.previous);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] })
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['templates'] });
    await queryClient.invalidateQueries({ queryKey: ['my_downloads', user?.email] });
  };

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const deleteSelectedMutation = useMutation({
    mutationFn: (ids) => Promise.all(ids.map((id) => base44.entities.ShootTemplate.delete(id))),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['templates'] });
      const previous = queryClient.getQueryData(['templates']);
      queryClient.setQueryData(['templates'], (old = []) => old.filter((t) => !ids.includes(t.id)));
      return { previous };
    },
    onError: (_err, _ids, ctx) => {
      queryClient.setQueryData(['templates'], ctx.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSelected([]);
      setSelectMode(false);
    },
  });

  const handleDeleteSelected = () => deleteSelectedMutation.mutate(selected);

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected([]);
  };

  const selectedTemplates = templates.filter((t) => selected.includes(t.id));
  const selectedGalleries = selectedTemplates.filter((t) => t.template_type !== 'shot_list');
  const selectedShotLists = selectedTemplates.filter((t) => t.template_type === 'shot_list');
  const canShootTogether = selected.length >= 2 && selectedGalleries.length >= 1 && selectedShotLists.length <= 1;

  const handleShootTogether = () => {
    const galleryIds = selectedGalleries.map((t) => t.id).join(',');
    const shotListId = selectedShotLists[0]?.id || '';
    const params = new URLSearchParams({ ids: galleryIds });
    if (shotListId) params.set('shotlist', shotListId);
    navigate(`/ShootMode?${params.toString()}`);
  };

  const renameMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ShootTemplate.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['templates'] });
      const previous = queryClient.getQueryData(['templates']);
      queryClient.setQueryData(['templates'], (old = []) => old.map(t => t.id === id ? { ...t, ...data } : t));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['templates'], ctx.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setRenaming(null);
    }
  });

  const changeCoverMutation = useMutation({
    mutationFn: ({ id, cover_image }) => base44.entities.ShootTemplate.update(id, { cover_image }),
    onMutate: async ({ id, cover_image }) => {
      await queryClient.cancelQueries({ queryKey: ['templates'] });
      const previous = queryClient.getQueryData(['templates']);
      queryClient.setQueryData(['templates'], (old = []) => old.map(t => t.id === id ? { ...t, cover_image } : t));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['templates'], ctx.previous);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pb-6" style={{ paddingTop: 'max(3.5rem, env(safe-area-inset-top))' }}>
        {selectMode ?
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={exitSelectMode}
              className="px-4 py-2.5 rounded-full bg-muted font-dm text-sm text-foreground hover:bg-secondary transition-colors select-none whitespace-nowrap">
              
              Cancel
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={selected.length === 0}
              className="flex-1 py-2.5 rounded-full bg-destructive/15 text-destructive font-dm text-sm font-medium hover:bg-destructive/25 transition-colors disabled:opacity-30 select-none whitespace-nowrap">
              
              Delete{selected.length > 0 ? ` (${selected.length})` : ''}
            </button>
            {canShootTogether &&
            <button
              onClick={handleShootTogether}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-primary text-primary-foreground font-dm text-sm font-medium hover:bg-primary/90 transition-colors select-none whitespace-nowrap">
              
                <Shuffle className="w-3.5 h-3.5" />
                Shoot Together
              </button>
            }
          </div> :

          <div className="flex items-start justify-between mb-1">
            <div>
              <h1 className="text-4xl font-light uppercase tracking-widest" style={{ color: 'hsl(224 52% 28%)' }}>Your Collection</h1>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {templates.length > 0 &&
              <button
                onClick={() => setSelectMode(true)}
                className="px-4 py-2 rounded-full bg-muted font-dm text-sm text-foreground hover:bg-secondary transition-colors select-none">
                
                  Select
                </button>
              }
              <Link to="/Settings">
                <button aria-label="Settings" className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-colors select-none">
                  <Settings className="w-4.5 h-4.5" />
                </button>
              </Link>
              <div className="relative">
                <button
                  aria-label="Add"
                  onClick={() => setShowAddPhotoMenu(v => !v)}
                  className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors select-none">
                  <Plus className="w-5 h-5" />
                </button>
                {showAddPhotoMenu && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowAddPhotoMenu(false)} />
                    {/* Menu */}
                    <div className="absolute right-0 top-12 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden w-52">
                      <button
                        onClick={() => {
                          setShowAddPhotoMenu(false);
                          setShowAddPhotoFlow(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
                      >
                        <ImageIcon className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-dm text-sm text-foreground">Add Photo</span>
                      </button>
                      <div className="h-px bg-border" />
                      <button
                        onClick={() => {
                          setShowAddPhotoMenu(false);
                          const galleryCount = templates.filter(t => t.template_type !== 'shot_list').length;
                          if (!canCreateGallery(user, galleryCount)) {
                            setShowUpgrade(true);
                          } else {
                            setShowCreate(true);
                          }
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
                      >
                        <Plus className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-dm text-sm text-foreground">New Template</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          }
      </div>

      {/* Search */}
      <div className="px-5 mb-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="w-full bg-muted border border-border rounded-full pl-10 pr-10 py-2.5 font-dm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            
          {search &&
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            }
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-border mb-6" />

      {/* Templates Grid */}
      <div className="px-5 pb-6">
        {isLoading ?
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) =>
            <div key={i} className="aspect-[4/5] rounded-2xl bg-muted animate-pulse" />
            )}
          </div> :
          templates.length === 0 ?
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
              <Camera className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-playfair text-xl font-semibold text-foreground mb-2">No templates yet</h3>
            <p className="font-dm text-muted-foreground text-sm mb-7 max-w-[220px] leading-relaxed">
              Create your first shoot template to start planning
            </p>
            <button
              onClick={() => {
                const galleryCount = templates.filter(t => t.template_type !== 'shot_list').length;
                if (!canCreateGallery(user, galleryCount)) {
                  setShowUpgrade(true);
                } else {
                  setShowCreate(true);
                }
              }}
              className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-dm text-sm font-medium hover:bg-primary/90 transition-colors">
              
              Create Template
            </button>
          </div> :

          <TemplateGrid
            templates={templates}
            search={search}
            onClearSearch={() => setSearch('')}
            onDelete={(tmpl) => deleteMutation.mutate(tmpl.id)}
            onRename={(tmpl) => setRenaming(tmpl)}
            onChangeCover={(tmpl, imageUrl) => changeCoverMutation.mutate({ id: tmpl.id, cover_image: imageUrl })}
            selectMode={selectMode}
            selected={selected}
            onToggle={toggleSelect} />

          }
      </div>

      {/* Downloaded Guides */}
      {downloadedListings.length > 0 &&
        <div className="px-5 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-border" />
            <span className="font-dm text-[10px] uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-1.5">
              <ShoppingBag className="w-3 h-3" /> Downloaded Guides
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-3">
            {downloadedListings.map((listing) =>
            <MarketplaceCard key={listing.id} listing={listing} />
            )}
          </div>
        </div>
        }

      <AddPhotoToGalleryFlow open={showAddPhotoFlow} onOpenChange={setShowAddPhotoFlow} />

      <UpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        reason={`Free accounts are limited to ${FREE_GALLERY_LIMIT} galleries. Upgrade to Pro for unlimited galleries and photos.`}
      />

      <CreateTemplateDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onSubmit={(data) => createMutation.mutate(data)} />
        

      {renaming &&
        <CreateTemplateDialog
          open={true}
          onOpenChange={() => setRenaming(null)}
          title="Rename Template"
          initialName={renaming.name}
          initialDescription={renaming.description || ''}
          onSubmit={(data) => renameMutation.mutate({ id: renaming.id, data })} />

        }
    </div>
    </PullToRefresh>);

}
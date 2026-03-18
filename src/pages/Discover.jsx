import React, { useState } from 'react';
import { Search, Heart, Bookmark, TrendingUp, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PullToRefresh from '../components/layout/PullToRefresh';
import AddDiscoverPostDialog from '../components/discover/AddDiscoverPostDialog';

const SAMPLE_CATEGORIES = [
  'Wedding', 'Couples', 'Portrait', 'Graduation', 'Maternity',
  'Newborn', 'Family', 'Fashion', 'Boudoir', 'Engagement',
];



export default function Discover() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const queryClient = useQueryClient();

  const { data: userPosts = [] } = useQuery({
    queryKey: ['discover_posts'],
    queryFn: () => base44.entities.DiscoverPost.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DiscoverPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discover_posts'] });
      setShowAdd(false);
    },
  });

  const filtered = userPosts.filter(img => {
    if (activeCategory && img.category !== activeCategory) return false;
    if (search && !img.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: ['discover_posts'] })}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="px-5 pt-14 pb-5 flex items-center justify-between">
          <h1 className="font-vina text-4xl font-light uppercase tracking-widest text-primary">
            Discover
          </h1>
          <button
            onClick={() => setShowAdd(true)}
            className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors select-none"
          >
            <Plus className="w-5 h-5" />
          </button>
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
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
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

        {/* Trending label */}
        <div className="flex items-center gap-2 px-5 mb-4">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <span className="font-dm text-xs font-semibold text-foreground uppercase tracking-wider">Trending</span>
        </div>

        {/* Masonry Grid */}
        <div className="px-5 pb-6 columns-2 gap-3">
          {filtered.map((img) => (
            <div key={img.id} className="break-inside-avoid mb-3 group relative rounded-2xl overflow-hidden bg-muted">
              <img src={img.image_url} alt={img.category} className="w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between">
                  <div>
                    {img.title && <p className="font-dm text-[10px] text-white font-medium">{img.title}</p>}
                    <span className="font-dm text-[10px] text-white/70 uppercase tracking-wider">{img.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-white/80 hover:text-white transition-colors">
                      <Heart className="w-3.5 h-3.5" />
                    </button>
                    <button className="text-white/80 hover:text-white transition-colors">
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              {img.isUserPost && (
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-primary/80 backdrop-blur-sm">
                  <span className="font-dm text-[9px] text-white uppercase tracking-wide">Community</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <AddDiscoverPostDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onSubmit={(data) => createMutation.mutate(data)}
      />
    </PullToRefresh>
  );
}
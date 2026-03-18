import React, { useState } from 'react';
import { Search, Heart, Bookmark, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PullToRefresh from '../components/layout/PullToRefresh';

const SAMPLE_CATEGORIES = [
  'Wedding', 'Couples', 'Portrait', 'Graduation', 'Maternity',
  'Newborn', 'Family', 'Fashion', 'Boudoir', 'Engagement',
];

const SAMPLE_IMAGES = [
  { id: 1, url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=500&fit=crop', category: 'Wedding', likes: 234 },
  { id: 2, url: 'https://images.unsplash.com/photo-1529634597503-139d3726fed5?w=400&h=600&fit=crop', category: 'Couples', likes: 189 },
  { id: 3, url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop', category: 'Portrait', likes: 312 },
  { id: 4, url: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=400&h=700&fit=crop', category: 'Graduation', likes: 156 },
  { id: 5, url: 'https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?w=400&h=500&fit=crop', category: 'Maternity', likes: 278 },
  { id: 6, url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&h=600&fit=crop', category: 'Family', likes: 198 },
  { id: 7, url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=500&fit=crop', category: 'Fashion', likes: 445 },
  { id: 8, url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=600&fit=crop', category: 'Engagement', likes: 167 },
];

export default function Discover() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = SAMPLE_IMAGES.filter(img => {
    if (activeCategory && img.category !== activeCategory) return false;
    if (search && !img.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <PullToRefresh onRefresh={() => Promise.resolve()}>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-14 pb-5">
        <h1 className="font-vina text-4xl font-light uppercase tracking-widest text-primary">
          Discover
        </h1>
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
            <img src={img.url} alt={img.category} className="w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between">
                <span className="font-dm text-[10px] text-white/80 uppercase tracking-wider">{img.category}</span>
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
          </div>
        ))}
      </div>
    </div>
    </PullToRefresh>
  );
}
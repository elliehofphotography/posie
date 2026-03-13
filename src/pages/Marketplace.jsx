import React from 'react';
import { Download, Star, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const TEMPLATES = [
  { id: 1, name: '50 Wedding Couple Poses', author: 'Studio Elite', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop', price: 'Free', downloads: '2.4k', rating: 4.8, category: 'Wedding' },
  { id: 2, name: '30 Engagement Shoot Poses', author: 'Love Stories Co', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=300&fit=crop', price: '$4.99', downloads: '1.8k', rating: 4.9, category: 'Engagement' },
  { id: 3, name: 'Graduation Photo Guide', author: 'Grad Photos Pro', image: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=400&h=300&fit=crop', price: 'Free', downloads: '3.1k', rating: 4.7, category: 'Graduation' },
  { id: 4, name: 'Studio Portrait Setups', author: 'Portrait Master', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop', price: '$9.99', downloads: '890', rating: 4.9, category: 'Portrait' },
  { id: 5, name: 'Family Session Bundle', author: 'Family First', image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&h=300&fit=crop', price: '$2.99', downloads: '1.2k', rating: 4.6, category: 'Family' },
  { id: 6, name: 'Fashion Editorial Poses', author: 'Vogue Style', image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=300&fit=crop', price: '$7.99', downloads: '670', rating: 4.8, category: 'Fashion' },
];

export default function Marketplace() {
  return (
    <div className="min-h-screen px-5 pt-14 pb-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Marketplace</h1>
        <p className="text-muted-foreground text-sm">Curated shoot templates by professionals</p>
      </div>

      {/* Featured */}
      <div className="relative rounded-2xl overflow-hidden mb-6 aspect-[16/9] bg-secondary">
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=450&fit=crop"
          alt="Featured"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <Badge className="bg-primary text-primary-foreground border-0 mb-2 text-[10px]">
            <Crown className="w-3 h-3 mr-1" /> Featured
          </Badge>
          <h2 className="text-white text-lg font-bold">Complete Wedding Photography Pack</h2>
          <p className="text-white/60 text-xs mt-1">200+ poses, lighting guides & shot lists</p>
        </div>
      </div>

      {/* Template List */}
      <div className="space-y-3">
        {TEMPLATES.map(t => (
          <div key={t.id} className="flex gap-3 p-3 rounded-xl bg-card border border-border">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary shrink-0">
              <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground leading-tight truncate">{t.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t.author}</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-primary fill-primary" />
                  <span className="text-xs text-foreground font-medium">{t.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{t.downloads}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {t.price}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
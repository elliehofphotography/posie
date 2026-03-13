import React from 'react';
import { Download, Star, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-14 pb-5">
        <p className="font-dm text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Browse</p>
        <h1 className="font-playfair text-3xl font-semibold text-foreground">Marketplace</h1>
      </div>

      {/* Featured Banner */}
      <div className="mx-5 mb-6 relative rounded-2xl overflow-hidden aspect-[16/8] bg-muted">
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=400&fit=crop"
          alt="Featured"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
        <div className="absolute inset-0 p-5 flex flex-col justify-end">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="font-dm text-[10px] uppercase tracking-widest text-white/70">Featured</span>
          </div>
          <h2 className="font-playfair text-white text-lg font-semibold leading-snug">Complete Wedding<br />Photography Pack</h2>
          <p className="font-dm text-white/55 text-xs mt-1">200+ poses · lighting guides · shot lists</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 flex items-center gap-3 mb-5">
        <div className="h-px flex-1 bg-border" />
        <span className="font-dm text-[10px] uppercase tracking-[0.15em] text-muted-foreground">All Templates</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Template List */}
      <div className="px-5 pb-6 space-y-3">
        {TEMPLATES.map(t => (
          <div key={t.id} className="flex gap-3.5 p-3.5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
            <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-muted shrink-0">
              <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 py-0.5">
              <h3 className="font-playfair text-sm font-semibold text-foreground leading-snug">{t.name}</h3>
              <p className="font-dm text-xs text-muted-foreground mt-0.5">{t.author}</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-primary fill-primary" />
                  <span className="font-dm text-xs text-foreground font-medium">{t.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="w-3 h-3 text-muted-foreground" />
                  <span className="font-dm text-xs text-muted-foreground">{t.downloads}</span>
                </div>
                <span className={`font-dm text-xs font-semibold ml-auto ${t.price === 'Free' ? 'text-accent-foreground' : 'text-primary'}`}>
                  {t.price}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
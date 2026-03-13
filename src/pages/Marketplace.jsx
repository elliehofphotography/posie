import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import AdminGuideSheet from '@/components/marketplace/AdminGuideSheet';
import MarketplaceCard from '../components/marketplace/MarketplaceCard';

export default function Marketplace() {
  const [user, setUser] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: listings = [], refetch } = useQuery({
    queryKey: ['marketplace_listings'],
    queryFn: () => base44.entities.MarketplaceListing.filter({ is_published: true }, '-created_date'),
  });

  const isAdmin = user?.role === 'admin';
  const featured = listings[0];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-5 flex items-end justify-between">
        <div>
          <p className="font-dm text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Browse</p>
          <h1 className="font-playfair text-3xl font-semibold text-foreground">Marketplace</h1>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAdmin(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground font-dm text-sm font-medium hover:bg-primary/90 transition-colors select-none mb-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Guide
          </button>
        )}
      </div>

      {/* Featured Banner */}
      {featured && (
        <Link to={createPageUrl(`GuideDetail?id=${featured.id}`)}>
          <div className="mx-5 mb-6 relative rounded-2xl overflow-hidden aspect-[16/8] bg-muted">
            {featured.cover_image && (
              <img src={featured.cover_image} alt={featured.name} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
            <div className="absolute inset-0 p-5 flex flex-col justify-end">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="font-dm text-[10px] uppercase tracking-widest text-white/70">Featured</span>
              </div>
              <h2 className="font-playfair text-white text-lg font-semibold leading-snug">{featured.name}</h2>
              <p className="font-dm text-white/55 text-xs mt-1">{featured.author}</p>
            </div>
          </div>
        </Link>
      )}

      {/* Divider */}
      <div className="mx-5 flex items-center gap-3 mb-5">
        <div className="h-px flex-1 bg-border" />
        <span className="font-dm text-[10px] uppercase tracking-[0.15em] text-muted-foreground">All Guides</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Listing cards */}
      <div className="px-5 pb-6 space-y-3">
        {listings.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-dm text-muted-foreground text-sm">No guides available yet.</p>
          </div>
        ) : (
          listings.map(listing => (
            <MarketplaceCard key={listing.id} listing={listing} />
          ))
        )}
      </div>

      {isAdmin && (
        <AdminGuideSheet open={showAdmin} onOpenChange={setShowAdmin} onSaved={refetch} />
      )}
    </div>
  );
}
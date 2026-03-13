import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MarketplaceCard({ listing }) {
  const priceLabel = listing.price === 0 ? 'Free' : `$${listing.price.toFixed(2)}`;

  return (
    <Link to={createPageUrl(`GuideDetail?id=${listing.id}`)}>
      <div className="flex gap-3.5 p-3.5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
        <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-muted shrink-0">
          {listing.cover_image && (
            <img src={listing.cover_image} alt={listing.name} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <h3 className="font-playfair text-sm font-semibold text-foreground leading-snug">{listing.name}</h3>
          <p className="font-dm text-xs text-muted-foreground mt-0.5">{listing.author}</p>
          <div className="flex items-center mt-2">
            {listing.category && (
              <span className="font-dm text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground mr-2">{listing.category}</span>
            )}
            <span className={`font-dm text-xs font-semibold ml-auto ${listing.price === 0 ? 'text-accent-foreground' : 'text-primary'}`}>
              {priceLabel}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
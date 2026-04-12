import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MoreVertical, Pencil } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function MarketplaceCard({ listing, isAdmin, onEdit }) {
  return (
    <div className="relative">
      <Link to={createPageUrl(`GuideDetail?id=${listing.id}`)}>
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border-2 border-secondary hover:border-primary/40 transition-colors">
          <div className="w-[80px] h-[80px] rounded-xl overflow-hidden bg-muted shrink-0">
            {listing.cover_image && (
              <img src={listing.cover_image} alt={listing.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-playfair text-base font-bold text-primary uppercase leading-tight">{listing.name}</h3>
            <p className="font-dm text-sm text-secondary mt-1">{listing.author}</p>
            <div className="flex items-center mt-2.5">
              {listing.category && (
                <span className="font-dm text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">{listing.category}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {listing.price && listing.price > 0 && (
              <span className="font-playfair text-lg font-bold text-primary">${listing.price.toFixed(2)}</span>
            )}
          </div>
        </div>
      </Link>

      {isAdmin && (
        <div className="absolute top-1/2 right-3 -translate-y-1/2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors select-none"
                onClick={(e) => e.preventDefault()}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border font-dm">
              <DropdownMenuItem onClick={() => onEdit(listing)}>
                <Pencil className="w-4 h-4 mr-2" /> Edit Guide
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MoreVertical, Pencil } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function MarketplaceCard({ listing, isAdmin, onEdit }) {
  return (
    <div className="relative">
      <Link to={createPageUrl(`GuideDetail?id=${listing.id}`)}>
        <div className="flex gap-3.5 p-3.5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors pr-12">
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
                <span className="font-dm text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{listing.category}</span>
              )}
            </div>
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
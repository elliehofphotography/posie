import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function DownloadedGuides() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: downloads = [] } = useQuery({
    queryKey: ['downloads', user?.email],
    queryFn: () => base44.entities.Download.filter({ user_email: user.email }),
    enabled: !!user?.email
  });

  const { data: listings = [] } = useQuery({
    queryKey: ['listings'],
    queryFn: () => base44.entities.MarketplaceListing.list()
  });

  const downloadedListings = listings.filter(l => downloads.some(d => d.listing_id === l.id));

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div
        className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-colors select-none">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-playfair text-lg font-semibold text-foreground">Downloaded Guides</h1>
            <p className="font-dm text-xs text-muted-foreground">{downloadedListings.length} guides</p>
          </div>
        </div>
      </div>

      {/* Guides Grid */}
      <div className="p-4 space-y-3">
        {downloadedListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Zap className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-playfair text-lg font-semibold text-foreground mb-1.5">No guides yet</h3>
            <p className="font-dm text-muted-foreground text-sm max-w-[200px] leading-relaxed">
              Download guides from the marketplace to view them here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {downloadedListings.map((listing) => (
              <button
                key={listing.id}
                onClick={() => navigate(`/GuideDetail?id=${listing.id}`)}
                className="w-full text-left rounded-2xl overflow-hidden border border-border bg-card hover:bg-muted transition-colors"
              >
                <div className="flex gap-3 p-3">
                  {listing.cover_image && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img src={listing.cover_image} alt={listing.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-playfair text-sm font-semibold text-foreground uppercase leading-tight truncate">{listing.name}</h3>
                    {listing.author && (
                      <p className="font-dm text-xs text-muted-foreground mt-1">{listing.author}</p>
                    )}
                    {listing.description && (
                      <p className="font-dm text-xs text-muted-foreground mt-1.5 line-clamp-2">{listing.description}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
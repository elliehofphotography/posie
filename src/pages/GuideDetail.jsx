import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function GuideDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const [user, setUser] = useState(null);
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => base44.entities.MarketplaceListing.filter({ id }),
    select: data => data[0],
    enabled: !!id,
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases', id, user?.email],
    queryFn: () => base44.entities.Purchase.filter({ listing_id: id, user_email: user.email }),
    enabled: !!id && !!user?.email,
  });

  const alreadyOwned = purchases.length > 0;
  const priceLabel = listing?.price === 0 ? 'Free' : listing?.price ? `$${listing.price.toFixed(2)}` : '';
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const purchaseMutation = useMutation({
    mutationFn: () => base44.entities.Purchase.create({ listing_id: id, user_email: user.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases', id, user?.email] });
    },
  });

  const handlePurchase = async () => {
    if (!listing || !user) return;

    if (listing.price === 0) {
      purchaseMutation.mutate();
      return;
    }

    // Check if running in iframe (preview mode)
    if (window.self !== window.top) {
      alert('Checkout only works from the published app. Please open the app in a new tab.');
      return;
    }

    setCheckoutLoading(true);
    const response = await base44.functions.invoke('createCheckoutSession', {
      listing_id: id,
      success_url: `${window.location.origin}/GuideDetail?id=${id}&purchased=true`,
      cancel_url: `${window.location.origin}/GuideDetail?id=${id}`,
    });
    setCheckoutLoading(false);

    if (response.data?.url) {
      window.location.href = response.data.url;
    }
  };

  // Handle return from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('purchased') === 'true') {
      queryClient.invalidateQueries({ queryKey: ['purchases', id, user?.email] });
    }
  }, [user?.email]);

  if (isLoading || !listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div
        className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-colors select-none"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Cover */}
      {listing.cover_image && (
        <div className="aspect-[4/3] w-full bg-muted">
          <img src={listing.cover_image} alt={listing.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="px-5 pt-5 space-y-5">
        <div>
          <h1 className="font-playfair text-2xl font-semibold text-foreground leading-snug">{listing.name}</h1>
          {listing.author && <p className="font-dm text-sm text-muted-foreground mt-1">by {listing.author}</p>}
          <div className="flex items-center gap-2 mt-2">
            {listing.category && (
              <span className="font-dm text-[10px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{listing.category}</span>
            )}
            <span className={`font-dm text-sm font-semibold ${listing.price === 0 ? 'text-accent-foreground' : 'text-primary'}`}>
              {priceLabel}
            </span>
          </div>
        </div>

        {listing.description && (
          <div>
            <p className="font-dm text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">About</p>
            <p className="font-dm text-sm text-foreground leading-relaxed">{listing.description}</p>
          </div>
        )}

        {/* Pose Previews */}
        {(listing.preview_image_1 || listing.preview_image_2) && (
          <div>
            <p className="font-dm text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Pose Previews</p>
            <div className="grid grid-cols-2 gap-3">
              {listing.preview_image_1 && (
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted">
                  <img src={listing.preview_image_1} alt="Preview 1" className="w-full h-full object-cover" />
                </div>
              )}
              {listing.preview_image_2 && (
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted">
                  <img src={listing.preview_image_2} alt="Preview 2" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Purchase CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-background/90 backdrop-blur-xl border-t border-border"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {alreadyOwned ? (
          <div className="flex items-center justify-center gap-2 py-3 rounded-full bg-muted text-muted-foreground font-dm text-sm">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            Added to your collection
          </div>
        ) : (
          <button
            onClick={handlePurchase}
            disabled={purchaseMutation.isPending || checkoutLoading || !user}
            className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-dm text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 select-none"
          >
            {purchaseMutation.isPending || checkoutLoading
              ? 'Processing…'
              : listing.price === 0
              ? 'Add to Collection — Free'
              : `Purchase — ${priceLabel}`}
          </button>
        )}
      </div>
    </div>
  );
}
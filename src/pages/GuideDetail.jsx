import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Download, User, Tag } from 'lucide-react';
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
    select: (data) => data[0],
    enabled: !!id
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases', id, user?.email],
    queryFn: () => base44.entities.Purchase.filter({ listing_id: id, user_email: user.email }),
    enabled: !!id && !!user?.email
  });

  const alreadyOwned = purchases.length > 0;

  // Creates a Purchase record AND a ShootTemplate in the user's gallery
  const downloadMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Purchase.create({ listing_id: id, user_email: user.email });
      await base44.entities.ShootTemplate.create({
        name: listing.name,
        description: listing.description || '',
        cover_image: listing.cover_image || '',
        template_type: 'gallery',
        is_public: false,
        tags: listing.category ? [listing.category] : []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases', id, user?.email] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });

  if (isLoading || !listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>);

  }

  return (
    <div className="min-h-screen bg-background pb-52">
      {/* Sticky Header */}
      <div
        className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        
        <button
          onClick={() => navigate(-1)}
          className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-colors select-none">
          
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Cover Image */}
      {listing.cover_image &&
      <div className="w-full aspect-[4/3] bg-muted overflow-hidden">
          <img src={listing.cover_image} alt={listing.name} className="w-full h-full object-cover" />
        </div>
      }

      {/* Title & Meta */}
      <div className="px-5 pt-5 pb-1">
        <h1 className="text-primary text-3xl font-light uppercase tracking-wide leading-tight">{listing.name}</h1>

        <div className="flex items-center gap-4 mt-3">
          {listing.author &&
          <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-dm text-sm text-muted-foreground">{listing.author}</span>
            </div>
          }
          {listing.category &&
          <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-dm text-sm text-muted-foreground">{listing.category}</span>
            </div>
          }
          <span className="font-dm text-sm font-semibold text-primary ml-auto">Free</span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 mt-4 h-px bg-border" />

      {/* Description */}
      {listing.description &&
      <div className="px-5 pt-4">
          <p className="font-dm text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">About This Guide</p>
          <p className="font-dm text-sm text-foreground leading-relaxed">{listing.description}</p>
        </div>
      }

      {/* Pose Previews */}
      {(listing.preview_image_1 || listing.preview_image_2) &&
      <div className="px-5 pt-6">
          <p className="font-dm text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">Sample Poses</p>
          <div className="grid grid-cols-2 gap-4">
            {listing.preview_image_1 &&
          <div>
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted mb-2">
                  <img src={listing.preview_image_1} alt="Sample pose 1" className="w-full h-full object-cover" />
                </div>
                {listing.preview_image_1_direction &&
            <p className="font-dm text-xs text-foreground leading-snug">{listing.preview_image_1_direction}</p>
            }
              </div>
          }
            {listing.preview_image_2 &&
          <div>
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted mb-2">
                  <img src={listing.preview_image_2} alt="Sample pose 2" className="w-full h-full object-cover" />
                </div>
                {listing.preview_image_2_direction &&
            <p className="font-dm text-xs text-foreground leading-snug">{listing.preview_image_2_direction}</p>
            }
              </div>
          }
          </div>
        </div>
      }

      {/* What's Included note */}
      <div className="mx-5 mt-6 p-4 rounded-2xl bg-primary/8 border border-primary/20">
        <p className="font-dm text-xs text-primary font-medium mb-0.5">What you'll get</p>
        <p className="font-dm text-xs text-muted-foreground leading-relaxed">
          This guide will be added directly to your template gallery, ready to use in shoot mode.
        </p>
      </div>

      {/* Download CTA */}
      <div
        className="fixed left-0 right-0 px-5 py-4 bg-background/95 backdrop-blur-xl border-t border-border"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        
        {alreadyOwned ?
        <div className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-muted text-muted-foreground font-dm text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Added to your gallery
          </div> :

        <button
          onClick={() => downloadMutation.mutate()}
          disabled={downloadMutation.isPending || !user}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-vina text-xl tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50 select-none flex items-center justify-center gap-3">
          
            <Download className="w-5 h-5" />
            {downloadMutation.isPending ? 'Downloading…' : 'Download'}
          </button>
        }
      </div>
    </div>);

}
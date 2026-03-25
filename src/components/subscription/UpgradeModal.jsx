import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const PLANS = [
  { id: 'monthly', label: 'Monthly', price: '$3.99', period: '/month', savings: null },
  { id: 'yearly', label: 'Yearly', price: '$29.99', period: '/year', savings: 'Save 37%' },
];

const PERKS = [
  'Unlimited galleries',
  'Unlimited photos per gallery',
  'All guides included free',
  'Access to Discover',
];

export default function UpgradeModal({ open, onOpenChange, reason }) {
  const [plan, setPlan] = useState('yearly');
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    // Block in iframe
    if (window.self !== window.top) {
      alert('Subscription checkout only works from the published app.');
      return;
    }
    setLoading(true);
    const res = await base44.functions.invoke('createSubscriptionCheckout', { plan });
    setLoading(false);
    if (res.data?.url) {
      window.location.href = res.data.url;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <DialogTitle className="font-vina text-2xl text-primary tracking-widest uppercase">
              Go Pro
            </DialogTitle>
          </div>
          {reason && (
            <p className="font-dm text-sm text-muted-foreground mt-1">{reason}</p>
          )}
        </DialogHeader>

        {/* Perks */}
        <ul className="space-y-2 my-1">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-center gap-2.5 font-dm text-sm text-foreground">
              <Check className="w-4 h-4 text-primary shrink-0" />
              {perk}
            </li>
          ))}
        </ul>

        {/* Plan selector */}
        <div className="flex gap-2 mt-2">
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlan(p.id)}
              className={cn(
                'flex-1 rounded-2xl border p-3 text-left transition-colors',
                plan === p.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted'
              )}
            >
              <p className="font-dm text-xs text-muted-foreground">{p.label}</p>
              <p className="font-dm text-lg font-semibold text-foreground leading-tight">{p.price}</p>
              <p className="font-dm text-xs text-muted-foreground">{p.period}</p>
              {p.savings && (
                <span className="mt-1 inline-block px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
                  {p.savings}
                </span>
              )}
            </button>
          ))}
        </div>

        <Button onClick={handleUpgrade} disabled={loading} className="w-full mt-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade Now'}
        </Button>

        <p className="font-dm text-[10px] text-muted-foreground text-center">
          Cancel anytime. Billed via Stripe.
        </p>
      </DialogContent>
    </Dialog>
  );
}
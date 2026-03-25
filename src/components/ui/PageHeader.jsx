import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Centralized, mobile-native page header with consistent back button and title.
 * Usage:
 *   <PageHeader title="Settings" />                     — uses navigate(-1)
 *   <PageHeader title="Home" backTo="/Home" />           — navigates to specific path
 *   <PageHeader title="Gallery" onBack={() => ...} />   — custom back handler
 *   <PageHeader title="Gallery" right={<Button />} />   — right-side actions
 */
export default function PageHeader({ title, subtitle, onBack, backTo, right, className = '' }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) return onBack();
    if (backTo) return navigate(backTo);
    navigate(-1);
  };

  return (
    <div
      className={`sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border px-4 ${className}`}
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={handleBack}
            aria-label="Go back"
            className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-colors select-none shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="font-playfair text-lg font-semibold text-foreground leading-tight truncate">{title}</h1>
            {subtitle && <p className="font-dm text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {right && (
          <div className="flex items-center gap-2 shrink-0">
            {right}
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { List, MoreVertical, Trash2, Pencil, Share2 } from 'lucide-react';
import MobileMenu from '@/components/ui/mobile-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function ShotListCard({ template, onDelete, onRename }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  const handleShare = () => {
    const url = `${window.location.origin}/SharedGallery?id=${template.id}`;
    if (navigator.share) {
      navigator.share({ title: template.name, url }).catch(() => {
        navigator.clipboard.writeText(url);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2500);
      });
    } else {
      navigator.clipboard.writeText(url);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
    }
  };

  return (
    <div className="group relative">
      <Link to={`/ShotList?id=${template.id}`} className="block">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
          {/* Icon */}
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <List className="w-4.5 h-4.5 text-primary" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-dm text-sm font-semibold text-foreground truncate">{template.name}</p>
            {template.description && (
              <p className="font-dm text-xs text-muted-foreground truncate mt-0.5">{template.description}</p>
            )}
          </div>

          {/* Chevron */}
          <svg className="w-4 h-4 text-muted-foreground shrink-0 mr-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>

      <MobileMenu
        trigger={
          <button
            aria-label="Shot list options"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 text-muted-foreground hover:text-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        }
        items={[
          { label: 'Rename', icon: <Pencil className="w-4 h-4" />, onClick: () => onRename(template) },
          ...(!template.listing_id ? [{ label: 'Share Shot List', icon: <Share2 className="w-4 h-4" />, onClick: handleShare }] : []),
          { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: () => setTimeout(() => setShowDeleteConfirm(true), 300), destructive: true },
        ]}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        title="Shot List Options"
      />

      {showShareToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-foreground text-background font-dm text-sm shadow-lg whitespace-nowrap">
          Link copied to clipboard!
        </div>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-playfair text-foreground">Delete this shot list?</AlertDialogTitle>
            <AlertDialogDescription className="font-dm text-muted-foreground">
              Are you sure you want to delete &ldquo;{template.name}&rdquo;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-dm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setShowDeleteConfirm(false); onDelete(template); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-dm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
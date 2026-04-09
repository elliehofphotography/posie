import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, MoreVertical, Trash2, Pencil, List, Images, Copy, Share2 } from 'lucide-react';
import MobileMenu from '@/components/ui/mobile-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import EditGallerySheet from './EditGallerySheet';

export default function TemplateCard({ template, onDelete, onRename, onChangeCover, onDuplicate }) {
  const isShotList = template.template_type === 'shot_list';
  const linkTo = isShotList
    ? `/ShotList?id=${template.id}`
    : `/Template?id=${template.id}`;

  const [showEditGallery, setShowEditGallery] = useState(false);
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
      <Link to={linkTo} className="block">
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
          {template.cover_image && !isShotList ? (
            <img
              src={template.cover_image}
              alt={template.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              {isShotList
                ? <List className="w-10 h-10 text-muted-foreground/40" />
                : <Camera className="w-10 h-10 text-muted-foreground/40" />}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Type badge */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
            {isShotList
              ? <List className="w-2.5 h-2.5 text-white/80" />
              : <Images className="w-2.5 h-2.5 text-white/80" />}
            <span className="font-dm text-[9px] text-white/80 uppercase tracking-wide">
              {isShotList ? 'Shot List' : 'Gallery'}
            </span>
          </div>

          {/* Bottom label */}
          <div className="absolute bottom-0 left-0 right-0 p-3.5">
            <h3 className="text-white font-dm font-medium text-sm leading-snug">{template.name}</h3>
            <p className="text-white/60 font-dm text-[11px] mt-0.5 tracking-wide">
              {isShotList ? 'Shot list' : `${template.photo_count || 0} poses`}
            </p>
          </div>
        </div>
      </Link>

      <MobileMenu
        trigger={
          <button aria-label="Template options" className="absolute top-2.5 right-2.5 h-9 w-9 bg-white/25 backdrop-blur-sm text-white hover:bg-white/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-4 h-4" />
          </button>
        }
        items={[
          ...(isShotList ? [
            { label: 'Rename', icon: <Pencil className="w-4 h-4" />, onClick: () => onRename(template) },
          ] : [
            { label: 'Edit', icon: <Pencil className="w-4 h-4" />, onClick: () => setShowEditGallery(true) },
            { label: 'Duplicate Gallery', icon: <Copy className="w-4 h-4" />, onClick: () => onDuplicate && onDuplicate(template) },
          ]),
          { label: isShotList ? 'Share Shot List' : 'Share Gallery', icon: <Share2 className="w-4 h-4" />, onClick: handleShare },
          { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: () => setTimeout(() => setShowDeleteConfirm(true), 300), destructive: true },
        ]}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        title="Template Options"
      />

      <EditGallerySheet
        open={showEditGallery}
        onOpenChange={setShowEditGallery}
        template={template}
      />

      {/* Share toast */}
      {showShareToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-foreground text-background font-dm text-sm shadow-lg whitespace-nowrap">
          Link copied to clipboard!
        </div>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-playfair text-foreground">Delete this {isShotList ? 'shot list' : 'gallery'}?</AlertDialogTitle>
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
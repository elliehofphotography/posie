import React, { useState } from 'react';
import { MoreVertical, Trash2, Pencil, FolderPlus, FolderMinus } from 'lucide-react';
import MobileMenu from '@/components/ui/mobile-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const priorityDots = {
  red: 'bg-red-500',
  yellow: 'bg-yellow-400',
  green: 'bg-green-500',
};

const categoryLabels = {
  standing: 'Standing',
  sitting: 'Sitting',
  walking: 'Walking',
  close_up: 'Close-up',
  wide_shot: 'Wide Shot',
  detail: 'Detail',
  interaction: 'Interaction',
  other: 'Other',
};

export default function PhotoCard({ photo, onEdit, onDelete, onRemove, onClick, onSaveToGallery, hideEdit, hideDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteChoice, setShowDeleteChoice] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const menuItems = [];
  if (!hideEdit) menuItems.push({ label: 'Edit', icon: <Pencil className="w-4 h-4" />, onClick: () => onEdit(photo) });
  if (onSaveToGallery) menuItems.push({ label: 'Save to Another Gallery', icon: <FolderPlus className="w-4 h-4" />, onClick: () => onSaveToGallery(photo) });
  const hasDeleteOptions = onRemove || !hideDelete;
  if (hasDeleteOptions) menuItems.push({ label: 'Delete Photo', icon: <Trash2 className="w-4 h-4" />, onClick: () => setTimeout(() => setShowDeleteChoice(true), 300), destructive: true });

  return (
    <div className="group relative cursor-pointer" onClick={onClick}>
      <div className="relative rounded-2xl overflow-hidden bg-muted">
        <img
          src={photo.image_url}
          alt={photo.description || 'Inspiration'}
          className="w-full h-auto block"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Priority dot */}
        <div className={`absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full ${priorityDots[photo.color_priority] || priorityDots.green} ring-2 ring-white/50`} />

        {/* Category */}
        {photo.pose_category && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm font-dm text-[10px] text-white/90 tracking-wide">
            {categoryLabels[photo.pose_category] || photo.pose_category}
          </div>
        )}
      </div>

      <button
        className="absolute top-2 right-2 h-9 w-9 bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 rounded-full flex items-center justify-center"
        onClick={(e) => { e.stopPropagation(); setMenuOpen(true); }}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      <MobileMenu
        trigger={null}
        items={menuItems}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        title="Photo Options"
      />

      {/* Delete choice dialog */}
      <AlertDialog open={showDeleteChoice} onOpenChange={setShowDeleteChoice}>
        <AlertDialogContent className="bg-card border-border" onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-playfair text-foreground">Delete Photo</AlertDialogTitle>
            <AlertDialogDescription className="font-dm text-muted-foreground">
              Would you like to remove this photo from this gallery only, or delete it everywhere?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            {onRemove && (
              <AlertDialogAction
                onClick={() => { setShowDeleteChoice(false); onRemove(photo); }}
                className="bg-muted text-foreground hover:bg-secondary font-dm w-full"
              >
                Remove from this Gallery
              </AlertDialogAction>
            )}
            {!hideDelete && (
              <AlertDialogAction
                onClick={() => { setShowDeleteChoice(false); setShowConfirmDelete(true); }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-dm w-full"
              >
                Delete from Everywhere
              </AlertDialogAction>
            )}
            <AlertDialogCancel className="font-dm w-full">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm full delete dialog */}
      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent className="bg-card border-border" onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-playfair text-foreground">Delete this photo?</AlertDialogTitle>
            <AlertDialogDescription className="font-dm text-muted-foreground">
              Are you sure you want to delete this photo? Doing so will remove the photo from all affiliated galleries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-dm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setShowConfirmDelete(false); onDelete(photo); }}
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
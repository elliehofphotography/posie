import React from 'react';
import { MoreVertical, Trash2, Pencil, FolderPlus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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

export default function PhotoCard({ photo, onEdit, onDelete, onClick, onSaveToGallery, hideEdit, hideDelete }) {
  return (
    <div className="group relative cursor-pointer" onClick={onClick}>
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted">
        <img
          src={photo.image_url}
          alt={photo.description || 'Inspiration'}
          className="w-full h-full object-cover"
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button className="absolute top-2 right-2 h-7 w-7 bg-white/30 backdrop-blur-sm text-white hover:bg-white/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-border font-dm">
          {!hideEdit && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(photo); }}>
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
          )}
          {onSaveToGallery && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSaveToGallery(photo); }}>
              <FolderPlus className="w-4 h-4 mr-2" /> Save to Gallery
            </DropdownMenuItem>
          )}
          {!hideDelete && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(photo); }} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, MoreVertical, Trash2, Pencil } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const priorityDotColors = {
  red: '#c0392b',
  yellow: '#d4a017',
  green: '#5a8a6a',
};

export default function TemplateCard({ template, onDelete, onRename }) {
  return (
    <div className="group relative">
      <Link to={`/Template?id=${template.id}`} className="block">
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
          {template.cover_image ? (
            <img
              src={template.cover_image}
              alt={template.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-10 h-10 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

          {/* Bottom label */}
          <div className="absolute bottom-0 left-0 right-0 p-3.5">
            <h3 className="text-white font-dm font-medium text-sm leading-snug">{template.name}</h3>
            <p className="text-white/60 font-dm text-[11px] mt-0.5 tracking-wide">{template.photo_count || 0} poses</p>
          </div>
        </div>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="absolute top-2.5 right-2.5 h-7 w-7 bg-white/25 backdrop-blur-sm text-white hover:bg-white/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-border font-dm">
          <DropdownMenuItem onClick={() => onRename(template)}>
            <Pencil className="w-4 h-4 mr-2" /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(template)} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
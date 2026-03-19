import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, MoreVertical, Trash2, Pencil, List, Images, ImagePlus, Settings } from 'lucide-react';
import MobileMenu from '@/components/ui/mobile-menu';
import ChangeCoverDialog from './ChangeCoverDialog';
import EditGallerySheet from './EditGallerySheet';

export default function TemplateCard({ template, onDelete, onRename, onChangeCover }) {
  const isShotList = template.template_type === 'shot_list';
  const linkTo = isShotList
    ? `/ShotList?id=${template.id}`
    : `/Template?id=${template.id}`;

  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showEditGallery, setShowEditGallery] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
          <button className="absolute top-2.5 right-2.5 h-9 w-9 bg-white/25 backdrop-blur-sm text-white hover:bg-white/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-4 h-4" />
          </button>
        }
        items={[
          { label: 'Rename', icon: <Pencil className="w-4 h-4" />, onClick: () => onRename(template) },
          ...(isShotList ? [] : [
            { label: 'Edit', icon: <Settings className="w-4 h-4" />, onClick: () => setShowEditGallery(true) },
            { label: 'Change Cover', icon: <ImagePlus className="w-4 h-4" />, onClick: () => setShowCoverPicker(true) },
          ]),
          { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: () => onDelete(template), destructive: true },
        ]}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        title="Template Options"
      />

      {showCoverPicker && (
        <ChangeCoverDialog
          open={showCoverPicker}
          onOpenChange={setShowCoverPicker}
          template={template}
          onSelect={(imageUrl) => onChangeCover(template, imageUrl)}
        />
      )}

      <EditGallerySheet
        open={showEditGallery}
        onOpenChange={setShowEditGallery}
        template={template}
      />
    </div>
  );
}
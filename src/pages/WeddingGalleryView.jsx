import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '../components/ui/PageHeader';
import ImageLightbox from '../components/ui/ImageLightbox';
import { Play } from 'lucide-react';

export default function WeddingGalleryView() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const folderId = params.get('folder');
  const navigate = useNavigate();
  const [lightboxImage, setLightboxImage] = useState(null);

  const { data: gallery, isLoading } = useQuery({
    queryKey: ['wedding_gallery', id],
    queryFn: () => base44.entities.WeddingGallery.filter({ id }),
    select: (d) => d[0],
    enabled: !!id,
  });

  // If this gallery is linked to a ShootTemplate, navigate to ShootMode / Template
  const handleShootMode = () => {
    if (gallery?.template_id) {
      navigate(`/ShootMode?id=${gallery.template_id}`);
    }
  };

  if (isLoading || !gallery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <PageHeader
        title={gallery.title}
        backTo={folderId ? `/WeddingFolder?id=${folderId}` : '/Weddings'}
        right={
          gallery.template_id ? (
            <button
              onClick={handleShootMode}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary text-primary-foreground text-xs font-dm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Shoot Mode
            </button>
          ) : null
        }
      />

      {gallery.notes && (
        <div className="px-5 pt-4 pb-2">
          <p className="font-dm text-sm text-muted-foreground leading-relaxed">{gallery.notes}</p>
        </div>
      )}

      {/* If linked to a template, show its photos */}
      {gallery.template_id ? (
        <LinkedTemplatePhotos templateId={gallery.template_id} onPhotoClick={setLightboxImage} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center px-5">
          <p className="font-dm text-muted-foreground text-sm">
            This gallery isn't linked to a template yet.<br />
            Edit the gallery to attach an existing template.
          </p>
        </div>
      )}

      {lightboxImage && <ImageLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />}
    </div>
  );
}

function LinkedTemplatePhotos({ templateId, onPhotoClick }) {
  const { data: photos = [] } = useQuery({
    queryKey: ['template_photos', templateId],
    queryFn: () => base44.entities.TemplatePhoto.filter({ template_id: templateId }, 'sort_order'),
  });

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-5">
        <p className="font-dm text-muted-foreground text-sm">No photos in this template yet.</p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-4 columns-2 gap-3">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="break-inside-avoid mb-3 rounded-2xl overflow-hidden cursor-pointer"
          onClick={() => onPhotoClick(photo.image_url)}
        >
          <img src={photo.image_url} alt={photo.description || ''} className="w-full object-cover" />
        </div>
      ))}
    </div>
  );
}
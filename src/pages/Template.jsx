import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Play, List, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PhotoCard from '../components/photos/PhotoCard';
import AddPhotoDialog from '../components/photos/AddPhotoDialog';
import ImageLightbox from '../components/ui/ImageLightbox';

export default function Template() {
  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  const { data: template } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => base44.entities.ShootTemplate.filter({ id: templateId }),
    select: (data) => data[0],
    enabled: !!templateId,
  });

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['photos', templateId],
    queryFn: () => base44.entities.TemplatePhoto.filter({ template_id: templateId }, 'sort_order'),
    enabled: !!templateId,
  });

  const addPhotoMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.TemplatePhoto.create({
        ...data,
        template_id: templateId,
        sort_order: photos.length,
      });
      await base44.entities.ShootTemplate.update(templateId, {
        photo_count: photos.length + 1,
        cover_image: photos.length === 0 ? data.image_url : template?.cover_image,
      });
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['photos', templateId] });
      const previous = queryClient.getQueryData(['photos', templateId]);
      queryClient.setQueryData(['photos', templateId], (old = []) => [
        ...old,
        { id: `optimistic-${Date.now()}`, ...data, template_id: templateId, sort_order: old.length },
      ]);
      return { previous };
    },
    onError: (_err, _data, ctx) => {
      queryClient.setQueryData(['photos', templateId], ctx.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', templateId] });
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowAddPhoto(false);
    },
  });

  const editPhotoMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TemplatePhoto.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', templateId] });
      setEditingPhoto(null);
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.TemplatePhoto.delete(id);
      await base44.entities.ShootTemplate.update(templateId, {
        photo_count: Math.max(0, (template?.photo_count || 1) - 1),
      });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['photos', templateId] });
      const previous = queryClient.getQueryData(['photos', templateId]);
      queryClient.setQueryData(['photos', templateId], (old = []) => old.filter(p => p.id !== id));
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      queryClient.setQueryData(['photos', templateId], ctx.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', templateId] });
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/Home')}
              className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-playfair text-lg font-semibold text-foreground leading-tight">{template?.name || 'Template'}</h1>
              <p className="font-dm text-xs text-muted-foreground">{photos.length} poses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/ShotList?id=${templateId}`}>
              <button className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-colors">
                <List className="w-4 h-4" />
              </button>
            </Link>
            {photos.length > 0 && (
              <Link to={`/ShootMode?id=${templateId}`}>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground font-dm text-sm font-medium hover:bg-primary/90 transition-colors">
                  <Play className="w-3.5 h-3.5" />
                  Shoot
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="p-4">
        {isLoading ? (
          <div className="columns-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="break-inside-avoid mb-3 aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ImageIcon className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-playfair text-lg font-semibold text-foreground mb-1.5">No photos yet</h3>
            <p className="font-dm text-muted-foreground text-sm mb-6 max-w-[200px] leading-relaxed">
              Add inspiration photos to build your shoot plan
            </p>
            <button
              onClick={() => setShowAddPhoto(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-dm text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Photo
            </button>
          </div>
        ) : (
          <div className="columns-2 gap-3">
            {photos.map(p => (
              <div key={p.id} className="break-inside-avoid mb-3">
                <PhotoCard
                  photo={p}
                  onEdit={(photo) => setEditingPhoto(photo)}
                  onDelete={(photo) => deletePhotoMutation.mutate(photo.id)}
                  onClick={() => setLightboxImage(p.image_url)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      {photos.length > 0 && (
        <button
          onClick={() => setShowAddPhoto(true)}
          className="fixed bottom-24 right-5 h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <AddPhotoDialog
        open={showAddPhoto}
        onOpenChange={setShowAddPhoto}
        onSubmit={(data) => addPhotoMutation.mutate(data)}
      />

      {lightboxImage && (
        <ImageLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}

      {editingPhoto && (
        <AddPhotoDialog
          open={true}
          onOpenChange={() => setEditingPhoto(null)}
          editPhoto={editingPhoto}
          onSubmit={(data) => editPhotoMutation.mutate({ id: editingPhoto.id, data })}
        />
      )}
    </div>
  );
}
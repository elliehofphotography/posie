import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Play, List, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PhotoCard from '../components/photos/PhotoCard';
import AddPhotoDialog from '../components/photos/AddPhotoDialog';

export default function Template() {
  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);

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
      // Update photo count
      await base44.entities.ShootTemplate.update(templateId, {
        photo_count: photos.length + 1,
        cover_image: photos.length === 0 ? data.image_url : template?.cover_image,
      });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', templateId] });
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/Home')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground leading-tight">{template?.name || 'Template'}</h1>
              <p className="text-xs text-muted-foreground">{photos.length} poses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/ShotList?id=${templateId}`}>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <List className="w-5 h-5" />
              </Button>
            </Link>
            {photos.length > 0 && (
              <Link to={`/ShootMode?id=${templateId}`}>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 gap-1.5">
                  <Play className="w-3.5 h-3.5" />
                  Shoot
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <ImageIcon className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <h3 className="text-foreground font-semibold mb-1">No photos yet</h3>
            <p className="text-muted-foreground text-sm mb-5 max-w-[220px]">
              Add inspiration photos to build your shoot plan
            </p>
            <Button onClick={() => setShowAddPhoto(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Photo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {photos.map(p => (
              <PhotoCard
                key={p.id}
                photo={p}
                onEdit={(photo) => setEditingPhoto(photo)}
                onDelete={(photo) => deletePhotoMutation.mutate(photo.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      {photos.length > 0 && (
        <Button
          onClick={() => setShowAddPhoto(true)}
          size="icon"
          className="fixed bottom-24 right-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 w-14 shadow-lg shadow-primary/25 z-40"
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      <AddPhotoDialog
        open={showAddPhoto}
        onOpenChange={setShowAddPhoto}
        onSubmit={(data) => addPhotoMutation.mutate(data)}
      />

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
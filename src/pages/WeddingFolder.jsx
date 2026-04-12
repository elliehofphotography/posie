import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '../components/ui/PageHeader';
import WeddingTimeline from '../components/weddings/WeddingTimeline';
import WeddingGalleriesSection from '../components/weddings/WeddingGalleriesSection';
import { format } from 'date-fns';


export default function WeddingFolder() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();


  const { data: folder, isLoading } = useQuery({
    queryKey: ['wedding_folder', id],
    queryFn: () => base44.entities.WeddingFolder.filter({ id }),
    select: (d) => d[0],
    enabled: !!id,
  });

  const { data: galleries = [] } = useQuery({
    queryKey: ['wedding_galleries', id],
    queryFn: () => base44.entities.WeddingGallery.filter({ folder_id: id }, 'order_index'),
    enabled: !!id,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['timeline_events', id],
    queryFn: () => base44.entities.TimelineEvent.filter({ folder_id: id }, 'start_time'),
    enabled: !!id,
  });

  if (isLoading || !folder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <PageHeader
        title={folder.title}
        backTo="/Weddings"
      />

      {/* Cover + Date */}
      {folder.cover_image && (
        <div className="w-full h-48 overflow-hidden">
          <img src={folder.cover_image} alt={folder.title} className="w-full h-full object-cover" />
        </div>
      )}
      {(folder.date || folder.description) && (
        <div className="px-5 pt-4 pb-2">
          {folder.date && (
            <p className="font-dm text-sm text-muted-foreground">
              📅 {format(new Date(folder.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
            </p>
          )}
          {folder.description && (
            <p className="font-dm text-sm text-foreground mt-1 leading-relaxed">{folder.description}</p>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="mt-4">
        <WeddingTimeline
          folderId={id}
          events={events}
          galleries={galleries}

          onGalleryOpen={(galleryId) => navigate(`/WeddingGalleryView?id=${galleryId}&folder=${id}`)}
        />
      </div>

      {/* Galleries */}
      <div className="mt-6">
        <WeddingGalleriesSection
          folderId={id}
          galleries={galleries}
          onGalleryOpen={(galleryId) => navigate(`/WeddingGalleryView?id=${galleryId}&folder=${id}`)}
        />
      </div>
    </div>
  );
}
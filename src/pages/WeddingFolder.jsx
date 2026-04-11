import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '../components/ui/PageHeader';
import WeddingTimeline from '../components/weddings/WeddingTimeline';
import WeddingGalleriesSection from '../components/weddings/WeddingGalleriesSection';
import { format } from 'date-fns';
import { CalendarDays, Moon } from 'lucide-react';

export default function WeddingFolder() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [weddingDayMode, setWeddingDayMode] = useState(false);

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

  if (weddingDayMode) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border px-4 flex items-center justify-between" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}>
          <div>
            <h1 className="font-vina text-2xl text-primary uppercase tracking-widest">{folder.title}</h1>
            {folder.date && (
              <p className="font-dm text-xs text-muted-foreground">
                {format(new Date(folder.date + 'T00:00:00'), 'MMMM d, yyyy')}
              </p>
            )}
          </div>
          <button
            onClick={() => setWeddingDayMode(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-dm font-medium"
          >
            <Moon className="w-3.5 h-3.5" />
            Exit
          </button>
        </div>
        <div className="pb-10">
          <WeddingTimeline
            folderId={id}
            events={events}
            galleries={galleries}
            weddingDayMode={true}
            onGalleryOpen={(galleryId) => navigate(`/WeddingGalleryView?id=${galleryId}&folder=${id}`)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <PageHeader
        title={folder.title}
        backTo="/Weddings"
        right={
          <button
            onClick={() => setWeddingDayMode(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary text-primary-foreground text-xs font-dm font-semibold hover:bg-primary/90 transition-colors"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Wedding Day
          </button>
        }
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
          weddingDayMode={false}
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
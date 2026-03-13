import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChecklistOverview() {
  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get('id');
  const navigate = useNavigate();

  const { data: photos = [] } = useQuery({
    queryKey: ['photos', templateId],
    queryFn: () => base44.entities.TemplatePhoto.filter({ template_id: templateId }, 'sort_order'),
    enabled: !!templateId,
  });

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/10" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-white">Checklist Overview</h1>
            <p className="text-xs text-white/50">{photos.length} total poses</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="p-3">
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-white/5">
              <img
                src={photo.image_url}
                alt={photo.description || ''}
                className="w-full h-full object-cover"
              />
              <div className={`absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full ${
                photo.color_priority === 'red' ? 'bg-red-500' :
                photo.color_priority === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
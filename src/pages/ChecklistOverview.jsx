import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-playfair text-lg font-semibold text-white">Overview</h1>
            <p className="font-dm text-xs text-white/50">{photos.length} total poses</p>
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-white/5">
              <img
                src={photo.image_url}
                alt={photo.description || ''}
                className="w-full h-full object-cover"
              />
              <div className={`absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full border border-white/30 ${
                photo.color_priority === 'red' ? 'bg-red-500' :
                photo.color_priority === 'yellow' ? 'bg-yellow-400' : 'bg-green-500'
              }`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
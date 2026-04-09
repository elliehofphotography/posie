import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Camera, List, Image as ImageIcon } from 'lucide-react';
import PhotoDetailLightbox from '../components/ui/PhotoDetailLightbox';

const categoryLabels = {
  standing: 'Standing', sitting: 'Sitting', walking: 'Walking',
  close_up: 'Close-up', wide_shot: 'Wide Shot', detail: 'Detail',
  interaction: 'Interaction', candid: 'Candid', other: 'Other',
};

const priorityDots = { red: 'bg-red-500', yellow: 'bg-yellow-400', green: 'bg-green-500' };

export default function SharedGallery() {
  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get('id');

  const [template, setTemplate] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [shotItems, setShotItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  useEffect(() => {
    if (!templateId) { setError(true); setLoading(false); return; }
    (async () => {
      try {
        const tmplArr = await base44.entities.ShootTemplate.filter({ id: templateId });
        const tmpl = tmplArr[0];
        if (!tmpl) { setError(true); setLoading(false); return; }
        setTemplate(tmpl);
        if (tmpl.template_type === 'shot_list') {
          const items = await base44.entities.ShotListItem.filter({ template_id: templateId }, 'sort_order');
          setShotItems(items);
        } else {
          const p = await base44.entities.TemplatePhoto.filter({ template_id: templateId }, 'sort_order');
          setPhotos(p);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [templateId]);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  if (error || !template) return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-3 px-6 text-center">
      <Camera className="w-12 h-12 text-muted-foreground" />
      <h2 className="font-vina text-2xl text-primary tracking-widest uppercase">Not Found</h2>
      <p className="font-dm text-sm text-muted-foreground">This gallery link may be invalid or has been removed.</p>
    </div>
  );

  const isShotList = template.template_type === 'shot_list';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-12 pb-6 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          {isShotList ? <List className="w-4 h-4 text-muted-foreground" /> : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
          <span className="font-dm text-xs text-muted-foreground uppercase tracking-widest">{isShotList ? 'Shot List' : 'Gallery'}</span>
        </div>
        <h1 className="font-vina text-3xl text-primary tracking-widest uppercase">{template.name}</h1>
        {template.description && <p className="font-dm text-sm text-muted-foreground mt-1">{template.description}</p>}
        <p className="font-dm text-xs text-muted-foreground mt-1">
          {isShotList ? `${shotItems.length} shots` : `${photos.length} poses`}
        </p>
      </div>

      {/* Content */}
      <div className="p-4">
        {isShotList ? (
          <div className="space-y-2">
            {shotItems.map((item, idx) => (
              <div key={item.id} className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-card border border-border">
                <span className="font-dm text-xs text-muted-foreground mt-0.5 w-5 shrink-0">{idx + 1}.</span>
                <p className="font-dm text-sm text-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="columns-2 gap-3">
            {photos.map(p => (
              <div key={p.id} className="break-inside-avoid mb-3 cursor-pointer group relative" onClick={() => setLightboxPhoto(p)}>
                <div className="relative rounded-2xl overflow-hidden bg-muted">
                  <img src={p.image_url} alt={p.description || ''} className="w-full h-auto block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className={`absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full ${priorityDots[p.color_priority] || priorityDots.green} ring-2 ring-white/50`} />
                  {p.pose_category && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm font-dm text-[10px] text-white/90 tracking-wide">
                      {categoryLabels[p.pose_category] || p.pose_category}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxPhoto && <PhotoDetailLightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />}

      {/* Footer */}
      <div className="text-center py-8 px-4">
        <p className="font-dm text-xs text-muted-foreground">Shared via <span className="font-semibold text-primary">Posie</span></p>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderPlus, Check, Loader2 } from 'lucide-react';

export default function SaveToGalleryDialog({ open, onOpenChange, photo, galleries, onSaveToExisting, onCreateNew, isSaving }) {
  const [mode, setMode] = useState('pick'); // 'pick' | 'create'
  const [newName, setNewName] = useState('');

  const handleClose = (v) => {
    if (!v) { setMode('pick'); setNewName(''); }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-vina text-2xl text-primary tracking-widest uppercase">
            Save to Gallery
          </DialogTitle>
        </DialogHeader>

        {/* Photo preview */}
        <div className="w-full aspect-[3/2] rounded-xl overflow-hidden bg-muted mb-1">
          <img src={photo.image_url} alt="" className="w-full h-full object-cover" />
        </div>

        {mode === 'pick' && (
          <div className="space-y-2">
            {/* All Photos — always first */}
            {(() => {
              const allPhotosGallery = galleries.find(g => g.name === 'All Photos');
              const otherGalleries = galleries.filter(g => g.name !== 'All Photos');
              return (
                <>
                  {allPhotosGallery && (
                    <button
                      onClick={() => onSaveToExisting(allPhotosGallery.id)}
                      disabled={isSaving}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-primary/30 hover:border-primary bg-primary/5 transition-all text-left"
                    >
                      {allPhotosGallery.cover_image ? (
                        <img src={allPhotosGallery.cover_image} alt="All Photos" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <FolderPlus className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-dm text-sm font-semibold text-primary truncate">All Photos</p>
                        <p className="font-dm text-[11px] text-muted-foreground">{allPhotosGallery.photo_count || 0} photos · suggested</p>
                      </div>
                      {isSaving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
                    </button>
                  )}

                  {/* Create new option */}
                  <button
                    onClick={() => setMode('create')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-muted transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <FolderPlus className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-dm text-sm text-foreground font-medium">Create new gallery</span>
                  </button>

                  {/* Other galleries */}
                  {otherGalleries.length > 0 && (
                    <>
                      <div className="flex items-center gap-3 py-1">
                        <div className="h-px flex-1 bg-border" />
                        <span className="font-dm text-[10px] uppercase tracking-[0.15em] text-muted-foreground">or pick existing</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      {otherGalleries.map(g => (
                        <button
                          key={g.id}
                          onClick={() => onSaveToExisting(g.id)}
                          disabled={isSaving}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-border hover:border-primary/40 bg-card transition-all text-left"
                        >
                          {g.cover_image ? (
                            <img src={g.cover_image} alt={g.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                              <FolderPlus className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-dm text-sm font-medium text-foreground truncate">{g.name}</p>
                            <p className="font-dm text-[11px] text-muted-foreground">{g.photo_count || 0} photos</p>
                          </div>
                          {isSaving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
                        </button>
                      ))}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Gallery Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Couples Summer Shoot"
                className="bg-muted border-border font-dm"
                autoFocus
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" className="font-dm" onClick={() => setMode('pick')}>Back</Button>
              <Button
                disabled={!newName.trim() || isSaving}
                onClick={() => onCreateNew(newName.trim())}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-dm rounded-full px-6"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create & Save'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
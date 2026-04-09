import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderPlus, Loader2, X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

export default function SaveToGalleryDialog({ open, onOpenChange, photo, galleries, onSaveToExisting, onCreateNew, isSaving }) {
  const [mode, setMode] = useState('pick'); // 'pick' | 'create'
  const [newName, setNewName] = useState('');

  const handleClose = (v) => {
    if (!v) { setMode('pick'); setNewName(''); }
    onOpenChange(v);
  };

  const otherGalleries = galleries;

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="bg-card border-border max-h-[92vh] flex flex-col">
        {/* Fixed header with photo */}
        <div className="shrink-0">
          <DrawerHeader className="px-5 pt-4 pb-3 flex items-center justify-between">
            <DrawerTitle className="font-vina text-xl text-primary tracking-widest uppercase">
              Save to Another Gallery
            </DrawerTitle>
            <button
              onClick={() => handleClose(false)}
              className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </DrawerHeader>

          {/* Photo preview — full width, fixed at top */}
          <div className="w-full aspect-[3/2] overflow-hidden bg-muted">
            <img src={photo.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Scrollable gallery list */}
        <div className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {mode === 'pick' && (
            <div className="space-y-2">
              {/* Create new option */}

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
              <div className="flex gap-2">
                <Button variant="ghost" className="font-dm flex-1" onClick={() => setMode('pick')}>Back</Button>
                <Button
                  disabled={!newName.trim() || isSaving}
                  onClick={() => onCreateNew(newName.trim())}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-dm rounded-full px-6 flex-1"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create & Save'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
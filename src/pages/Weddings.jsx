import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderHeart, ChevronRight, Pencil, Trash2, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PullToRefresh from '../components/layout/PullToRefresh';
import CreateFolderDialog from '../components/weddings/CreateFolderDialog';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function Weddings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [search, setSearch] = useState('');
  const [deletingFolderId, setDeletingFolderId] = useState(null);

  const { data: folders = [] } = useQuery({
    queryKey: ['wedding_folders'],
    queryFn: () => base44.entities.WeddingFolder.list('order_index'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WeddingFolder.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wedding_folders'] }),
  });

  const filtered = folders.filter(f => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      f.title?.toLowerCase().includes(q) ||
      f.description?.toLowerCase().includes(q) ||
      (f.date && f.date.includes(q))
    );
  });

  return (
    <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: ['wedding_folders'] })}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="px-5 pb-3 flex items-center justify-between" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <h1 className="font-vina text-4xl uppercase tracking-widest text-primary">Weddings</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, date, or keyword…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border border-border font-dm text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Folder List */}
        <div className="px-5 pb-24 space-y-3">
          {folders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
              <FolderHeart className="w-12 h-12 text-muted-foreground/40" />
              <p className="font-dm text-muted-foreground text-sm">No weddings yet.<br />Tap + to create your first folder.</p>
            </div>
          )}
          {folders.length > 0 && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <Search className="w-8 h-8 text-muted-foreground/40" />
              <p className="font-dm text-muted-foreground text-sm">No results for "{search}"</p>
            </div>
          )}
          {filtered.map((folder) => (
            <div
              key={folder.id}
              className="relative rounded-2xl overflow-hidden bg-card border border-border cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => navigate(`/WeddingFolder?id=${folder.id}`)}
            >
              {folder.cover_image && (
                <div className="w-full h-32 overflow-hidden">
                  <img src={folder.cover_image} alt={folder.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 h-32 bg-gradient-to-b from-black/30 to-transparent" />
                </div>
              )}
              <div className="p-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-dm text-sm font-medium text-foreground">{folder.title}</h2>
                  {folder.date && (
                    <p className="font-dm text-xs text-muted-foreground mt-0.5">
                      {format(new Date(folder.date + 'T00:00:00'), 'MMMM d, yyyy')}
                    </p>
                  )}
                  {folder.description && (
                    <p className="font-dm text-xs text-muted-foreground mt-1 line-clamp-1">{folder.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingFolder(folder);
                    }}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingFolderId(folder.id);
                    }}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <CreateFolderDialog
          open={showCreate || !!editingFolder}
          onOpenChange={(v) => {
            if (!v) {
              setShowCreate(false);
              setEditingFolder(null);
            }
          }}
          editFolder={editingFolder}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['wedding_folders'] });
            setShowCreate(false);
            setEditingFolder(null);
          }}
        />

        <AlertDialog open={!!deletingFolderId} onOpenChange={(v) => { if (!v) setDeletingFolderId(null); }}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-playfair text-foreground">Delete this wedding?</AlertDialogTitle>
              <AlertDialogDescription className="font-dm text-muted-foreground">
                Are you sure you want to delete this wedding? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-dm">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  deleteMutation.mutate(deletingFolderId);
                  setDeletingFolderId(null);
                }}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-dm"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PullToRefresh>
  );
}
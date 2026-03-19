import React, { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { haptic } from '@/lib/haptic';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function YourCreationsSection({ posts, userEmail }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(true);
  const [deletingPostId, setDeletingPostId] = useState(null);

  const deleteCreationMutation = useMutation({
    mutationFn: async (postId) => {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Delete from discover
      await base44.entities.DiscoverPost.delete(postId);

      // Find and remove from all galleries
      const allTemplatePhotos = await base44.entities.TemplatePhoto.list();
      const toDelete = allTemplatePhotos.filter(p => p.image_url === post.image_url);

      await Promise.all(toDelete.map(p => base44.entities.TemplatePhoto.delete(p.id)));

      // Update photo counts for affected templates
      const affectedTemplateIds = [...new Set(toDelete.map(p => p.template_id))];
      await Promise.all(affectedTemplateIds.map(async (templateId) => {
        const remaining = await base44.entities.TemplatePhoto.filter({ template_id: templateId });
        await base44.entities.ShootTemplate.update(templateId, {
          photo_count: remaining.length,
          cover_image: remaining.length > 0 ? remaining[0].image_url : '',
        });
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discover_posts'] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setDeletingPostId(null);
    },
  });

  if (posts.length === 0) return null;

  return (
    <>
      <div className="px-5 mb-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors"
        >
          <div className="text-left">
            <p className="font-dm text-xs font-semibold text-primary uppercase tracking-wider">Your Creations</p>
            <p className="font-dm text-xs text-muted-foreground mt-0.5">{posts.length} photos</p>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-primary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-primary" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-4 columns-2 gap-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="break-inside-avoid mb-3 group relative rounded-2xl overflow-hidden bg-muted"
            >
              <img src={post.image_url} alt={post.category} className="w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <button
                onClick={() => setDeletingPostId(post.id)}
                className="absolute top-2 right-2 z-10 h-9 w-9 bg-black/40 backdrop-blur-sm text-white hover:bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="font-dm text-[10px] text-white/70 uppercase tracking-wider">{post.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deletingPostId} onOpenChange={(open) => { if (!open) setDeletingPostId(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-playfair text-foreground">Delete this creation?</AlertDialogTitle>
            <AlertDialogDescription className="font-dm text-muted-foreground">
              This photo will be permanently removed from Discover and from any gallery it's in across the app. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-dm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPostId && deleteCreationMutation.mutate(deletingPostId)}
              disabled={deleteCreationMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-dm"
            >
              {deleteCreationMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
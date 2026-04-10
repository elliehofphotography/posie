import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import { CheckCircle, XCircle, Instagram, User, Clock } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-700 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-700 border-red-500/30',
};

export default function AdminDiscover() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('pending');

  if (authUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-dm text-muted-foreground">Access denied.</p>
      </div>
    );
  }

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['discover_posts_admin', filter],
    queryFn: () => base44.entities.DiscoverPost.filter(
      filter === 'all' ? {} : { status: filter },
      '-created_date'
    ),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.DiscoverPost.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discover_posts_admin'] });
      queryClient.invalidateQueries({ queryKey: ['discover_posts'] });
    },
  });

  const filters = ['pending', 'approved', 'rejected', 'all'];

  return (
    <div className="min-h-screen bg-background pb-10">
      <PageHeader title="Discover Review" backTo="/Settings" />

      {/* Filter tabs */}
      <div className="flex gap-2 px-5 pt-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-dm font-medium whitespace-nowrap border transition-all capitalize ${
              filter === f
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-5">
          <Clock className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-dm text-muted-foreground text-sm">No {filter} submissions</p>
        </div>
      )}

      <div className="px-5 space-y-4">
        {posts.map(post => (
          <div key={post.id} className="rounded-2xl bg-card border border-border overflow-hidden">
            {/* Photo */}
            <div className="w-full aspect-[4/3] bg-muted overflow-hidden">
              <img src={post.image_url} alt={post.title || post.category} className="w-full h-full object-cover" />
            </div>

            {/* Details */}
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  {post.title && <p className="font-dm text-sm font-semibold text-foreground">{post.title}</p>}
                  <p className="font-dm text-xs text-muted-foreground">{post.category}{post.pose_category ? ` · ${post.pose_category}` : ''}</p>
                </div>
                <span className={`text-[10px] font-dm font-medium px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[post.status] || ''}`}>
                  {post.status}
                </span>
              </div>

              {post.photographer_name && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-dm text-xs text-foreground">{post.photographer_name}</span>
                </div>
              )}
              {post.instagram_handle && (
                <div className="flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-dm text-xs text-foreground">{post.instagram_handle}</span>
                </div>
              )}
              {post.description && (
                <p className="font-dm text-xs text-muted-foreground leading-relaxed">{post.description}</p>
              )}
              <p className="font-dm text-[10px] text-muted-foreground">Submitted by: {post.created_by}</p>

              {/* Actions */}
              {post.status !== 'approved' && (
                <button
                  onClick={() => updateStatusMutation.mutate({ id: post.id, status: 'approved' })}
                  disabled={updateStatusMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-700 font-dm text-sm font-medium hover:bg-green-500/20 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
              )}
              {post.status !== 'rejected' && (
                <button
                  onClick={() => updateStatusMutation.mutate({ id: post.id, status: 'rejected' })}
                  disabled={updateStatusMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 font-dm text-sm font-medium hover:bg-red-500/20 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
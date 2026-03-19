import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function NotificationBell({ userEmail }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: () => base44.entities.Notification.filter({ user_email: userEmail }, '-created_date'),
    enabled: !!userEmail,
    refetchInterval: 30000,
  });

  const unread = notifications.filter(n => !n.is_read);

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] }),
  });

  const dismissMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] }),
  });

  const markAllRead = () => {
    unread.forEach(n => markReadMutation.mutate(n.id));
  };

  if (!userEmail) return null;

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (unread.length > 0) markAllRead(); }}
        className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors select-none relative"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground font-dm text-[9px] flex items-center justify-center">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed left-4 right-4 top-24 z-50 w-auto bg-card border border-border rounded-2xl shadow-xl overflow-hidden" style={{ maxWidth: '360px', margin: '0 auto' }}>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="font-dm text-sm font-semibold text-foreground">Notifications</span>
              <button onClick={() => setOpen(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="font-dm text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {notifications.map(n => (
                  <div key={n.id} className={`flex items-start gap-3 px-4 py-3 ${!n.is_read ? 'bg-primary/5' : ''}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-primary' : 'bg-transparent'}`} />
                    {n.image_url && (
                      <img src={n.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    )}
                    <p className="font-dm text-xs text-foreground flex-1 leading-relaxed">{n.message}</p>
                    <button onClick={() => dismissMutation.mutate(n.id)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
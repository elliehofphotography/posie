import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Camera, Settings, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import TemplateCard from '../components/templates/TemplateCard';
import CreateTemplateDialog from '../components/templates/CreateTemplateDialog';

export default function Home() {
  const [showCreate, setShowCreate] = useState(false);
  const [renaming, setRenaming] = useState(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ShootTemplate.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ShootTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowCreate(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ShootTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ShootTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setRenaming(null);
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-xs font-dm uppercase tracking-[0.2em] text-muted-foreground mb-1">Your Collection</p>
            <h1 className="font-playfair text-3xl font-semibold text-foreground leading-tight">
              Shoot<br />
              <span className="italic font-normal">Templates</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Link to="/Settings">
              <button className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-colors select-none">
                <Settings className="w-4.5 h-4.5" />
              </button>
            </Link>
            <button
              onClick={() => setShowCreate(true)}
              className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors select-none"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 mb-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="w-full bg-muted border border-border rounded-full pl-10 pr-10 py-2.5 font-dm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-border mb-6" />

      {/* Templates Grid */}
      <div className="px-5 pb-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[4/5] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
              <Camera className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-playfair text-xl font-semibold text-foreground mb-2">No templates yet</h3>
            <p className="font-dm text-muted-foreground text-sm mb-7 max-w-[220px] leading-relaxed">
              Create your first shoot template to start planning
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-dm text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Create Template
            </button>
          </div>
        ) : (() => {
          const filtered = templates.filter(t =>
            t.name.toLowerCase().includes(search.toLowerCase())
          );
          if (filtered.length === 0) return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-dm text-muted-foreground text-sm">No templates match "{search}"</p>
              <button onClick={() => setSearch('')} className="mt-3 font-dm text-xs text-primary hover:underline">Clear search</button>
            </div>
          );
          return (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(t => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onDelete={(tmpl) => deleteMutation.mutate(tmpl.id)}
                  onRename={(tmpl) => setRenaming(tmpl)}
                />
              ))}
            </div>
          );
        })()}
      </div>

      <CreateTemplateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSubmit={(data) => createMutation.mutate(data)}
      />

      {renaming && (
        <CreateTemplateDialog
          open={true}
          onOpenChange={() => setRenaming(null)}
          title="Rename Template"
          initialName={renaming.name}
          initialDescription={renaming.description || ''}
          onSubmit={(data) => renameMutation.mutate({ id: renaming.id, data })}
        />
      )}
    </div>
  );
}
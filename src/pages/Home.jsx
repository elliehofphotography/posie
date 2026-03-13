import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TemplateCard from '../components/templates/TemplateCard';
import CreateTemplateDialog from '../components/templates/CreateTemplateDialog';

export default function Home() {
  const [showCreate, setShowCreate] = useState(false);
  const [renaming, setRenaming] = useState(null);
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
    <div className="min-h-screen px-5 pt-14 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Camera className="w-4.5 h-4.5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">ShootPlan</h1>
          </div>
          <p className="text-muted-foreground text-sm">Your shoot templates</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          size="icon"
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-11 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-[4/5] rounded-2xl bg-secondary animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <Camera className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h3 className="text-foreground font-semibold mb-1">No templates yet</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-[240px]">
            Create your first shoot template to start planning photoshoots
          </p>
          <Button onClick={() => setShowCreate(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {templates.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              onDelete={(tmpl) => deleteMutation.mutate(tmpl.id)}
              onRename={(tmpl) => setRenaming(tmpl)}
            />
          ))}
        </div>
      )}

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
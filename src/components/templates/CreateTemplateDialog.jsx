import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function CreateTemplateDialog({ open, onOpenChange, onSubmit, initialName = '', initialDescription = '', title = 'New Shoot Template' }) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim() });
    setName('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-playfair text-xl text-foreground">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Template Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Couples Sunset Shoot"
              className="bg-muted border-border font-dm"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief concept description..."
              className="bg-muted border-border h-20 resize-none font-dm"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" className="font-dm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              type="submit"
              disabled={!name.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-dm rounded-full px-6"
            >
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
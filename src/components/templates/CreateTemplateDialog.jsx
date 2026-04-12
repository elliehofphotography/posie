import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Images, List } from 'lucide-react';

const TYPES = [
  {
    value: 'gallery',
    icon: Images,
    label: 'Cover Image',
    desc: 'Upload inspiration photos with pose notes, lens & lighting info.',
  },
  {
    value: 'shot_list',
    icon: List,
    label: 'Shot List',
    desc: 'Type out a checklist of shots to tick off during the session.',
  },
];

export default function CreateTemplateDialog({
  open,
  onOpenChange,
  onSubmit,
  initialName = '',
  initialDescription = '',
  title = 'New Shoot Template',
}) {
  const [step, setStep] = useState(1); // 1 = pick type, 2 = name/desc
  const [type, setType] = useState('gallery');
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  // If renaming (initialName provided), skip type picking
  const isRenaming = !!initialName;

  const handleOpen = (val) => {
    if (!val) {
      // reset on close
      setStep(isRenaming ? 2 : 1);
      setType('gallery');
      setName(initialName);
      setDescription(initialDescription);
    }
    onOpenChange(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim(), template_type: type });
    setStep(1);
    setName('');
    setDescription('');
  };

  const currentStep = isRenaming ? 2 : step;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-playfair text-xl text-foreground">
            {isRenaming ? title : currentStep === 1 ? 'Choose Template Type' : 'Name Your Template'}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Type picker */}
        {currentStep === 1 && (
          <div className="space-y-3 py-1">
            {TYPES.map(({ value, icon: Icon, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setType(value); setStep(2); }}
                className="w-full flex items-start gap-3.5 px-4 py-4 rounded-2xl border-2 border-border bg-muted hover:border-primary/50 hover:bg-card transition-all text-left select-none"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <p className="font-dm text-sm font-semibold text-foreground">{label}</p>
                  <p className="font-dm text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </button>
            ))}
            <DialogFooter>
              <Button type="button" variant="ghost" className="font-dm" onClick={() => handleOpen(false)}>Cancel</Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Name + description */}
        {currentStep === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isRenaming && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted">
                {type === 'gallery'
                  ? <Images className="w-3.5 h-3.5 text-primary" />
                  : <List className="w-3.5 h-3.5 text-primary" />}
                <span className="font-dm text-xs text-muted-foreground">
                  {type === 'gallery' ? 'Cover Image' : 'Shot List'}
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ml-auto font-dm text-xs text-primary hover:underline"
                >
                  Change
                </button>
              </div>
            )}
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
              {!isRenaming && (
                <Button type="button" variant="ghost" className="font-dm" onClick={() => setStep(1)}>Back</Button>
              )}
              {isRenaming && (
                <Button type="button" variant="ghost" className="font-dm" onClick={() => handleOpen(false)}>Cancel</Button>
              )}
              <Button
                type="submit"
                disabled={!name.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-dm rounded-full px-6"
              >
                {isRenaming ? 'Save' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
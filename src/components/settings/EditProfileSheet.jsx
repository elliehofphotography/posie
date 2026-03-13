import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Upload, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function EditProfileSheet({ open, onOpenChange, user, onSaved }) {
  const [name, setName] = useState(user?.full_name || '');
  const [photoUrl, setPhotoUrl] = useState(user?.profile_photo || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPhotoUrl(file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({ full_name: name, profile_photo: photoUrl });
    setSaving(false);
    onSaved({ full_name: name, profile_photo: photoUrl });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-border max-h-[85vh]">
        <DrawerHeader className="flex items-center justify-between pb-2">
          <DrawerTitle className="font-playfair text-xl text-foreground">Edit Profile</DrawerTitle>
          <DrawerClose asChild>
            <button className="h-8 w-8 rounded-full bg-muted flex items-center justify-center select-none">
              <X className="w-4 h-4" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="px-4 pb-8 space-y-6 overflow-y-auto">
          {/* Photo */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="w-20 h-20 rounded-full bg-muted overflow-hidden flex items-center justify-center">
              {photoUrl
                ? <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                : <User className="w-8 h-8 text-muted-foreground" />}
            </div>
            <label className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted hover:bg-secondary transition-colors cursor-pointer font-dm text-xs text-foreground select-none">
              {uploading
                ? <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
                : <Upload className="w-3.5 h-3.5" />}
              {uploading ? 'Uploading…' : 'Change Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="font-dm text-muted-foreground text-xs uppercase tracking-wider">Display Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="bg-muted border-border font-dm"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full py-3 rounded-full bg-primary text-primary-foreground font-dm text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 select-none"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
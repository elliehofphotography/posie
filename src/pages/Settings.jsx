import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Settings() {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    await base44.auth.logout('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-colors select-none"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-playfair text-lg font-semibold text-foreground">Settings</h1>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <p className="font-dm text-xs uppercase tracking-[0.15em] text-muted-foreground mb-4">Account</p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-destructive/10 text-destructive font-dm text-sm font-medium hover:bg-destructive/20 transition-colors select-none">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-playfair text-foreground">Delete your account?</AlertDialogTitle>
              <AlertDialogDescription className="font-dm text-muted-foreground">
                This will permanently delete your account and all your shoot templates. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-dm">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-dm"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
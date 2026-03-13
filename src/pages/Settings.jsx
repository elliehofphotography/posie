import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Trash2, LogOut, User, Mail, Shield,
  Bell, HelpCircle, ChevronRight, Copy, Check,
  Pencil, MessageCircle, FileText, Star
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import EditProfileSheet from '@/components/settings/EditProfileSheet';

function SectionLabel({ children }) {
  return <p className="font-dm text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">{children}</p>;
}

function SettingRow({ icon: Icon, label, value, onClick, danger, right }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-colors select-none text-left ${
        danger
          ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
          : 'bg-card border border-border text-foreground hover:bg-muted'
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${danger ? 'bg-destructive/15' : 'bg-muted'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-dm text-sm font-medium">{label}</p>
        {value && <p className="font-dm text-xs text-muted-foreground truncate mt-0.5">{value}</p>}
      </div>
      {right ?? (!danger && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />)}
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setNotifEnabled(u?.notifications_enabled ?? false);
    }).catch(() => {});
  }, []);

  const copyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => base44.auth.logout('/');

  const handleDeleteAccount = async () => {
    setDeleting(true);
    await base44.auth.logout('/');
  };

  const handleNotifToggle = async (val) => {
    setNotifEnabled(val);
    await base44.auth.updateMe({ notifications_enabled: val });
  };

  const handleProfileSaved = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div
        className="sticky top-0 z-30 stripe-header border-b border-border px-4 py-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
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

      <div className="p-5 space-y-6">

        {/* Profile Card */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/15 overflow-hidden flex items-center justify-center shrink-0">
              {user?.profile_photo
                ? <img src={user.profile_photo} alt="" className="w-full h-full object-cover" />
                : <User className="w-5 h-5 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-dm text-sm font-semibold text-foreground truncate">{user?.full_name || 'Your Account'}</p>
              <p className="font-dm text-xs text-muted-foreground truncate">{user?.email || '—'}</p>
            </div>
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-secondary transition-colors font-dm text-xs select-none"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
          </div>
          <div className="border-t border-border px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-dm text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Account ID</p>
              <p className="font-dm text-xs text-foreground font-mono">{user?.id ? `${user.id.slice(0, 16)}…` : '—'}</p>
            </div>
            <button
              onClick={copyId}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-secondary transition-colors font-dm text-xs select-none"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div>
          <SectionLabel>Account</SectionLabel>
          <div className="space-y-2">
            <SettingRow icon={Mail} label="Email Address" value={user?.email} onClick={() => {}} />
            <SettingRow
              icon={Shield}
              label="Account Role"
              value={user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'User'}
              onClick={() => {}}
            />
          </div>
        </div>

        {/* Notifications */}
        <div>
          <SectionLabel>Preferences</SectionLabel>
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card border border-border">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-dm text-sm font-medium text-foreground">Notifications</p>
              <p className="font-dm text-xs text-muted-foreground mt-0.5">Session reminders &amp; updates</p>
            </div>
            <Switch checked={notifEnabled} onCheckedChange={handleNotifToggle} />
          </div>
        </div>

        {/* Help & Support */}
        <div>
          <SectionLabel>Help &amp; Support</SectionLabel>
          <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
            <a
              href="mailto:support@example.com"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors select-none"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-dm text-sm font-medium text-foreground">Contact Support</p>
                <p className="font-dm text-xs text-muted-foreground mt-0.5">support@example.com</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </a>
            <a
              href="https://example.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors select-none"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-dm text-sm font-medium text-foreground">Privacy Policy</p>
                <p className="font-dm text-xs text-muted-foreground mt-0.5">How we handle your data</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </a>
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors select-none"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-dm text-sm font-medium text-foreground">Rate the App</p>
                <p className="font-dm text-xs text-muted-foreground mt-0.5">Enjoying it? Leave a review!</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </a>
          </div>
        </div>

        {/* Session */}
        <div>
          <SectionLabel>Session</SectionLabel>
          <SettingRow icon={LogOut} label="Log Out" value="Sign out of your account" onClick={handleLogout} />
        </div>

        {/* Danger Zone */}
        <div>
          <SectionLabel>Danger Zone</SectionLabel>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <div>
                <SettingRow icon={Trash2} label="Delete Account" value="Permanently remove all your data" danger onClick={() => {}} />
              </div>
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

      <EditProfileSheet
        open={showEdit}
        onOpenChange={setShowEdit}
        user={user}
        onSaved={handleProfileSaved}
      />
    </div>
  );
}
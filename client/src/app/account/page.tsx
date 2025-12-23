'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  User, Settings, Shield, CreditCard, Bell, 
  Lock, Mail, Save, LogOut, Trash2, Check,
  AlertTriangle, Zap, Crown, Star, RefreshCw,
  X, Eye, EyeOff, Smartphone, Monitor, Clock, MapPin, Key, Upload,
  Shuffle, Sparkles, Loader2, ArrowLeft, ChevronRight, ShieldAlert
} from 'lucide-react';
import EmailBreachChecker from '@/components/dashboard/EmailBreachChecker';
import { useAuth } from '@/hooks/useAuth';
import { useScanLimits } from '@/hooks/useScanLimits';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import toast from 'react-hot-toast';
import { 
  updateProfile, 
  updatePassword, 
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  multiFactor,
} from 'firebase/auth';
import { auth } from '@/firebase/config';
import { updateUserInFirestore } from '@/firebase/firestore';
import { 
  uploadProfilePhoto, 
  generateRandomDisplayName, 
  generateNameSuggestions,
} from '@/firebase/storage';

type TabType = 'profile' | 'subscription' | 'security' | 'breach-check' | 'notifications';

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, signOut, refreshProfile } = useAuth();
  const { planInfo } = useScanLimits();
  const { preferences: cookiePrefs, updatePreferences: updateCookiePrefs } = useCookieConsent();
  
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [scanAlerts, setScanAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/login?redirect=/account');
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      if (auth.currentUser) {
        const mfaUser = multiFactor(auth.currentUser);
        setIs2FAEnabled(mfaUser.enrolledFactors.length > 0);
      }
    }
  }, [user]);

  useEffect(() => {
    const savedPrefs = localStorage.getItem('shieldscan_preferences');
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        setEmailNotifications(prefs.emailNotifications ?? true);
        setScanAlerts(prefs.scanAlerts ?? true);
        setWeeklyReport(prefs.weeklyReport ?? false);
        setMarketingEmails(prefs.marketingEmails ?? false);
      } catch (e) { console.error('Error loading preferences:', e); }
    }
    loadSessions();
  }, []);

  useEffect(() => {
    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (newPassword.length >= 12) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[a-z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength++;
    setPasswordStrength(Math.min(strength, 5));
  }, [newPassword]);

  const loadSessions = () => {
    const savedSessions = localStorage.getItem('shieldscan_sessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    } else {
      const currentSession: Session = { id: Date.now().toString(), device: getDeviceType(), browser: getBrowser(), location: 'Current Location', lastActive: new Date().toISOString(), current: true };
      localStorage.setItem('shieldscan_sessions', JSON.stringify([currentSession]));
      setSessions([currentSession]);
    }
  };

  const getDeviceType = (): string => {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'Mobile';
    return 'Desktop';
  };

  const getBrowser = (): string => {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return; }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateRandomName = () => { const newName = generateRandomDisplayName(); setDisplayName(newName); toast.success(`Generated: ${newName}`); };
  const handleShowNameSuggestions = () => setNameSuggestions(generateNameSuggestions(6));

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      let newPhotoURL = user?.photoURL || null;
      if (photoFile) {
        setIsUploadingPhoto(true);
        try { newPhotoURL = await uploadProfilePhoto(auth.currentUser.uid, photoFile); toast.success('Photo uploaded!'); } 
        catch (err: unknown) { const msg = err instanceof Error ? err.message : 'Failed to upload'; toast.error(msg); } 
        finally { setIsUploadingPhoto(false); }
      }
      await updateProfile(auth.currentUser, { displayName: displayName || null, photoURL: newPhotoURL });
      try { await updateUserInFirestore(auth.currentUser.uid, { displayName: displayName || null, photoURL: newPhotoURL }); } catch {}
      setPhotoFile(null); setPhotoPreview(null);
      await refreshProfile?.();
      toast.success('Profile updated!');
    } catch (err: unknown) { const msg = err instanceof Error ? err.message : 'Failed to update'; toast.error(msg); } 
    finally { setIsSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!auth.currentUser || !auth.currentUser.email) { toast.error('User not found'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setIsSaving(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      localStorage.setItem('shieldscan_password_changed', new Date().toISOString());
      toast.success('Password changed!');
      setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code;
        if (code === 'auth/wrong-password') toast.error('Current password incorrect');
        else if (code === 'auth/requires-recent-login') toast.error('Please sign in again');
        else toast.error('Failed to change password');
      } else toast.error('Failed to change password');
    } finally { setIsSaving(false); }
  };

  const handleEnable2FA = () => { toast.error('Phone 2FA requires Firebase setup'); setShow2FAModal(false); };
  const handleRevokeSession = (sessionId: string) => { const updated = sessions.filter(s => s.id !== sessionId); localStorage.setItem('shieldscan_sessions', JSON.stringify(updated)); setSessions(updated); toast.success('Session revoked'); };
  const handleRevokeAllSessions = () => { const current = sessions.find(s => s.current); if (current) { localStorage.setItem('shieldscan_sessions', JSON.stringify([current])); setSessions([current]); } toast.success('Other sessions revoked'); setShowSessionsModal(false); };
  const handleSaveNotifications = () => { localStorage.setItem('shieldscan_preferences', JSON.stringify({ emailNotifications, scanAlerts, weeklyReport, marketingEmails })); toast.success('Settings saved!'); };
  const handleSignOut = async () => { await signOut(); router.push('/'); };
  const handleDeleteAccount = () => { if (!confirm('Delete account? This cannot be undone.')) return; toast.error('Contact support to delete account'); };
  const getPasswordLastChanged = (): string => { const saved = localStorage.getItem('shieldscan_password_changed'); if (saved) { const days = Math.floor((Date.now() - new Date(saved).getTime()) / 86400000); if (days === 0) return 'Today'; if (days === 1) return 'Yesterday'; if (days < 30) return `${days} days ago`; return new Date(saved).toLocaleDateString(); } return 'Never'; };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-yellow-500 animate-spin" /></div>;
  if (!isAuthenticated) return null;

  const isPasswordUser = user?.providerData?.some(p => p.providerId === 'password');
  const navItems = [
    { id: 'profile', label: 'Profile', icon: User, desc: 'Photo & name' },
    { id: 'subscription', label: 'Subscription', icon: CreditCard, desc: 'Plan & billing' },
    { id: 'security', label: 'Security', icon: Lock, desc: 'Password & 2FA' },
    { id: 'breach-check', label: 'Breach Check', icon: ShieldAlert, desc: 'Email leak scanner' },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Email alerts' },
  ];

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Header */}
      <div className="border-b border-dark-accent bg-dark-secondary/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="p-2 -ml-2 hover:bg-dark-accent rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </Link>
          <h1 className="text-white font-semibold">Account Settings</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            {/* User Card */}
            <div className="bg-dark-secondary border border-dark-accent rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                {user?.photoURL ? (
                  <Image src={user.photoURL} alt="" width={48} height={48} className="rounded-xl" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-yellow-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{user?.displayName || 'User'}</p>
                  <p className="text-gray-500 text-xs truncate">{user?.email}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${planInfo.id === 'enterprise' ? 'bg-yellow-500/20 text-yellow-400' : planInfo.id === 'pro' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {planInfo.id === 'enterprise' ? <Crown className="w-3 h-3 inline mr-1" /> : planInfo.id === 'pro' ? <Star className="w-3 h-3 inline mr-1" /> : null}
                  {planInfo.name}
                </span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="bg-dark-secondary border border-dark-accent rounded-xl overflow-hidden">
              {navItems.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${idx > 0 ? 'border-t border-dark-accent' : ''} ${
                    activeTab === item.id ? 'bg-yellow-500/10 text-yellow-500' : 'hover:bg-dark-primary text-gray-400 hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-gray-600">{item.desc}</p>
                  </div>
                  {activeTab === item.id && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </nav>

            {/* Sign Out */}
            <button onClick={handleSignOut} className="w-full mt-4 flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-dark-secondary border border-dark-accent rounded-xl">
                <div className="p-4 border-b border-dark-accent">
                  <h2 className="text-white font-semibold">Profile Information</h2>
                </div>
                <div className="p-4 space-y-4">
                  {/* Photo */}
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      {photoPreview || user?.photoURL ? (
                        <Image src={photoPreview || user?.photoURL || ''} alt="" width={64} height={64} className="rounded-xl object-cover" unoptimized={!!photoPreview} />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-dark-accent flex items-center justify-center"><User className="w-6 h-6 text-gray-500" /></div>
                      )}
                      {photoPreview && <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"><X className="w-3 h-3 text-white" /></button>}
                    </div>
                    <div>
                      <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-dark-accent text-gray-300 rounded-lg text-sm hover:bg-dark-primary flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />Change
                      </button>
                      <p className="text-xs text-gray-600 mt-1">JPG, PNG up to 5MB</p>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm text-gray-400">Display Name</label>
                      <div className="flex gap-1.5">
                        <button onClick={handleGenerateRandomName} className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 flex items-center gap-1"><Shuffle className="w-3 h-3" />Random</button>
                        <button onClick={handleShowNameSuggestions} className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 flex items-center gap-1"><Sparkles className="w-3 h-3" />Ideas</button>
                      </div>
                    </div>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-3 py-2 bg-dark-primary border border-dark-accent rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500/50" placeholder="Your name" />
                    {nameSuggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {nameSuggestions.map((name, idx) => (
                          <button key={idx} onClick={() => { setDisplayName(name); setNameSuggestions([]); toast.success(`Selected: ${name}`); }} className="px-2 py-1 bg-dark-accent text-gray-300 rounded text-xs hover:bg-yellow-500/20 hover:text-yellow-400">{name}</button>
                        ))}
                        <button onClick={() => setNameSuggestions([])} className="px-1.5 py-1 text-gray-500 hover:text-gray-300"><X className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm text-gray-400 block mb-1.5">Email</label>
                    <input type="email" value={email} disabled className="w-full px-3 py-2 bg-dark-primary/50 border border-dark-accent rounded-lg text-gray-500 text-sm cursor-not-allowed" />
                  </div>

                  {/* Info */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dark-accent text-xs">
                    <div><span className="text-gray-500">Joined</span><p className="text-gray-300">{user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : '-'}</p></div>
                    <div><span className="text-gray-500">Provider</span><p className="text-gray-300">{user?.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email'}</p></div>
                  </div>
                </div>
                <div className="px-4 py-3 bg-dark-primary/50 border-t border-dark-accent">
                  <button onClick={handleSaveProfile} disabled={isSaving || isUploadingPhoto} className="px-4 py-2 bg-yellow-500 text-black rounded-lg text-sm font-semibold hover:bg-yellow-400 disabled:opacity-50 flex items-center gap-1.5">
                    {isSaving || isUploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <div className="space-y-4">
                <div className={`bg-dark-secondary border rounded-xl p-4 ${planInfo.id === 'enterprise' ? 'border-yellow-500/30' : planInfo.id === 'pro' ? 'border-purple-500/30' : 'border-dark-accent'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {planInfo.id === 'enterprise' ? <Crown className="w-5 h-5 text-yellow-500" /> : planInfo.id === 'pro' ? <Star className="w-5 h-5 text-purple-500" /> : <Shield className="w-5 h-5 text-gray-400" />}
                      <div>
                        <h3 className="text-white font-semibold">{planInfo.name} Plan</h3>
                        <p className="text-xs text-gray-500">Current subscription</p>
                      </div>
                    </div>
                    {planInfo.id === 'essential' && (
                      <Link href="/pricing" className="px-3 py-1.5 bg-yellow-500 text-black rounded-lg text-xs font-semibold hover:bg-yellow-400 flex items-center gap-1"><Zap className="w-3 h-3" />Upgrade</Link>
                    )}
                  </div>
                  
                  {/* Usage */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Monthly usage</span>
                      <span className={planInfo.scansRemaining === 0 ? 'text-red-400' : 'text-gray-400'}>{planInfo.scansUsed}/{planInfo.scanLimit === -1 ? '∞' : planInfo.scanLimit}</span>
                    </div>
                    {planInfo.scanLimit !== -1 && (
                      <div className="h-1.5 bg-dark-accent rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${planInfo.scansUsed >= planInfo.scanLimit ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min(100, (planInfo.scansUsed / planInfo.scanLimit) * 100)}%` }} />
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Resets {new Date(planInfo.resetDate).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {planInfo.features.slice(0, 4).map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Check className="w-3 h-3 text-yellow-500" />{f}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-dark-secondary border border-dark-accent rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <h3 className="text-white font-semibold text-sm">Billing</h3>
                  </div>
                  <p className="text-gray-500 text-xs mb-2">{planInfo.id === 'essential' ? 'No payment method on file' : 'Manage your billing details'}</p>
                  <Link href="/pricing" className="text-yellow-500 text-xs hover:text-yellow-400">{planInfo.id === 'essential' ? 'View Plans' : 'Manage Billing'} →</Link>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-3">
                {isPasswordUser && (
                  <div className="bg-dark-secondary border border-dark-accent rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Key className="w-4 h-4 text-gray-500" />
                      <div><p className="text-white text-sm font-medium">Password</p><p className="text-gray-500 text-xs">Changed: {getPasswordLastChanged()}</p></div>
                    </div>
                    <button onClick={() => setShowPasswordModal(true)} className="px-3 py-1.5 border border-dark-accent text-gray-300 rounded-lg text-xs hover:border-yellow-500/50">Change</button>
                  </div>
                )}

                <div className="bg-dark-secondary border border-dark-accent rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-gray-500" />
                    <div><p className="text-white text-sm font-medium">Two-Factor Auth</p><p className="text-gray-500 text-xs">{is2FAEnabled ? 'Enabled' : 'Not enabled'}</p></div>
                  </div>
                  <button onClick={() => setShow2FAModal(true)} className={`px-3 py-1.5 rounded-lg text-xs ${is2FAEnabled ? 'border border-yellow-500/50 text-yellow-400' : 'border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10'}`}>{is2FAEnabled ? 'Manage' : 'Enable'}</button>
                </div>

                <div className="bg-dark-secondary border border-dark-accent rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-4 h-4 text-gray-500" />
                    <div><p className="text-white text-sm font-medium">Sessions</p><p className="text-gray-500 text-xs">{sessions.length} device{sessions.length !== 1 ? 's' : ''}</p></div>
                  </div>
                  <button onClick={() => setShowSessionsModal(true)} className="px-3 py-1.5 border border-dark-accent text-gray-300 rounded-lg text-xs hover:border-yellow-500/50">View</button>
                </div>

                <div className="bg-dark-secondary border border-dark-accent rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div><p className="text-white text-sm font-medium">Email Verification</p><p className="text-gray-500 text-xs">{user?.emailVerified ? 'Verified' : 'Not verified'}</p></div>
                  </div>
                  {user?.emailVerified ? <span className="text-yellow-400 text-xs flex items-center gap-1"><Check className="w-3 h-3" />Verified</span> : (
                    <button onClick={async () => { if (auth.currentUser) { await sendEmailVerification(auth.currentUser); toast.success('Email sent!'); }}} className="px-3 py-1.5 border border-yellow-500/50 text-yellow-400 rounded-lg text-xs hover:bg-yellow-500/10">Verify</button>
                  )}
                </div>

                <div className="bg-dark-secondary border border-red-500/20 rounded-xl p-4 mt-4">
                  <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-400" /><h4 className="text-red-400 text-sm font-medium">Danger Zone</h4></div>
                  <p className="text-gray-500 text-xs mb-2">Permanently delete your account</p>
                  <button onClick={handleDeleteAccount} className="px-3 py-1.5 border border-red-500/30 text-red-400 rounded-lg text-xs hover:bg-red-500/10 flex items-center gap-1"><Trash2 className="w-3 h-3" />Delete Account</button>
                </div>
              </div>
            )}

            {/* Breach Check Tab */}
            {activeTab === 'breach-check' && (
              <div className="bg-dark-secondary border border-dark-accent rounded-xl p-4">
                <EmailBreachChecker userEmail={user?.email || undefined} />
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-dark-secondary border border-dark-accent rounded-xl overflow-hidden">
                <div className="p-4 border-b border-dark-accent">
                  <h2 className="text-white font-semibold">Email Preferences</h2>
                </div>
                <div className="divide-y divide-dark-accent">
                  {[
                    { key: 'email', label: 'Email Notifications', desc: 'Important updates', value: emailNotifications, onChange: setEmailNotifications },
                    { key: 'scan', label: 'Scan Alerts', desc: 'When scans complete', value: scanAlerts, onChange: setScanAlerts },
                    { key: 'weekly', label: 'Weekly Report', desc: 'Security summary', value: weeklyReport, onChange: setWeeklyReport },
                    { key: 'marketing', label: 'Marketing', desc: 'News & offers', value: marketingEmails, onChange: setMarketingEmails },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-3">
                      <div><p className="text-white text-sm">{item.label}</p><p className="text-gray-500 text-xs">{item.desc}</p></div>
                      <button onClick={() => item.onChange(!item.value)} className={`w-10 h-5 rounded-full transition-colors relative ${item.value ? 'bg-yellow-500' : 'bg-gray-600'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${item.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-3 bg-dark-primary/30">
                    <div><p className="text-white text-sm">Security Alerts <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1 py-0.5 rounded ml-1">Required</span></p><p className="text-gray-500 text-xs">Critical notifications</p></div>
                    <div className="w-10 h-5 rounded-full bg-yellow-500 relative cursor-not-allowed"><div className="absolute top-0.5 translate-x-5 w-4 h-4 rounded-full bg-white" /></div>
                  </div>
                </div>
                <div className="px-4 py-3 bg-dark-primary/50 border-t border-dark-accent">
                  <button onClick={handleSaveNotifications} className="px-4 py-2 bg-yellow-500 text-black rounded-lg text-sm font-semibold hover:bg-yellow-400 flex items-center gap-1.5"><Save className="w-3.5 h-3.5" />Save</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-dark-secondary border border-dark-accent rounded-xl w-full max-w-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-1.5 hover:bg-dark-accent rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Current Password</label>
                <div className="relative">
                  <input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 pr-9 bg-dark-primary border border-dark-accent rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500" />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500">{showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">New Password</label>
                <div className="relative">
                  <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 pr-9 bg-dark-primary border border-dark-accent rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500" />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500">{showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
                <div className="flex gap-0.5 mt-1.5">{[1,2,3,4,5].map(l => <div key={l} className={`h-1 flex-1 rounded ${passwordStrength >= l ? passwordStrength >= 4 ? 'bg-yellow-500' : passwordStrength >= 2 ? 'bg-yellow-500' : 'bg-red-500' : 'bg-dark-accent'}`} />)}</div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full px-3 py-2 bg-dark-primary border rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500 ${confirmPassword && confirmPassword !== newPassword ? 'border-red-500' : 'border-dark-accent'}`} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 px-3 py-2 border border-dark-accent text-gray-300 rounded-lg text-sm hover:bg-dark-accent">Cancel</button>
              <button onClick={handleChangePassword} disabled={isSaving || !currentPassword || !newPassword || newPassword !== confirmPassword} className="flex-1 px-3 py-2 bg-yellow-500 text-black rounded-lg text-sm font-semibold hover:bg-yellow-400 disabled:opacity-50 flex items-center justify-center gap-1">
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-dark-secondary border border-dark-accent rounded-xl w-full max-w-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Two-Factor Auth</h3>
              <button onClick={() => setShow2FAModal(false)} className="p-1.5 hover:bg-dark-accent rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            {is2FAEnabled ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3"><Check className="w-6 h-6 text-yellow-500" /></div>
                <p className="text-white font-medium mb-1">2FA Enabled</p>
                <p className="text-gray-500 text-xs mb-4">Your account is protected</p>
                <button onClick={() => { toast.error('Contact support'); setShow2FAModal(false); }} className="px-4 py-2 border border-red-500/50 text-red-400 rounded-lg text-sm hover:bg-red-500/10">Disable</button>
              </div>
            ) : (
              <div>
                <div className="bg-dark-primary rounded-lg p-3 mb-4 text-xs">
                  <p className="text-white font-medium mb-1">Why enable 2FA?</p>
                  <ul className="text-gray-400 space-y-1">
                    <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-yellow-500" />Extra security layer</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-yellow-500" />Protect your data</li>
                  </ul>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Phone Number</label>
                  <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full px-3 py-2 bg-dark-primary border border-dark-accent rounded-lg text-white text-sm" placeholder="+1 555-0000" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setShow2FAModal(false)} className="flex-1 px-3 py-2 border border-dark-accent text-gray-300 rounded-lg text-sm hover:bg-dark-accent">Cancel</button>
                  <button onClick={handleEnable2FA} className="flex-1 px-3 py-2 bg-yellow-500 text-black rounded-lg text-sm font-semibold hover:bg-yellow-400">Enable</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sessions Modal */}
      {showSessionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-dark-secondary border border-dark-accent rounded-xl w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Active Sessions</h3>
              <button onClick={() => setShowSessionsModal(false)} className="p-1.5 hover:bg-dark-accent rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sessions.map(s => (
                <div key={s.id} className={`p-3 bg-dark-primary rounded-lg ${s.current ? 'border border-yellow-500/30' : 'border border-dark-accent'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {s.device === 'Desktop' ? <Monitor className="w-4 h-4 text-gray-500" /> : <Smartphone className="w-4 h-4 text-gray-500" />}
                      <div>
                        <p className="text-white text-sm flex items-center gap-1.5">{s.browser} on {s.device} {s.current && <span className="px-1 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">Current</span>}</p>
                        <p className="text-gray-500 text-xs flex items-center gap-2"><MapPin className="w-3 h-3" />{s.location} <Clock className="w-3 h-3" />{s.current ? 'Now' : new Date(s.lastActive).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {!s.current && <button onClick={() => handleRevokeSession(s.id)} className="text-red-400 text-xs hover:text-red-300">Revoke</button>}
                  </div>
                </div>
              ))}
            </div>
            {sessions.length > 1 && <button onClick={handleRevokeAllSessions} className="w-full mt-3 px-3 py-2 border border-red-500/50 text-red-400 rounded-lg text-sm hover:bg-red-500/10">Sign Out All Others</button>}
            <button onClick={() => setShowSessionsModal(false)} className="w-full mt-2 px-3 py-2 bg-dark-accent text-gray-300 rounded-lg text-sm hover:bg-dark-primary">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

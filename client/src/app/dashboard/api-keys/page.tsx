'use client';

import { useEffect, useState } from 'react';
import { addDoc, collection, getDocs, query, where, serverTimestamp, updateDoc, doc, orderBy, limit as fbLimit } from 'firebase/firestore';
import { Shield, Key, RefreshCw, Copy, Check, Trash2 } from 'lucide-react';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { useScanLimits } from '@/hooks/useScanLimits';
import toast from 'react-hot-toast';

interface ApiKeyRow {
  id: string;
  name: string;
  createdAt?: Date | null;
  lastUsedAt?: Date | null;
  usageCount?: number;
  active: boolean;
  rateLimit: number;
  plan: 'business' | 'enterprise';
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(bytes: Uint8Array) {
  const buf = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return bytesToHex(new Uint8Array(buf));
}

// Admin emails for bypass
const ADMIN_EMAILS = ['nodarirusishvililinkedin@gmail.com'];

export default function ApiKeysPage() {
  const { user, loading } = useAuth();
  const { planInfo, isAdmin } = useScanLimits();
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [plainKey, setPlainKey] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  // Check if user is admin by email
  const userIsAdmin = isAdmin || (user?.email && ADMIN_EMAILS.some(e => e.toLowerCase() === user.email?.toLowerCase()));
  
  const rateLimit = planInfo?.id === 'enterprise' ? 100 : userIsAdmin ? 100 : 10;
  const plan = (planInfo?.id === 'enterprise' ? 'enterprise' : 'pro') as ApiKeyRow['plan'];
  // Admins can always access API keys - Pro and Enterprise have API access
  const isEligible = userIsAdmin || planInfo?.id === 'pro' || planInfo?.id === 'enterprise';

  useEffect(() => {
    if (!user) return;
    const fetchKeys = async () => {
      try {
        // Try ordered query (requires index)
        const qOrdered = query(
          collection(db, 'apiKeys'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          fbLimit(50)
        );
        const snap = await getDocs(qOrdered);
        const rows: ApiKeyRow[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            createdAt: data.createdAt?.toDate?.() || null,
            lastUsedAt: data.lastUsedAt?.toDate?.() || null,
            usageCount: data.usageCount || 0,
            active: data.active !== false,
            rateLimit: data.rateLimit || rateLimit,
            plan: data.plan || plan,
          };
        });
        setKeys(rows);
      } catch (error: any) {
        // Fallback without orderBy if index is missing
        if (error?.code === 'failed-precondition') {
          console.warn('Missing index for apiKeys, falling back to unordered fetch.', error);
          const qSimple = query(
            collection(db, 'apiKeys'),
            where('userId', '==', user.uid),
            fbLimit(50)
          );
          const snap = await getDocs(qSimple);
          const rows: ApiKeyRow[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name,
              createdAt: data.createdAt?.toDate?.() || null,
              lastUsedAt: data.lastUsedAt?.toDate?.() || null,
              usageCount: data.usageCount || 0,
              active: data.active !== false,
              rateLimit: data.rateLimit || rateLimit,
              plan: data.plan || plan,
            };
          });
          setKeys(rows);
          toast.error('Firestore index missing for API keys; fetched without ordering. Create index for best results.');
        } else if (error?.code === 'permission-denied') {
          toast.error('Missing permissions to read API keys. Check Firestore rules or sign in again.');
        } else {
          console.error(error);
          toast.error('Failed to load API keys');
        }
      }
    };
    fetchKeys().catch((err) => {
      console.error(err);
      toast.error('Failed to load API keys');
    });
  }, [user, rateLimit, plan]);

  const handleCreate = async () => {
    if (!user) return;
    if (!newName.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!isEligible) {
      toast.error('API access requires Business or Enterprise plan. Upgrade to get API access.');
      return;
    }
    
    console.log('Creating API key for user:', user.uid, 'Plan:', plan, 'IsAdmin:', userIsAdmin);
    try {
      setCreating(true);
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      const plain = bytesToHex(bytes);
      const hash = await sha256Hex(bytes);

      const docRef = await addDoc(collection(db, 'apiKeys'), {
        userId: user.uid,
        keyHash: hash,
        name: newName.trim(),
        createdAt: serverTimestamp(),
        lastUsedAt: null,
        usageCount: 0,
        rateLimit,
        plan,
        scopes: ['scan:create', 'scan:read'],
        active: true,
        expiresAt: null,
      });

      setPlainKey(plain);
      setNewName('');
      setKeys((prev) => [
        {
          id: docRef.id,
          name: newName.trim(),
          createdAt: new Date(),
          lastUsedAt: null,
          usageCount: 0,
          active: true,
          rateLimit,
          plan,
        },
        ...prev,
      ]);
      toast.success('API key created. Copy it now!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await updateDoc(doc(db, 'apiKeys', id), { active: false });
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, active: false } : k)));
      toast.success('API key revoked');
    } catch (error) {
      console.error(error);
      toast.error('Failed to revoke key');
    }
  };

  const copyKey = async () => {
    if (!plainKey) return;
    await navigator.clipboard.writeText(plainKey);
    setCopyState('copied');
    setTimeout(() => setCopyState('idle'), 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold">Developer API Keys</h1>
            <p className="text-gray-400 text-sm">
              Business: 10 req/min • Enterprise: 100 req/min • Keys are shown only once.
            </p>
          </div>
        </div>

        <div className="bg-dark-secondary border border-dark-accent rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-xl font-semibold">Create new key</h2>
            {!isEligible && (
              <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                Upgrade to Business/Enterprise
              </span>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Key name (e.g., Production CI)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-black border border-dark-accent focus:border-yellow-500 outline-none"
            />
            <button
              onClick={handleCreate}
              disabled={creating || loading || !isEligible}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-60"
            >
              {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Generate
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            Plan: {plan === 'enterprise' ? 'Enterprise' : 'Business'} • Rate limit: {rateLimit} req/min
          </p>

          {plainKey && (
            <div className="mt-4 p-4 rounded-lg bg-black border border-yellow-500/40">
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-sm break-all">{plainKey}</div>
                <button
                  onClick={copyKey}
                  className="flex items-center gap-2 px-3 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-400"
                >
                  {copyState === 'copied' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copyState === 'copied' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-red-400 mt-2">Store this key securely. You won’t see it again.</p>
            </div>
          )}
        </div>

        <div className="bg-dark-secondary border border-dark-accent rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your API keys</h2>
            <span className="text-sm text-gray-400">{keys.length} keys</span>
          </div>

          {keys.length === 0 ? (
            <p className="text-gray-500">No keys yet. Create one above.</p>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-black border border-dark-accent rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="font-semibold">{key.name}</p>
                    <p className="text-xs text-gray-500">
                      {key.plan} • {key.rateLimit} req/min • {key.usageCount || 0} uses
                    </p>
                    <p className="text-xs text-gray-500">
                      Created: {key.createdAt?.toLocaleString?.() || '—'} • Last used:{' '}
                      {key.lastUsedAt?.toLocaleString?.() || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        key.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {key.active ? 'Active' : 'Revoked'}
                    </span>
                    {key.active && (
                      <button
                        onClick={() => handleRevoke(key.id)}
                        className="flex items-center gap-1 px-3 py-2 rounded-md border border-red-500/40 text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


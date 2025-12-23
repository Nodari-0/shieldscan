'use server';

/**
 * Developer API Key utilities.
 * - Generates cryptographically secure API keys
 * - Stores only hashed keys in Firestore
 * - Validates and revokes keys
 *
 * NOTE: This uses the Firebase client SDK. Ensure Firestore rules allow
 * server-side access for apiKeys collection (admin-only writes/reads).
 */

import crypto from 'crypto';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/firebase/config';

export type ApiPlan = 'business' | 'enterprise';

export interface ApiKeyRecord {
  id: string;
  userId: string;
  keyHash: string;
  name: string;
  createdAt: Date | null;
  lastUsedAt: Date | null;
  usageCount: number;
  rateLimit: number;
  plan: ApiPlan;
  scopes: string[];
  active: boolean;
  expiresAt?: Date | null;
}

const API_KEY_BYTES = 32;

function hashKey(key: string) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export function generateApiKey(): { plain: string; hash: string } {
  const plain = crypto.randomBytes(API_KEY_BYTES).toString('hex');
  return { plain, hash: hashKey(plain) };
}

export async function createApiKey(params: {
  userId: string;
  name: string;
  plan: ApiPlan;
  scopes: string[];
  rateLimit: number;
  expiresAt?: Date;
}): Promise<{ id: string; apiKey: string }> {
  const { plain, hash } = generateApiKey();

  const docRef = await addDoc(collection(db, 'apiKeys'), {
    userId: params.userId,
    keyHash: hash,
    name: params.name,
    createdAt: serverTimestamp(),
    lastUsedAt: null,
    usageCount: 0,
    rateLimit: params.rateLimit,
    plan: params.plan,
    scopes: params.scopes,
    active: true,
    expiresAt: params.expiresAt ?? null,
  });

  return { id: docRef.id, apiKey: plain };
}

export async function validateApiKey(apiKey: string) {
  const keyHash = hashKey(apiKey);
  const q = query(collection(db, 'apiKeys'), where('keyHash', '==', keyHash), where('active', '==', true));
  const snap = await getDocs(q);

  if (snap.empty) {
    return null;
  }

  const docRef = snap.docs[0];
  const data = docRef.data();

  // Expiry check
  if (data.expiresAt && data.expiresAt.toDate && data.expiresAt.toDate() < new Date()) {
    await updateDoc(docRef.ref, { active: false });
    return null;
  }

  // Update usage
  await updateDoc(docRef.ref, {
    usageCount: (data.usageCount || 0) + 1,
    lastUsedAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    userId: data.userId as string,
    plan: data.plan as ApiPlan,
    scopes: data.scopes as string[],
    rateLimit: data.rateLimit as number,
  };
}

export async function revokeApiKey(id: string) {
  const ref = doc(db, 'apiKeys', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  await updateDoc(ref, { active: false });
}


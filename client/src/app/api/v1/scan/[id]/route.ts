import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { validateApiKeyRequest } from '@/lib/api/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const apiKeyValidation = await validateApiKeyRequest(request);
  if (!apiKeyValidation.ok) return apiKeyValidation.res;
  const apiKey = apiKeyValidation.key!;

  try {
    const ref = doc(db, 'scans', params.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    const data = snap.data();
    if (data.userId !== apiKey.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      id: snap.id,
      ...data,
    });
  } catch (error) {
    console.error('GET scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


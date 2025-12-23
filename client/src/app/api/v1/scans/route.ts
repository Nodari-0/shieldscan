import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { validateApiKeyRequest } from '@/lib/api/auth';

export async function GET(request: NextRequest) {
  const apiKeyValidation = await validateApiKeyRequest(request);
  if (!apiKeyValidation.ok) return apiKeyValidation.res;
  const apiKey = apiKeyValidation.key!;

  const { searchParams } = new URL(request.url);
  const pageSize = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
  const cursor = searchParams.get('cursor');

  try {
    const scansRef = collection(db, 'scans');
    let q = query(
      scansRef,
      where('userId', '==', apiKey.userId),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    // Firestore cursor support (createdAt)
    if (cursor) {
      // We expect cursor to be ISO string date
      q = query(
        scansRef,
        where('userId', '==', apiKey.userId),
        orderBy('createdAt', 'desc'),
        startAfter(new Date(cursor)),
        limit(pageSize)
      );
    }

    const snap = await getDocs(q);
    const scans = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const nextCursor =
      snap.docs.length === pageSize
        ? scans[scans.length - 1]?.createdAt?.toDate?.()?.toISOString?.() || null
        : null;

    return NextResponse.json({ scans, nextCursor });
  } catch (error) {
    console.error('List scans error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


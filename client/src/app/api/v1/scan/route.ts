import { NextRequest, NextResponse } from 'next/server';
import { validateApiKeyRequest } from '@/lib/api/auth';
import { queueScan, registerScanProcessor } from '@/lib/queueManager';
import { runSecurityScan } from '@/lib/scanners';
import { saveScanRecord } from '@/firebase/firestore';

// Register processor once per runtime
let processorRegistered = false;
function ensureProcessor() {
  if (processorRegistered) return;
  registerScanProcessor(async ({ userId, userEmail, url, plan, tags }) => {
    const start = Date.now();
    const result = await runSecurityScan(url, { plan });

    // Persist scan record (minimal fields for listing)
    await saveScanRecord({
      userId,
      userEmail,
      url: result.url,
      score: result.score,
      grade: result.grade,
      checksCount: result.summary.total,
      passed: result.summary.passed,
      warnings: result.summary.warnings,
      failed: result.summary.failed,
      duration: Date.now() - start,
      tags,
      scheduledScanId: undefined,
    });
  });
  processorRegistered = true;
}

export async function POST(request: NextRequest) {
  const apiKeyValidation = await validateApiKeyRequest(request);
  if (!apiKeyValidation.ok) return apiKeyValidation.res;
  const apiKey = apiKeyValidation.key!;

  try {
    const { url, tags = [] } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    }

    ensureProcessor();

    const jobId = await queueScan({
      userId: apiKey.userId,
      userEmail: 'api-user',
      url,
      plan: apiKey.plan,
      tags,
    });

    return NextResponse.json({
      scanId: jobId,
      status: 'queued',
    });
  } catch (error: any) {
    console.error('API scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


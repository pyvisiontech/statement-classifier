/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function normalizeSig(sig: string | null) {
  if (!sig) return '';
  // accept either raw hex or "sha256=<hex>"
  return sig.startsWith('sha256=') ? sig.slice(7) : sig;
}

export async function POST(req: NextRequest) {
  try {
    // 1) Read raw body (must use text() BEFORE parsing to compute HMAC)
    const raw = await req.text();

    // 2) Verify signature from header
    const provided = normalizeSig(req.headers.get('x-signature'));
    if (!WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Missing WEBHOOK_SECRET' },
        { status: 500 }
      );
    }
    if (!provided) {
      return NextResponse.json(
        { error: 'Missing x-signature' },
        { status: 401 }
      );
    }

    const expected = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(raw)
      .digest('hex');
    if (!timingSafeEqual(provided, expected)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3) Parse and validate body (expect an array of objects)
    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (!Array.isArray(payload)) {
      return NextResponse.json(
        { error: 'Expected an array payload' },
        { status: 400 }
      );
    }

    // 4) For now, just log each item’s fields
    for (const [i, item] of payload.entries()) {
      const obj = item as {
        accountant_id?: string;
        client_id?: string;
        file_id?: string;
        category_id?: string | null;
        reason_by_ai?: string | null;
      };

      // soft validation (no hard fail yet)
      const { accountant_id, client_id, file_id, category_id, reason_by_ai } =
        obj;
      // eslint-disable-next-line no-console
      console.log(`[transactions/webhook] item #${i}:`, {
        client_id,
        file_id,
        category_id,
        reason_by_ai,
        accountant_id,
      });
    }

    // 5) Respond OK
    return NextResponse.json({ ok: true, count: payload.length });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[transactions/webhook] error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

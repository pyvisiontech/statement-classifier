/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

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
    // 1) Read raw body for HMAC
    const raw = await req.text();

    // 2) Verify signature
    if (!WEBHOOK_SECRET)
      return NextResponse.json(
        { error: 'Missing WEBHOOK_SECRET' },
        { status: 500 }
      );
    const provided = normalizeSig(req.headers.get('x-signature'));
    if (!provided)
      return NextResponse.json(
        { error: 'Missing x-signature' },
        { status: 401 }
      );
    const expected = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(raw)
      .digest('hex');
    if (!timingSafeEqual(provided, expected)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3) Parse JSON: accept { events: [...] } or raw [...]
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const events = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === 'object' &&
          Array.isArray((parsed as any).events)
        ? (parsed as any).events
        : null;
    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Expected body to be { "events": [...] } or a JSON array' },
        { status: 400 }
      );
    }

    // 4) Map + soft-validate to DB rows
    type Incoming = {
      accountant_id?: string;
      client_id?: string;
      file_id?: string;
      category_id?: string | null;
      reason?: string | null;
      confidence?: string | number | null;
    };

    const rows = [];
    const invalids: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < events.length; i++) {
      const e = events[i] as Incoming;
      const {
        accountant_id,
        client_id,
        file_id,
        category_id,
        reason,
        confidence,
      } = e || {};
      if (!accountant_id || !client_id || !file_id) {
        invalids.push({
          index: i,
          error: 'Missing required field(s): accountant_id, client_id, file_id',
        });
        continue;
      }
      rows.push({
        accountant_id,
        client_id,
        file_id,
        category_id_by_ai: category_id ?? null,
        updated_category_id: null,
        reason: reason ?? null,
        confidence: confidence != null ? String(confidence) : null, // store as TEXT
        // updated_by stays null; timestamps handled by defaults
      });
    }

    if (rows.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          inserted: 0,
          invalids,
          message: 'No valid events to insert',
        },
        { status: 400 }
      );
    }

    // 5) Insert in bulk using service role (bypasses RLS)
    const { data, error } = await admin
      .from('transactions')
      .insert(rows)
      .select('id');
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      inserted: data?.length ?? 0,
      invalids,
    });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[transactions/webhook] insert error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

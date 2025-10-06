/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-only secret
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? 'client-files';

export async function POST(req: Request) {
  try {
    const { clientId, filename } = await req.json();

    if (!clientId || !filename) {
      return NextResponse.json(
        { error: 'Missing clientId or filename' },
        { status: 400 }
      );
    }

    // Build a safe storage path. Example: clients/<clientId>/<timestamp>_<filename>
    const ts = Date.now();
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `clients/${clientId}/${ts}_${safeName}`;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });
    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? 'Failed to create signed upload URL' },
        { status: 500 }
      );
    }

    // You can enforce contentType on upload call; including here for the client to use
    return NextResponse.json({
      bucket: BUCKET,
      path,
      token: data.token,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}

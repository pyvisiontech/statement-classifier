import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? 'client-files';

export async function POST(req: Request) {
  const { path, expiresIn = 300 } = await req.json();
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ signedUrl: data.signedUrl });
}

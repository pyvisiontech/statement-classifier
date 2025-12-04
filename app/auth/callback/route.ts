import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabase } from '@/utils/supabase/routeHandlerClient';
import { Session, User } from '@supabase/supabase-js';

interface UserMetadata {
  first_name?: string;
  [key: string]: string | number | boolean | null | undefined; // Replaced 'any' with specific types
}

// Use intersection types instead of extending
type UserWithMetadata = User & {
  user_metadata?: UserMetadata;
  email?: string;
  id?: string;
};

type SessionWithUser = Session & {
  user: UserWithMetadata;
};

interface EnsureAccountantParams {
  supabase: Awaited<ReturnType<typeof createRouteHandlerSupabase>>;
  session: SessionWithUser | null;
}

async function ensureAccountantForUser({
  supabase,
  session,
}: EnsureAccountantParams): Promise<void> {
  const user = session?.user;
  if (!user?.email) return;

  const firstNameFromMeta = user.user_metadata?.first_name ?? user.email.split('@')[0];

  const { error } = await supabase.from('accountants').upsert(
    {
      id: user.id,
      email: user.email,
      first_name: firstNameFromMeta,
      is_active: true,
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('Failed to upsert accountant row:', error.message);
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createRouteHandlerSupabase();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('exchangeCodeForSession error:', error.message);
    } else if (data?.session) {
      await ensureAccountantForUser({ 
        supabase, 
        session: data.session as SessionWithUser
      });
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createRouteHandlerSupabase();
  const { event, session } = (await request.json()) as {
    event: string;
    session: SessionWithUser | null;
  };

  if (event === 'SIGNED_OUT') {
    await supabase.auth.signOut();
  } else if (session) {
    await supabase.auth.setSession(session);
    await ensureAccountantForUser({ 
      supabase, 
      session 
    });
  }

  return NextResponse.json({ success: true });
}
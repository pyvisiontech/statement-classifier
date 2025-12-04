'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/contexts/SupabaseContext';

const LogoutPage = () => {
  const router = useRouter();
  const supabase = useSupabase();

  useEffect(() => {
    const signOut = async () => {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Logout failed', err);
      } finally {
        router.replace('/signin');
      }
    };

    signOut();
  }, [router, supabase]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
    </div>
  );
};

export default LogoutPage;

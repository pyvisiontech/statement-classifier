'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSupabase } from '@/contexts/SupabaseContext';
import { Spinner } from '@/components/ui/spinner';

const LogoutPage = () => {
  const supabaseClient = useSupabase();
  const router = useRouter();

  useEffect(() => {
    const signOut = async () => {
      await supabaseClient.auth.signOut();
      router.push('/login');
    };
    signOut();
  }, [supabaseClient, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner />
    </div>
  );
};

export default LogoutPage;

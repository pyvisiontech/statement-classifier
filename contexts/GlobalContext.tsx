'use client';

import { useRouter } from 'next/navigation';

import React, { createContext, useContext, useEffect, useState } from 'react';

import type { AccountantData } from '@/types/supabaseHelperTypes';

import { useSession, useSupabase } from './SupabaseContext';

// Define the types of the variables you want to store in the context
interface GlobalContextData {
  user: AccountantData | null;
  refreshData: () => void;
}

const createInitialState = () =>
  ({
    user: null,
    refreshData: () => {},
  }) satisfies GlobalContextData;

// Create the context with default values
const GlobalContext = createContext<GlobalContextData>(createInitialState());

// Create a custom hook for easier access to the context values
export function useGlobalContext() {
  return useContext(GlobalContext);
}

interface GlobalContextProviderProps {
  children: React.ReactNode;
}

// Fetch the values of the variables and provide them to the whole app
export const GlobalContextProvider: React.FC<GlobalContextProviderProps> = ({
  children,
}) => {
  const [contextData, setContextData] =
    useState<GlobalContextData>(createInitialState());
  const supabase = useSupabase();
  const session = useSession();

  const router = useRouter();

  const [refreshDataState, setRefreshDataState] = useState<Number>(
    new Date().getTime()
  );

  const refreshData = () => {
    setRefreshDataState(new Date().getTime());
  };

  useEffect(() => {
    if (!session?.user.id) return;
    supabase
      .from('accountants')
      .select('*')
      .eq('id', session?.user.id)
      .single()
      .then(async ({ data: user }) => {
        console.log(user, 'USER');
        // If user record exists but is deactivated, log them out
        if (user && !user.is_active) {
          router.push('/logout');
          return;
        }

        setContextData((prev) => ({
          ...prev,
          user: user ?? null,
          refreshData,
        }));
      });
  }, [session?.user.id, refreshDataState]);

  return <GlobalContext value={contextData}>{children}</GlobalContext>;
};

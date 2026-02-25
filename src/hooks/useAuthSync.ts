import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to sync authentication state with React Query cache
 * - Clears all cache when user logs out
 * - Clears all cache when user changes (different user logs in)
 * This prevents cache leakage between users
 */
export const useAuthSync = () => {
  const queryClient = useQueryClient();
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    // Get initial user
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      previousUserId.current = user?.id || null;
    };
    initUser();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const newUserId = session?.user?.id || null;

        console.log('[AuthSync] Auth event:', event, 'User:', newUserId);

        // Case 1: User logged out (SIGNED_OUT)
        if (event === 'SIGNED_OUT') {
          console.log('[AuthSync] User signed out - clearing all cache');
          queryClient.clear();
          previousUserId.current = null;
          return;
        }

        // Case 2: User changed (different user logged in)
        if (
          event === 'SIGNED_IN' && 
          previousUserId.current && 
          newUserId && 
          previousUserId.current !== newUserId
        ) {
          console.log('[AuthSync] User changed - clearing all cache');
          console.log('[AuthSync] Previous user:', previousUserId.current);
          console.log('[AuthSync] New user:', newUserId);
          queryClient.clear();
        }

        // Case 3: Token refreshed (same user, just refresh)
        if (event === 'TOKEN_REFRESHED') {
          console.log('[AuthSync] Token refreshed - keeping cache');
          // Don't clear cache, just update user ID
        }

        // Case 4: Initial session or signed in
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          console.log('[AuthSync] Session initialized/signed in');
          // If it's a new user (first login or different user)
          if (previousUserId.current !== newUserId) {
            console.log('[AuthSync] New user detected - clearing cache');
            queryClient.clear();
          }
        }

        // Update current user ID
        previousUserId.current = newUserId;
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);
};

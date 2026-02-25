import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

export interface Quote {
  id: string;
  quote_code: string;
  customer_id: string;
  date: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  confirmed_at: string | null;
  created_at: string;
  user_id: string;
  customers?: {
    name: string;
    phone: string;
  };
}

// Query keys factory - ensures consistent and user-specific cache keys
export const quoteKeys = {
  all: (userId: string) => ['quotes', userId] as const,
  lists: (userId: string) => [...quoteKeys.all(userId), 'list'] as const,
  list: (userId: string, filters?: any) => [...quoteKeys.lists(userId), filters] as const,
  details: (userId: string) => [...quoteKeys.all(userId), 'detail'] as const,
  detail: (userId: string, id: string) => [...quoteKeys.details(userId), id] as const,
};

/**
 * Fetch all quotes with user-specific filtering (RLS)
 * Admin sees all quotes, agents see only their customers' quotes
 */
export const fetchQuotes = async (userId: string, isAdmin: boolean) => {
  // Auto-expire pending quotes after 30 days
  await supabase.rpc('auto_expire_pending_quotes');

  // RLS policies handle access control automatically
  const { data, error } = await supabase
    .from('quotes')
    .select(`
      *,
      customers (
        name,
        phone
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch agent names if admin
  let agentNames: Record<string, string> = {};
  if (isAdmin && data.length > 0) {
    const agentIds = [...new Set(data.map(q => q.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', agentIds);

    if (profiles) {
      agentNames = profiles.reduce((acc, profile) => {
        acc[profile.id] = profile.full_name || 'Chưa đặt tên';
        return acc;
      }, {} as Record<string, string>);
    }
  }

  return data.map(quote => ({
    ...quote,
    agent_name: agentNames[quote.user_id]
  }));
};

/**
 * Hook to fetch quotes with caching and real-time updates
 */
export const useQuotes = (isAdmin: boolean) => {
  const queryClient = useQueryClient();

  // Get current user ID
  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: Infinity, // User data rarely changes
  });

  const userId = userData?.id || '';

  // Fetch quotes with caching
  const query = useQuery({
    queryKey: quoteKeys.list(userId, { isAdmin }),
    queryFn: () => fetchQuotes(userId, isAdmin),
    enabled: !!userId, // Only run when we have userId
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep unused data in cache for 30 minutes (formerly cacheTime)
  });

  // Setup real-time subscription to invalidate cache on changes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`quotes-list-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'quotes'
        },
        (payload) => {
          console.log('[Quotes] Quotes changed, invalidating cache', payload.eventType);
          // Invalidate and refetch quotes when any change occurs
          queryClient.invalidateQueries({ queryKey: quoteKeys.lists(userId) });
          // Also invalidate dashboard to keep it in sync
          queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
};

/**
 * Hook to fetch a single quote by ID
 */
export const useQuote = (quoteId: string, isAdmin: boolean) => {
  const queryClient = useQueryClient();

  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: Infinity,
  });

  const userId = userData?.id || '';

  const query = useQuery({
    queryKey: quoteKeys.detail(userId, quoteId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          customers (
            name,
            phone,
            address
          )
        `)
        .eq('id', quoteId)
        .single();

      if (error) throw error;

      // Fetch agent name if admin
      if (isAdmin && data.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.user_id)
          .single();

        return {
          ...data,
          agent_name: profile?.full_name || 'Chưa đặt tên'
        };
      }

      return data;
    },
    enabled: !!userId && !!quoteId,
    staleTime: 1000 * 60 * 5,
  });

  // Real-time updates for single quote
  useEffect(() => {
    if (!userId || !quoteId) return;

    const channel = supabase
      .channel(`quote-${quoteId}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes',
          filter: `id=eq.${quoteId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: quoteKeys.detail(userId, quoteId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, quoteId, queryClient]);

  return query;
};

/**
 * Mutation to update quote status
 */
export const useUpdateQuoteStatus = () => {
  const queryClient = useQueryClient();

  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const userId = userData?.id || '';

  return useMutation({
    mutationFn: async ({ 
      quoteId, 
      status, 
      confirmedAt 
    }: { 
      quoteId: string; 
      status: 'pending' | 'confirmed' | 'cancelled';
      confirmedAt?: string | null;
    }) => {
      const updateData: any = { status };
      if (confirmedAt !== undefined) {
        updateData.confirmed_at = confirmedAt;
      }

      const { data, error } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', quoteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ quoteId, status, confirmedAt }) => {
      // Cancel all outgoing refetches for quotes
      await queryClient.cancelQueries({ queryKey: ['quotes', userId] });
      await queryClient.cancelQueries({ queryKey: ['dashboard', userId] });

      // Snapshot previous values for rollback
      const previousQuotes = queryClient.getQueryData(quoteKeys.lists(userId));

      // Optimistically update all quote-related caches
      queryClient.setQueriesData({ queryKey: ['quotes', userId] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((quote: Quote) =>
            quote.id === quoteId
              ? { ...quote, status, confirmed_at: confirmedAt }
              : quote
          );
        }
        return old;
      });

      // Optimistically update dashboard recent quotes
      queryClient.setQueriesData({ queryKey: ['dashboard', userId, 'recent-quotes'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((quote: any) =>
            quote.id === quoteId
              ? { ...quote, status, confirmedAt }
              : quote
          );
        }
        return old;
      });

      return { previousQuotes };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousQuotes) {
        queryClient.setQueryData(quoteKeys.lists(userId), context.previousQuotes);
      }
      toast.error('Không thể cập nhật trạng thái');
      console.error(err);
    },
    onSuccess: () => {
      // Invalidate all quote-related queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['quotes', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
    },
  });
};

/**
 * Mutation to delete quote
 */
export const useDeleteQuote = () => {
  const queryClient = useQueryClient();

  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const userId = userData?.id || '';

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (error) throw error;
    },
    onMutate: async (quoteId) => {
      await queryClient.cancelQueries({ queryKey: ['quotes', userId] });
      await queryClient.cancelQueries({ queryKey: ['dashboard', userId] });

      const previousQuotes = queryClient.getQueryData(quoteKeys.lists(userId));

      // Optimistically remove from all caches
      queryClient.setQueriesData({ queryKey: ['quotes', userId] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.filter((quote: Quote) => quote.id !== quoteId);
        }
        return old;
      });

      queryClient.setQueriesData({ queryKey: ['dashboard', userId, 'recent-quotes'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.filter((quote: any) => quote.id !== quoteId);
        }
        return old;
      });

      return { previousQuotes };
    },
    onError: (err, variables, context) => {
      if (context?.previousQuotes) {
        queryClient.setQueryData(quoteKeys.lists(userId), context.previousQuotes);
      }
      toast.error('Không thể xóa báo giá');
      console.error(err);
    },
    onSuccess: () => {
      toast.success('Đã xóa báo giá');
      queryClient.invalidateQueries({ queryKey: ['quotes', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
    },
  });
};

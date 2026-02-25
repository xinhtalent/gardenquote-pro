import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface DashboardStats {
  totalRevenue: number;
  totalRevenueChange: number;
  newCustomers: number;
  newCustomersChange: number;
  conversionRate: number;
  conversionRateChange: number;
  totalCustomers: number;
  totalCustomersChange: number;
}

export interface RecentQuote {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  createdAt: string;
  total: number;
  status: string;
  quoteCode: string;
  confirmedAt: string | null;
  user_id: string;
  agent_name?: string;
}

// Query keys factory for dashboard
export const dashboardKeys = {
  all: (userId: string) => ['dashboard', userId] as const,
  stats: (userId: string) => [...dashboardKeys.all(userId), 'stats'] as const,
  recentQuotes: (userId: string) => [...dashboardKeys.all(userId), 'recent-quotes'] as const,
  paymentEmojis: (userId: string) => [...dashboardKeys.all(userId), 'payment-emojis'] as const,
};

/**
 * Calculate percentage change between two values
 */
const calculateChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

/**
 * Fetch dashboard statistics
 */
export const fetchDashboardStats = async (userId: string, isAdmin: boolean): Promise<DashboardStats> => {
  // Date calculations
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);

  // RLS policies handle access control - admins see all, agents see their customers' quotes
  const { data: currentQuotes } = await supabase
    .from('quotes')
    .select('total_amount, status, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const { data: allQuotes } = await supabase
    .from('quotes')
    .select('total_amount, created_at');

  const { data: currentNewCustomers } = await supabase
    .from('customers')
    .select('id, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const { data: allCustomers } = await supabase
    .from('customers')
    .select('id, created_at');

  // Calculate stats for previous period (30-60 days ago)
  const { data: previousQuotes } = await supabase
    .from('quotes')
    .select('total_amount, status, created_at')
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString());

  const { data: previousNewCustomers } = await supabase
    .from('customers')
    .select('id, created_at')
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString());

  // Count customers before 30 days ago (for total customers comparison)
  const customersBeforeCurrentPeriod = allCustomers?.filter(c => 
    new Date(c.created_at) < thirtyDaysAgo
  ).length || 0;

  // Current period calculations - Revenue only counts 'confirmed' status
  const currentRevenue = currentQuotes?.filter(q => q.status === 'confirmed').reduce((sum, q) => sum + Number(q.total_amount), 0) || 0;
  const currentPaid = currentQuotes?.filter(q => q.status === 'confirmed').length || 0;
  const currentTotal = currentQuotes?.length || 0;
  const currentConversionRate = currentTotal > 0 ? Math.round((currentPaid / currentTotal) * 100) : 0;

  // Previous period calculations - Revenue only counts 'confirmed' status
  const previousRevenue = previousQuotes?.filter(q => q.status === 'confirmed').reduce((sum, q) => sum + Number(q.total_amount), 0) || 0;
  const previousPaid = previousQuotes?.filter(q => q.status === 'confirmed').length || 0;
  const previousTotal = previousQuotes?.length || 0;
  const previousConversionRate = previousTotal > 0 ? Math.round((previousPaid / previousTotal) * 100) : 0;

  // Total quotes amount (all statuses)
  const totalQuotesAmount = allQuotes?.reduce((sum, q) => sum + Number(q.total_amount), 0) || 0;
  const currentPeriodQuotesAmount = currentQuotes?.reduce((sum, q) => sum + Number(q.total_amount), 0) || 0;
  const previousPeriodQuotesAmount = previousQuotes?.reduce((sum, q) => sum + Number(q.total_amount), 0) || 0;

  return {
    totalRevenue: currentRevenue,
    totalRevenueChange: calculateChange(currentRevenue, previousRevenue),
    newCustomers: totalQuotesAmount, // Shows total quotes amount instead of new customers
    newCustomersChange: calculateChange(currentPeriodQuotesAmount, previousPeriodQuotesAmount),
    conversionRate: currentConversionRate,
    conversionRateChange: calculateChange(currentConversionRate, previousConversionRate),
    totalCustomers: allCustomers?.length || 0,
    totalCustomersChange: calculateChange(allCustomers?.length || 0, customersBeforeCurrentPeriod)
  };
};

/**
 * Fetch recent quotes for dashboard
 */
export const fetchRecentQuotes = async (userId: string, isAdmin: boolean): Promise<RecentQuote[]> => {
  // RLS policies handle access control automatically
  const { data: quotesData, error: quotesError } = await supabase
    .from('quotes')
    .select(`
      *,
      customers (
        name,
        phone
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (quotesError) throw quotesError;

  // Fetch agent names if admin
  let agentNames: Record<string, string> = {};
  if (isAdmin && quotesData.length > 0) {
    const agentIds = [...new Set(quotesData.map(q => q.user_id))];
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

  return quotesData.map(quote => ({
    id: quote.id,
    customerName: quote.customers?.name || '',
    customerPhone: quote.customers?.phone || '',
    date: quote.date,
    createdAt: quote.created_at,
    total: Number(quote.total_amount),
    status: quote.status,
    quoteCode: quote.quote_code,
    confirmedAt: quote.confirmed_at,
    user_id: quote.user_id,
    agent_name: agentNames[quote.user_id]
  }));
};

/**
 * Hook to fetch dashboard stats with caching and real-time updates
 */
export const useDashboardStats = (isAdmin: boolean) => {
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
    queryKey: dashboardKeys.stats(userId),
    queryFn: () => fetchDashboardStats(userId, isAdmin),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes - stats should be relatively fresh
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Real-time subscription - invalidate stats when quotes or customers change
  useEffect(() => {
    if (!userId) return;

    // Use unique channel names with userId to avoid conflicts
    const quotesChannel = supabase
      .channel(`dashboard-stats-quotes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes'
        },
        (payload) => {
          console.log('[Dashboard Stats] Quotes changed, invalidating cache', payload.eventType);
          queryClient.invalidateQueries({ queryKey: dashboardKeys.stats(userId) });
          queryClient.invalidateQueries({ queryKey: dashboardKeys.recentQuotes(userId) });
        }
      )
      .subscribe();

    const customersChannel = supabase
      .channel(`dashboard-stats-customers-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers'
        },
        (payload) => {
          console.log('[Dashboard Stats] Customers changed, invalidating cache', payload.eventType);
          queryClient.invalidateQueries({ queryKey: dashboardKeys.stats(userId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(quotesChannel);
      supabase.removeChannel(customersChannel);
    };
  }, [userId, queryClient]);

  return query;
};

/**
 * Hook to fetch recent quotes for dashboard
 */
export const useRecentQuotes = (isAdmin: boolean) => {
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
    queryKey: dashboardKeys.recentQuotes(userId),
    queryFn: () => fetchRecentQuotes(userId, isAdmin),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Real-time subscription for recent quotes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`dashboard-recent-quotes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes'
        },
        (payload) => {
          console.log('[Dashboard] Recent quotes changed, invalidating cache', payload.eventType);
          queryClient.invalidateQueries({ queryKey: dashboardKeys.recentQuotes(userId) });
          queryClient.invalidateQueries({ queryKey: dashboardKeys.stats(userId) });
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
 * Hook to fetch payment emojis
 */
export const usePaymentEmojis = () => {
  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: Infinity,
  });

  const userId = userData?.id || '';

  return useQuery({
    queryKey: dashboardKeys.paymentEmojis(userId),
    queryFn: async () => {
      const { data: globalSettings } = await supabase
        .from('global_settings')
        .select('payment_emojis')
        .maybeSingle();

      return globalSettings?.payment_emojis || ["❤️","🩷","🧡","💛","🍷","🥂","🍾"];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

export interface Customer {
  id: string;
  phone: string;
  name: string;
  address: string | null;
  user_id: string;
  created_at: string;
}

export interface CustomerWithStats extends Customer {
  quoteCount: number;
  agent_name?: string;
}

// Query keys factory for customers
export const customerKeys = {
  all: (userId: string) => ['customers', userId] as const,
  lists: (userId: string) => [...customerKeys.all(userId), 'list'] as const,
  list: (userId: string, filters?: any) => [...customerKeys.lists(userId), filters] as const,
  details: (userId: string) => [...customerKeys.all(userId), 'detail'] as const,
  detail: (userId: string, id: string) => [...customerKeys.details(userId), id] as const,
};

/**
 * Fetch all customers with quote counts and agent info
 */
export const fetchCustomers = async (userId: string, isAdmin: boolean) => {
  // Build query - Admin sees all customers, agents see only their own
  let customersQuery = supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  // If not admin, filter by user_id
  if (!isAdmin) {
    customersQuery = customersQuery.eq('user_id', userId);
  }

  const { data: customersData, error: customersError } = await customersQuery;

  if (customersError) throw customersError;
  if (!customersData) return [];

  // Fetch quote counts for each customer
  const customerIds = customersData.map(c => c.id);
  const { data: quotesData, error: quotesError } = await supabase
    .from('quotes')
    .select('customer_id')
    .in('customer_id', customerIds);

  if (quotesError) throw quotesError;

  // Fetch agent names if admin
  let agentNames: Record<string, string> = {};
  if (isAdmin && customersData.length > 0) {
    const agentIds = [...new Set(customersData.map(c => c.user_id))];
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

  // Count quotes per customer
  const quoteCounts = quotesData?.reduce((acc, quote) => {
    acc[quote.customer_id] = (acc[quote.customer_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return customersData.map(customer => ({
    ...customer,
    quoteCount: quoteCounts[customer.id] || 0,
    agent_name: agentNames[customer.user_id]
  }));
};

/**
 * Hook to fetch customers with caching and real-time updates
 */
export const useCustomers = (isAdmin: boolean) => {
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
    queryKey: customerKeys.list(userId, { isAdmin }),
    queryFn: () => fetchCustomers(userId, isAdmin),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Real-time subscription for customers
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`customers-list-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers'
        },
        (payload) => {
          console.log('[Customers] Customers changed, invalidating cache', payload.eventType);
          queryClient.invalidateQueries({ queryKey: customerKeys.lists(userId) });
          // Also invalidate dashboard
          queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // Also listen to quotes changes to update quote counts
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`customers-quotes-count-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes'
        },
        (payload) => {
          console.log('[Customers] Quotes changed, updating quote counts', payload.eventType);
          // When quotes change, customer quote counts may change
          queryClient.invalidateQueries({ queryKey: customerKeys.lists(userId) });
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
 * Hook to fetch a single customer by ID or phone
 */
export const useCustomer = (customerIdOrPhone: string, isAdmin: boolean) => {
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
    queryKey: customerKeys.detail(userId, customerIdOrPhone),
    queryFn: async () => {
      // Try to fetch by ID first, then by phone
      let query = supabase
        .from('customers')
        .select('*');

      // Check if it's a UUID (id) or phone number
      if (customerIdOrPhone.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        query = query.eq('id', customerIdOrPhone);
      } else {
        query = query.eq('phone', customerIdOrPhone);
      }

      const { data, error } = await query.single();

      if (error) throw error;

      // Fetch quotes for this customer
      const { data: quotesData } = await supabase
        .from('quotes')
        .select('*')
        .eq('customer_id', data.id)
        .order('created_at', { ascending: false });

      // Fetch agent name if admin
      let agentName = undefined;
      if (isAdmin && data.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.user_id)
          .single();
        
        agentName = profile?.full_name || 'Chưa đặt tên';
      }

      return {
        ...data,
        quotes: quotesData || [],
        quoteCount: quotesData?.length || 0,
        agent_name: agentName
      };
    },
    enabled: !!userId && !!customerIdOrPhone,
    staleTime: 1000 * 60 * 5,
  });

  // Real-time updates for single customer
  useEffect(() => {
    if (!userId || !customerIdOrPhone) return;

    const channel = supabase
      .channel(`customer-${customerIdOrPhone}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
        },
        () => {
          queryClient.invalidateQueries({ 
            queryKey: customerKeys.detail(userId, customerIdOrPhone) 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, customerIdOrPhone, queryClient]);

  return query;
};

/**
 * Mutation to update customer
 */
export const useUpdateCustomer = () => {
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
      customerId, 
      updates,
      isAdmin 
    }: { 
      customerId: string;
      updates: Partial<Customer>;
      isAdmin: boolean;
    }) => {
      let updateQuery = supabase
        .from('customers')
        .update(updates)
        .eq('id', customerId);

      // If not admin, ensure only updating own customers
      if (!isAdmin) {
        updateQuery = updateQuery.eq('user_id', userId);
      }

      const { data, error } = await updateQuery.select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Đã cập nhật thông tin khách hàng');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: customerKeys.all(userId) });
      // ✅ Also invalidate quotes cache (quotes display customer name)
      queryClient.invalidateQueries({ queryKey: ['quotes', userId] });
      // ✅ Also invalidate dashboard (shows customer count & recent quotes with customer name)
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
    },
    onError: (err) => {
      toast.error('Không thể cập nhật khách hàng');
      console.error(err);
    },
  });
};

/**
 * Mutation to delete customer
 */
export const useDeleteCustomer = () => {
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
    mutationFn: async (customerId: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;
    },
    onMutate: async (customerId) => {
      await queryClient.cancelQueries({ queryKey: customerKeys.lists(userId) });

      const previousCustomers = queryClient.getQueryData(customerKeys.lists(userId));

      // Optimistically remove from cache
      queryClient.setQueryData(customerKeys.lists(userId), (old: any) => {
        if (!old) return old;
        return old.filter((customer: Customer) => customer.id !== customerId);
      });

      return { previousCustomers };
    },
    onError: (err, variables, context) => {
      if (context?.previousCustomers) {
        queryClient.setQueryData(customerKeys.lists(userId), context.previousCustomers);
      }
      toast.error('Không thể xóa khách hàng');
      console.error(err);
    },
    onSuccess: () => {
      toast.success('Đã xóa khách hàng');
      queryClient.invalidateQueries({ queryKey: customerKeys.all(userId) });
      // ✅ Also invalidate quotes cache (related quotes might be deleted)
      queryClient.invalidateQueries({ queryKey: ['quotes', userId] });
      // ✅ Also invalidate dashboard
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
    },
  });
};

/**
 * Mutation to assign customer to agent (admin only)
 */
export const useAssignCustomer = () => {
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
      customerId, 
      agentId 
    }: { 
      customerId: string;
      agentId: string;
    }) => {
      const { data, error } = await supabase
        .from('customers')
        .update({ user_id: agentId })
        .eq('id', customerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Đã chỉ định cộng tác viên');
      queryClient.invalidateQueries({ queryKey: customerKeys.all(userId) });
    },
    onError: (err) => {
      toast.error('Không thể chỉ định cộng tác viên');
      console.error(err);
    },
  });
};

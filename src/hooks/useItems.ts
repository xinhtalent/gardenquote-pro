import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

export interface Item {
  id: string;
  name: string;
  unit: string;
  price: number;
  image: string;
  category: string;
  mode?: 'standard' | 'auto_quantity' | 'customizable';
  pot_type?: string | null;
  created_at?: string;
  user_id?: string;  // ✅ For permission checks
}

// Query keys factory for items
export const itemKeys = {
  all: (userId: string) => ['items', userId] as const,
  lists: (userId: string) => [...itemKeys.all(userId), 'list'] as const,
  list: (userId: string, filters?: any) => [...itemKeys.lists(userId), filters] as const,
  details: (userId: string) => [...itemKeys.all(userId), 'detail'] as const,
  detail: (userId: string, id: string) => [...itemKeys.details(userId), id] as const,
};

// Query keys for categories and units
export const categoryKeys = {
  all: (userId: string) => ['categories', userId] as const,
};

export const unitKeys = {
  all: (userId: string) => ['units', userId] as const,
};

export const librarySettingsKeys = {
  all: (userId: string) => ['library-settings', userId] as const,
};

/**
 * Fetch all items
 * Note: Returns all items visible to current user based on RLS policies
 * - Admins see all items
 * - Regular users see only their own items
 */
export const fetchItems = async () => {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('[fetchItems] Error:', error);
    throw error;
  }
  
  // Transform database fields to match Item interface
  return (data || []).map(item => ({
    id: item.id,
    name: item.name,
    unit: item.unit,
    price: Number(item.price),
    image: item.image_url || '/placeholder.svg',
    category: item.category,
    mode: item.mode as 'standard' | 'auto_quantity' | 'customizable' || 'standard',
    pot_type: item.pot_type || null,
    created_at: item.created_at,
    user_id: item.user_id  // ✅ Include user_id for permission checks
  }));
};

/**
 * Hook to fetch items with caching and real-time updates
 */
export const useItems = () => {
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
    queryKey: itemKeys.list(userId),
    queryFn: fetchItems,
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes - items change less frequently
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  // Real-time subscription for items
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`items-list-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items'
        },
        (payload) => {
          console.log('[Items] Items changed, invalidating cache', payload.eventType);
          queryClient.invalidateQueries({ queryKey: itemKeys.lists(userId) });
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
 * Hook to fetch categories
 */
export const useCategories = () => {
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
    queryKey: categoryKeys.all(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data?.map(c => c.name) || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 30, // 30 minutes - categories rarely change
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  });

  // Real-time subscription for categories
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: categoryKeys.all(userId) });
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
 * Hook to fetch units
 */
export const useUnits = () => {
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
    queryKey: unitKeys.all(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('name')
        .order('name', { ascending: true });

      if (error) throw error;
      return data?.map(u => u.name) || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  });

  // Real-time subscription for units
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('units-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'units'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: unitKeys.all(userId) });
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
 * Hook to fetch library settings
 */
export const useLibrarySettings = () => {
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
    queryKey: librarySettingsKeys.all(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_settings')
        .select('library_title, library_description')
        .single();

      if (error) throw error;
      
      return {
        library_title: data?.library_title || 'Thư viện Hạng mục',
        library_description: data?.library_description || 'Quản lý các hạng mục sản phẩm và dịch vụ'
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 30,
  });
};

/**
 * Mutation to create item
 */
export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Omit<Item, 'id' | 'created_at'>) => {
      // Get current user to set user_id (required for RLS)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Transform Item interface to database fields
      const dbItem = {
        name: newItem.name,
        unit: newItem.unit,
        price: newItem.price,
        image_url: newItem.image === '/placeholder.svg' ? null : newItem.image,
        category: newItem.category,
        mode: newItem.mode || 'standard',
        pot_type: newItem.pot_type || null,
        user_id: user.id  // ✅ Required for RLS policies
      };

      const { data, error } = await supabase
        .from('items')
        .insert([dbItem])
        .select()
        .single();

      if (error) {
        console.error('[useCreateItem] Insert error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: async () => {
      toast.success('Đã thêm hạng mục mới');
      // Get userId at mutation time, not at hook creation
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        queryClient.invalidateQueries({ queryKey: itemKeys.all(user.id) });
      }
    },
    onError: (err) => {
      toast.error('Không thể thêm hạng mục');
      console.error(err);
    },
  });
};

/**
 * Mutation to update item
 */
export const useUpdateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      itemId, 
      updates 
    }: { 
      itemId: string;
      updates: Partial<Item>;
    }) => {
      // Transform Item interface to database fields
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.image !== undefined) {
        dbUpdates.image_url = updates.image === '/placeholder.svg' ? null : updates.image;
      }
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.mode !== undefined) dbUpdates.mode = updates.mode;
      if (updates.pot_type !== undefined) dbUpdates.pot_type = updates.pot_type;

      const { data, error } = await supabase
        .from('items')
        .update(dbUpdates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ itemId, updates }) => {
      // Get userId at mutation time
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await queryClient.cancelQueries({ queryKey: itemKeys.lists(user.id) });

      const previousItems = queryClient.getQueryData(itemKeys.lists(user.id));

      // Optimistically update
      queryClient.setQueryData(itemKeys.lists(user.id), (old: any) => {
        if (!old) return old;
        return old.map((item: Item) =>
          item.id === itemId ? { ...item, ...updates } : item
        );
      });

      return { previousItems, userId: user.id };
    },
    onError: (err, variables, context) => {
      if (context?.previousItems && context?.userId) {
        queryClient.setQueryData(itemKeys.lists(context.userId), context.previousItems);
      }
      toast.error('Không thể cập nhật hạng mục');
      console.error(err);
    },
    onSuccess: async () => {
      toast.success('Đã cập nhật hạng mục');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        queryClient.invalidateQueries({ queryKey: itemKeys.all(user.id) });
      }
    },
  });
};

/**
 * Mutation to delete item
 */
export const useDeleteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      console.log('[useDeleteItem] Attempting to delete item:', itemId);
      
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('[useDeleteItem] Database error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('[useDeleteItem] Successfully deleted item:', itemId);
    },
    onMutate: async (itemId) => {
      // Get userId at mutation time
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await queryClient.cancelQueries({ queryKey: itemKeys.lists(user.id) });

      const previousItems = queryClient.getQueryData(itemKeys.lists(user.id));

      // Optimistically remove from cache
      queryClient.setQueryData(itemKeys.lists(user.id), (old: any) => {
        if (!old) return old;
        return old.filter((item: Item) => item.id !== itemId);
      });

      return { previousItems, userId: user.id };
    },
    onError: (err: any, variables, context) => {
      console.error('[useDeleteItem] Mutation error:', err);
      
      if (context?.previousItems && context?.userId) {
        queryClient.setQueryData(itemKeys.lists(context.userId), context.previousItems);
      }
      
      // Better error messages based on error type
      if (err?.code === '23503' || err?.message?.includes('foreign key')) {
        toast.error('Không thể xóa hạng mục đang được sử dụng trong báo giá');
      } else if (err?.code === '42501' || err?.message?.includes('permission denied')) {
        toast.error('Bạn không có quyền xóa hạng mục này');
      } else if (err?.code === 'PGRST116' || err?.message?.includes('not found')) {
        toast.error('Không tìm thấy hạng mục');
      } else if (err?.message?.includes('RLS')) {
        toast.error('Chỉ admin hoặc người tạo mới có thể xóa hạng mục này');
      } else {
        toast.error(err?.message || 'Không thể xóa hạng mục');
      }
    },
    onSuccess: async (data, variables) => {
      console.log('[useDeleteItem] Success, deleted item:', variables);
      toast.success('Đã xóa hạng mục');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        queryClient.invalidateQueries({ queryKey: itemKeys.all(user.id) });
      }
    },
  });
};

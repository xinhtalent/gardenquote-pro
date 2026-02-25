import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

// Interfaces
export interface GlobalSettings {
  id: string;
  app_name: string;
  company_name: string;
  company_tagline: string | null;
  company_contact: string | null;
  company_address: string | null;
  company_tax_code: string | null;
  company_email: string | null;
  company_website: string | null;
  company_logo_url: string | null;
  quote_code_format: string;
  quote_notes: string | null;
  payment_emojis: string[];
  created_at?: string;
  updated_at?: string;
}

export interface PersonalSettings {
  id: string;
  user_id: string;
  creator_name: string;
  creator_position: string | null;
  creator_phone: string;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  vietqr_bank_id: string | null;
  vietqr_account_number: string | null;
  vietqr_account_name: string | null;
  created_at?: string;
  updated_at?: string;
}

// Query keys
export const settingsKeys = {
  all: ['settings'] as const,
  global: () => [...settingsKeys.all, 'global'] as const,
  personal: (userId: string) => [...settingsKeys.all, 'personal', userId] as const,
};

/**
 * Fetch global settings (visible to all users)
 */
export const fetchGlobalSettings = async (): Promise<GlobalSettings | null> => {
  const { data, error } = await supabase
    .from('global_settings')
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('[fetchGlobalSettings] Error:', error);
    throw error;
  }

  return data;
};

/**
 * Hook to fetch global settings with caching and real-time updates
 */
export const useGlobalSettings = () => {
  const queryClient = useQueryClient();

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('global-settings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'global_settings' },
        (payload) => {
          console.log('[Global Settings] Settings changed, invalidating cache', payload.eventType);
          queryClient.invalidateQueries({ queryKey: settingsKeys.global() });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: settingsKeys.global(),
    queryFn: fetchGlobalSettings,
    staleTime: 1000 * 60 * 10, // 10 minutes (settings don't change often)
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Fetch personal settings for a user
 */
export const fetchPersonalSettings = async (userId: string): Promise<PersonalSettings | null> => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[fetchPersonalSettings] Error:', error);
    throw error;
  }

  // If no settings exist, try to auto-fill from profile
  if (!data) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', userId)
      .single();

    if (profileData) {
      // Return default settings with profile data
      return {
        id: '', // Will be created on first save
        user_id: userId,
        creator_name: profileData.full_name || '',
        creator_position: null,
        creator_phone: profileData.phone || '',
        bank_name: null,
        bank_account_number: null,
        bank_account_name: null,
        vietqr_bank_id: null,
        vietqr_account_number: null,
        vietqr_account_name: null,
      };
    }
  }

  return data;
};

/**
 * Hook to fetch personal settings with caching and real-time updates
 */
export const usePersonalSettings = () => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = React.useState<string>('');

  // Get current user
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // Subscribe to real-time updates (only for current user)
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`personal-settings-realtime-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settings',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Personal Settings] Settings changed, invalidating cache', payload.eventType);
          queryClient.invalidateQueries({ queryKey: settingsKeys.personal(userId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return useQuery({
    queryKey: settingsKeys.personal(userId),
    queryFn: () => fetchPersonalSettings(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30,
  });
};

/**
 * Mutation to update global settings (admin only)
 */
export const useUpdateGlobalSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<GlobalSettings> & { id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { id, ...settingsData } = settings;

      if (id) {
        // Update existing
        const { data, error } = await supabase
          .from('global_settings')
          .update(settingsData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('[useUpdateGlobalSettings] Update error:', error);
          throw error;
        }
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('global_settings')
          .insert([settingsData])
          .select()
          .single();

        if (error) {
          console.error('[useUpdateGlobalSettings] Insert error:', error);
          throw error;
        }
        return data;
      }
    },
    onSuccess: () => {
      // ✅ Don't show toast here - let caller handle it to avoid duplicates
      queryClient.invalidateQueries({ queryKey: settingsKeys.global() });
    },
    onError: (error: any) => {
      console.error('[useUpdateGlobalSettings] Error:', error);
      toast.error('Không thể lưu cài đặt toàn hệ thống');
    },
  });
};

/**
 * Mutation to update personal settings
 */
export const useUpdatePersonalSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<PersonalSettings> & { id?: string; user_id: string }) => {
      const { id, ...settingsData } = settings;

      if (id && id !== '') {
        // Update existing
        const { data, error } = await supabase
          .from('settings')
          .update(settingsData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('[useUpdatePersonalSettings] Update error:', error);
          throw error;
        }
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('settings')
          .insert([settingsData])
          .select()
          .single();

        if (error) {
          console.error('[useUpdatePersonalSettings] Insert error:', error);
          throw error;
        }
        return data;
      }
    },
    onSuccess: (data) => {
      // ✅ Don't show toast here - let caller handle it to avoid duplicates
      queryClient.invalidateQueries({ queryKey: settingsKeys.personal(data.user_id) });
    },
    onError: (error: any) => {
      console.error('[useUpdatePersonalSettings] Error:', error);
      toast.error('Không thể lưu cài đặt cá nhân');
    },
  });
};

// Fix missing React import
import * as React from 'react';

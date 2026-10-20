import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/features/auth/auth-context'
import { capabilitiesFor } from '@/lib/permissions'
import type { AccountStatus, AppRole, ProfileRow } from '@/types/database'

/** The signed-in user's profile row. */
export function useProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

/** The signed-in user's roles (authorization data — read-only here). */
export function useMyRoles() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['roles', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<AppRole[]> => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
      if (error) throw error
      return (data ?? []).map((r) => r.role)
    },
  })
}

/** Account status — drives the suspended/deactivated gate. */
export function useAccountStatus() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['account-status', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<AccountStatus> => {
      const { data, error } = await supabase
        .from('account_statuses')
        .select('status')
        .eq('user_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data?.status ?? 'active'
    },
  })
}

/** Profile + roles + capabilities in one call for layout/routing decisions. */
export function useSessionContext() {
  const profile = useProfile()
  const roles = useMyRoles()
  const account = useAccountStatus()

  const roleList = roles.data ?? []
  const capabilities = capabilitiesFor(roleList)

  return {
    profile: profile.data ?? null,
    roles: roleList,
    status: account.data ?? 'active',
    capabilities,
    isLoading: profile.isLoading || roles.isLoading || account.isLoading,
    isError: profile.isError || roles.isError || account.isError,
    refetch: () => {
      void profile.refetch()
      void roles.refetch()
      void account.refetch()
    },
  }
}

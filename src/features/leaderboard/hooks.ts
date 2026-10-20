import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { RewardRow } from '@/types/database'

export interface LeaderboardEntry extends RewardRow {
  profile: {
    id: string
    full_name: string
    avatar_url: string | null
    college: string | null
  } | null
}

/**
 * Rankings are read from `rewards`, which is only ever mutated by the
 * protected `award_activity_points` function — so scores cannot be forged.
 */
export function useLeaderboard(limit = 50) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data, error } = await supabase
        .from('rewards')
        .select(
          'user_id, points, level, badges, updated_at, profile:profiles!rewards_user_id_fkey(id, full_name, avatar_url, college)',
        )
        .order('points', { ascending: false })
        .limit(limit)
        .returns<LeaderboardEntry[]>()
      if (error) throw error
      return data ?? []
    },
  })
}

export function useMyRewards() {
  return useQuery({
    queryKey: ['my-rewards'],
    queryFn: async (): Promise<RewardRow | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return null
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useMyPointHistory(limit = 20) {
  return useQuery({
    queryKey: ['point-history', limit],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return []
      const { data, error } = await supabase
        .from('reward_transactions')
        .select('id, points, reason, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data ?? []
    },
  })
}

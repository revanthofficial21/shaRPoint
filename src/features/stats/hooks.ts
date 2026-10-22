import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface PublicStats {
  students: number
  teachers: number
  courses: number
  resources: number
  opportunities: number
}

/**
 * Real aggregate counts for the marketing strip.
 *
 * Deliberately fails soft: `retry: false` and the caller hides the whole strip
 * when this errors. A database that has not run 0008_public_stats.sql should
 * leave the landing page looking finished, not broken.
 */
export function usePublicStats() {
  return useQuery({
    queryKey: ['public-stats'],
    retry: false,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PublicStats> => {
      const { data, error } = await supabase.rpc('public_platform_stats')
      if (error) {
        /*
         * Surface the real reason. When this call fails the landing page simply
         * omits its figures — the strip looks intentional rather than broken — so
         * without this line there is nothing at all to go on when the counts do
         * not appear. The usual cause is that 0008_public_stats.sql has not been
         * applied to this project, or the project is paused.
         */
        console.error('[sharpoint] public_platform_stats failed:', error.message)
        throw error
      }
      return data as PublicStats
    },
  })
}

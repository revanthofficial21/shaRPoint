import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/features/auth/auth-context'
import type { ApplicationStatus, OpportunityRow } from '@/types/database'

export interface OpportunityWithMeta extends OpportunityRow {
  poster: { id: string; full_name: string } | null
}

export interface OpportunityFilters {
  category?: OpportunityRow['category'] | 'all'
  search?: string
}

export function useOpportunities(filters: OpportunityFilters = {}) {
  const { category, search } = filters
  return useQuery({
    queryKey: ['opportunities', category ?? 'all', search ?? ''],
    queryFn: async (): Promise<OpportunityWithMeta[]> => {
      let query = supabase
        .from('opportunities')
        .select('*, poster:profiles!opportunities_posted_by_fkey(id, full_name)')
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(60)

      if (category && category !== 'all') query = query.eq('category', category)
      if (search?.trim()) {
        const term = search.trim()
        query = query.or(`title.ilike.%${term}%,company.ilike.%${term}%`)
      }

      const { data, error } = await query.returns<OpportunityWithMeta[]>()
      if (error) throw error
      return data ?? []
    },
  })
}

export function useMyOpportunityBookmarks() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['opportunity-bookmarks', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('opportunity_bookmarks')
        .select('opportunity_id')
        .eq('user_id', user!.id)
      if (error) throw error
      return (data ?? []).map((r) => r.opportunity_id)
    },
  })
}

export function useToggleOpportunityBookmark() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      opportunityId,
      bookmarked,
    }: {
      opportunityId: string
      bookmarked: boolean
    }) => {
      if (bookmarked) {
        const { error } = await supabase
          .from('opportunity_bookmarks')
          .delete()
          .eq('opportunity_id', opportunityId)
          .eq('user_id', user!.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('opportunity_bookmarks')
          .insert({ opportunity_id: opportunityId, user_id: user!.id })
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['opportunity-bookmarks'] }),
  })
}

/** The caller's own application records, keyed by opportunity id. */
export function useMyApplications() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my-applications', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Record<string, ApplicationStatus>> => {
      const { data, error } = await supabase
        .from('opportunity_applications')
        .select('opportunity_id, status')
        .eq('user_id', user!.id)
      if (error) throw error
      return Object.fromEntries((data ?? []).map((r) => [r.opportunity_id, r.status]))
    },
  })
}

export function useSetApplicationStatus() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      opportunityId,
      status,
    }: {
      opportunityId: string
      status: ApplicationStatus
    }) => {
      const { error } = await supabase
        .from('opportunity_applications')
        .upsert(
          { opportunity_id: opportunityId, user_id: user!.id, status },
          { onConflict: 'opportunity_id,user_id' },
        )
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-applications'] }),
  })
}

export function useCreateOpportunity() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      title: string
      company: string
      description: string
      category: OpportunityRow['category']
      location: string
      deadline: string | null
      applyUrl: string | null
    }) => {
      const { error } = await supabase.from('opportunities').insert({
        posted_by: user!.id,
        title: input.title,
        company: input.company,
        description: input.description,
        category: input.category,
        location: input.location,
        deadline: input.deadline,
        apply_url: input.applyUrl,
      })
      if (error) throw error
      await supabase.rpc('award_activity_points', { p_activity: 'opportunity_posted' })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['opportunities'] }),
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/features/auth/auth-context'
import type { StudyGroupRow } from '@/types/database'

export interface StudyGroupWithMeta extends StudyGroupRow {
  creator: { id: string; full_name: string } | null
  study_group_members: { count: number }[]
}

const GROUP_SELECT = `
  *,
  creator:profiles!study_groups_created_by_fkey(id, full_name),
  study_group_members(count)
`

export function useStudyGroups(search?: string) {
  return useQuery({
    queryKey: ['study-groups', search ?? ''],
    queryFn: async (): Promise<StudyGroupWithMeta[]> => {
      let query = supabase
        .from('study_groups')
        .select(GROUP_SELECT)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(60)

      if (search?.trim()) {
        query = query.or(`name.ilike.%${search.trim()}%,subject.ilike.%${search.trim()}%`)
      }

      const { data, error } = await query.returns<StudyGroupWithMeta[]>()
      if (error) throw error
      return data ?? []
    },
  })
}

export function useMyGroups() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my-groups', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('study_group_members')
        .select('group_id')
        .eq('user_id', user!.id)
      if (error) throw error
      return (data ?? []).map((r) => r.group_id)
    },
  })
}

export function useCreateGroup() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      name: string
      description: string
      subject: string
      capacity: number
    }) => {
      const { data, error } = await supabase
        .from('study_groups')
        .insert({
          name: input.name,
          description: input.description,
          subject: input.subject,
          capacity: input.capacity,
          created_by: user!.id,
        })
        .select('id')
        .single()
      if (error) throw error

      const { error: memberError } = await supabase
        .from('study_group_members')
        .insert({ group_id: data.id, user_id: user!.id, role: 'owner' })
      if (memberError) throw memberError
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['study-groups'] }),
        queryClient.invalidateQueries({ queryKey: ['my-groups'] }),
      ])
    },
  })
}

export function useJoinGroup() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('study_group_members')
        .insert({ group_id: groupId, user_id: user!.id })
      if (error) throw error
      await supabase.rpc('award_activity_points', { p_activity: 'group_joined' })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['study-groups'] }),
        queryClient.invalidateQueries({ queryKey: ['my-groups'] }),
      ])
    },
  })
}

export function useLeaveGroup() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('study_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['study-groups'] }),
        queryClient.invalidateQueries({ queryKey: ['my-groups'] }),
      ])
    },
  })
}

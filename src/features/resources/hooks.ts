import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/features/auth/auth-context'
import type { ResourceRow, ResourceVisibility } from '@/types/database'

export interface ResourceWithMeta extends ResourceRow {
  owner: { id: string; full_name: string; avatar_url: string | null } | null
  course: { id: string; title: string } | null
}

const RESOURCE_SELECT = `
  *,
  owner:profiles!resources_owner_id_fkey(id, full_name, avatar_url),
  course:courses!resources_course_id_fkey(id, title)
`

export interface ResourceFilters {
  courseId?: string
  type?: ResourceRow['resource_type'] | 'all'
  search?: string
}

export function useResources(filters: ResourceFilters = {}) {
  const { courseId, type, search } = filters
  return useQuery({
    queryKey: ['resources', courseId ?? 'all', type ?? 'all', search ?? ''],
    queryFn: async (): Promise<ResourceWithMeta[]> => {
      let query = supabase
        .from('resources')
        .select(RESOURCE_SELECT)
        .order('created_at', { ascending: false })
        .limit(60)

      if (courseId) query = query.eq('course_id', courseId)
      if (type && type !== 'all') query = query.eq('resource_type', type)
      if (search?.trim()) query = query.ilike('title', `%${search.trim()}%`)

      const { data, error } = await query.returns<ResourceWithMeta[]>()
      if (error) throw error
      return data ?? []
    },
  })
}

export function useMyResourceBookmarks() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['resource-bookmarks', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('resource_bookmarks')
        .select('resource_id')
        .eq('user_id', user!.id)
      if (error) throw error
      return (data ?? []).map((r) => r.resource_id)
    },
  })
}

export function useToggleResourceBookmark() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ resourceId, bookmarked }: { resourceId: string; bookmarked: boolean }) => {
      if (bookmarked) {
        const { error } = await supabase
          .from('resource_bookmarks')
          .delete()
          .eq('resource_id', resourceId)
          .eq('user_id', user!.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('resource_bookmarks')
          .insert({ resource_id: resourceId, user_id: user!.id })
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resource-bookmarks'] }),
  })
}

export interface CreateResourceInput {
  title: string
  description: string
  resourceType: ResourceRow['resource_type']
  visibility: ResourceVisibility
  courseId: string | null
  externalUrl: string | null
  storagePath: string | null
  fileSize: number | null
  mimeType: string | null
}

export function useCreateResource() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateResourceInput) => {
      const { error } = await supabase.from('resources').insert({
        owner_id: user!.id,
        title: input.title,
        description: input.description,
        resource_type: input.resourceType,
        visibility: input.visibility,
        course_id: input.courseId,
        external_url: input.externalUrl,
        storage_path: input.storagePath,
        file_size: input.fileSize,
        mime_type: input.mimeType,
      })
      if (error) throw error
      await supabase.rpc('award_activity_points', { p_activity: 'resource_uploaded' })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resources'] }),
  })
}

/** Counts a download through the protected database function. */
export function useCountDownload() {
  return useMutation({
    mutationFn: async (resourceId: string) => {
      const { error } = await supabase.rpc('increment_resource_downloads', {
        p_resource: resourceId,
      })
      if (error) throw error
    },
  })
}

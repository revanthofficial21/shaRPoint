/**
 * Typed database model.
 *
 * Hand-maintained to match supabase/migrations. Regenerate with
 * `supabase gen types typescript --project-id <ref>` once the Supabase CLI is
 * linked, if you prefer generated types.
 */

export type AppRole = 'student' | 'teacher' | 'admin' | 'owner'
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'deactivated'
export type AssignmentStatus = 'draft' | 'published' | 'closed' | 'archived'
export type SubmissionStatus = 'submitted' | 'graded' | 'returned' | 'late'
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed'
export type ResourceVisibility = 'public' | 'course' | 'private'

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type ProfileRow = {
  id: string
  full_name: string
  username: string | null
  email: string
  avatar_url: string | null
  bio: string | null
  department_id: string | null
  course: string | null
  year: string | null
  designation: string | null
  skills: string[]
  interests: string[]
  github_url: string | null
  portfolio_url: string | null
  is_public: boolean
  onboarded_at: string | null
  created_at: string
  updated_at: string
}

export type UserRoleRow = {
  id: string
  user_id: string
  role: AppRole
  granted_by: string | null
  created_at: string
}

export type AccountStatusRow = {
  user_id: string
  status: AccountStatus
  reason: string | null
  changed_by: string | null
  created_at: string
  updated_at: string
}

export type DepartmentRow = {
  id: string
  name: string
  code: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export type CourseRow = {
  id: string
  department_id: string | null
  title: string
  code: string | null
  description: string | null
  objectives: string[]
  academic_year: string | null
  is_archived: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type CourseTeacherRow = {
  id: string
  course_id: string
  teacher_id: string
  created_at: string
}

export type CourseEnrollmentRow = {
  id: string
  course_id: string
  student_id: string
  enrolled_at: string
}

export type PostRow = {
  id: string
  author_id: string
  content: string
  tags: string[]
  image_url: string | null
  is_hidden: boolean
  created_at: string
  updated_at: string
}

export type PostCommentRow = {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
}

export type PostLikeRow = {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export type UserConnectionRow = {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'declined' | 'blocked'
  created_at: string
  updated_at: string
}

export type StudyGroupRow = {
  id: string
  name: string
  description: string | null
  subject: string | null
  capacity: number
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export type StudyGroupMemberRow = {
  id: string
  group_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
}

export type ResourceRow = {
  id: string
  owner_id: string
  course_id: string | null
  title: string
  description: string | null
  resource_type: 'document' | 'notes' | 'guide' | 'link' | 'video' | 'other'
  visibility: ResourceVisibility
  external_url: string | null
  storage_path: string | null
  file_size: number | null
  mime_type: string | null
  tags: string[]
  downloads: number
  created_at: string
  updated_at: string
}

export type AssignmentRow = {
  id: string
  course_id: string
  created_by: string
  title: string
  instructions: string | null
  status: AssignmentStatus
  max_score: number
  due_at: string | null
  allowed_types: string[]
  created_at: string
  updated_at: string
}

export type SubmissionRow = {
  id: string
  assignment_id: string
  student_id: string
  content: string | null
  storage_path: string | null
  status: SubmissionStatus
  score: number | null
  feedback: string | null
  graded_by: string | null
  graded_at: string | null
  results_released: boolean
  submitted_at: string
  updated_at: string
}

export type AnnouncementRow = {
  id: string
  course_id: string | null
  author_id: string
  title: string
  body: string
  publish_at: string
  is_archived: boolean
  created_at: string
  updated_at: string
}

export type OpportunityRow = {
  id: string
  posted_by: string
  title: string
  company: string
  description: string | null
  category: 'internship' | 'job' | 'hackathon' | 'competition' | 'event' | 'research' | 'scholarship'
  location: string | null
  stipend: string | null
  deadline: string | null
  apply_url: string | null
  tags: string[]
  is_featured: boolean
  is_published: boolean
  created_at: string
  updated_at: string
}

export type OpportunityBookmarkRow = {
  id: string
  opportunity_id: string
  user_id: string
  created_at: string
}

export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'offered'
  | 'rejected'
  | 'withdrawn'

export type OpportunityApplicationRow = {
  id: string
  opportunity_id: string
  user_id: string
  status: ApplicationStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export type ResourceBookmarkRow = {
  id: string
  resource_id: string
  user_id: string
  created_at: string
}

export type ConversationRow = {
  id: string
  created_by: string
  last_message_at: string
  created_at: string
}

export type ConversationMemberRow = {
  id: string
  conversation_id: string
  user_id: string
  last_read_at: string
  joined_at: string
}

export type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  attachment_path: string | null
  created_at: string
}

export type NotificationRow = {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export type RewardRow = {
  user_id: string
  points: number
  level: number
  badges: string[]
  updated_at: string
}

export type RewardTransactionRow = {
  id: string
  user_id: string
  points: number
  reason: string
  ref_table: string | null
  ref_id: string | null
  created_at: string
}

export type ReportRow = {
  id: string
  reporter_id: string
  target_table: string
  target_id: string
  reason: string
  details: string | null
  status: ReportStatus
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

export type ModerationActionRow = {
  id: string
  actor_id: string | null
  target_table: string
  target_id: string | null
  action: string
  reason: string | null
  created_at: string
}

export type PlatformSettingRow = {
  key: string
  value: unknown
  updated_by: string | null
  updated_at: string
}

export type AuditLogRow = {
  id: string
  actor_id: string | null
  actor_email: string | null
  action: string
  target_table: string | null
  target_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: Table<ProfileRow, Partial<ProfileRow> & { id: string; email: string }>
      user_roles: Table<UserRoleRow, { user_id: string; role: AppRole; granted_by?: string | null }>
      account_statuses: Table<
        AccountStatusRow,
        {
          user_id: string
          status?: AccountStatus
          reason?: string | null
          changed_by?: string | null
        }
      >
      departments: Table<
        DepartmentRow,
        { name: string; code?: string | null; description?: string }
      >
      courses: Table<CourseRow, { title: string } & Partial<CourseRow>>
      course_teachers: Table<CourseTeacherRow, { course_id: string; teacher_id: string }>
      course_enrollments: Table<CourseEnrollmentRow, { course_id: string; student_id: string }>
      posts: Table<PostRow, { author_id: string; content: string } & Partial<PostRow>>
      post_comments: Table<PostCommentRow, { post_id: string; author_id: string; content: string }>
      post_likes: Table<PostLikeRow, { post_id: string; user_id: string }>
      user_connections: Table<UserConnectionRow>
      study_groups: Table<StudyGroupRow, { name: string; created_by: string } & Partial<StudyGroupRow>>
      study_group_members: Table<
        StudyGroupMemberRow,
        { group_id: string; user_id: string; role?: 'owner' | 'member' }
      >
      resources: Table<ResourceRow, { owner_id: string; title: string } & Partial<ResourceRow>>
      assignments: Table<AssignmentRow, { course_id: string; created_by: string; title: string } & Partial<AssignmentRow>>
      assignment_submissions: Table<SubmissionRow, { assignment_id: string; student_id: string } & Partial<SubmissionRow>>
      announcements: Table<AnnouncementRow, { author_id: string; title: string } & Partial<AnnouncementRow>>
      opportunities: Table<OpportunityRow, { posted_by: string; title: string } & Partial<OpportunityRow>>
      opportunity_bookmarks: Table<OpportunityBookmarkRow, { opportunity_id: string; user_id: string }>
      opportunity_applications: Table<
        OpportunityApplicationRow,
        { opportunity_id: string; user_id: string; status?: ApplicationStatus }
      >
      resource_bookmarks: Table<ResourceBookmarkRow, { resource_id: string; user_id: string }>
      conversations: Table<ConversationRow, { created_by: string }>
      conversation_members: Table<ConversationMemberRow, { conversation_id: string; user_id: string }>
      messages: Table<MessageRow, { conversation_id: string; sender_id: string; body: string }>
      notifications: Table<NotificationRow, { user_id: string; title: string } & Partial<NotificationRow>>
      rewards: Table<RewardRow>
      reward_transactions: Table<RewardTransactionRow, { user_id: string; points: number; reason: string }>
      reports: Table<
        ReportRow,
        {
          reporter_id: string
          target_table: string
          target_id: string
          reason: string
          details?: string
          status?: ReportStatus
          resolved_by?: string | null
          resolved_at?: string | null
        }
      >
      moderation_actions: Table<
        ModerationActionRow,
        {
          actor_id?: string | null
          target_table: string
          target_id?: string | null
          action: string
          reason?: string | null
        }
      >
      platform_settings: Table<
        PlatformSettingRow,
        { key: string; value: unknown; updated_by?: string | null }
      >
      audit_logs: Table<AuditLogRow, { action: string }>
    }
    Views: Record<string, never>
    Functions: {
      has_role: { Args: { p_user: string; p_role: AppRole }; Returns: boolean }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      is_owner: { Args: Record<string, never>; Returns: boolean }
      is_active_user: { Args: Record<string, never>; Returns: boolean }
      award_activity_points: {
        Args: { p_activity: string; p_ref_table?: string | null; p_ref_id?: string | null }
        Returns: undefined
      }
      increment_resource_downloads: { Args: { p_resource: string }; Returns: undefined }
      my_conversations: {
        Args: Record<string, never>
        Returns: {
          conversation_id: string
          last_message_at: string
          last_read_at: string
          other_user_id: string | null
          other_name: string | null
          other_avatar: string | null
          last_body: string | null
          last_sender: string | null
          unread: number
        }[]
      }
      unread_message_count: { Args: Record<string, never>; Returns: number }
      start_direct_conversation: { Args: { p_other: string }; Returns: string }
      mark_conversation_read: { Args: { p_conversation: string }; Returns: undefined }
      mark_all_notifications_read: { Args: Record<string, never>; Returns: undefined }
      consume_ai_quota: {
        Args: { p_limit?: number }
        Returns: { allowed: boolean; used: number; limit_value: number }[]
      }
      admin_platform_stats: {
        Args: Record<string, never>
        Returns: {
          users?: number
          students?: number
          teachers?: number
          admins?: number
          suspended?: number
          courses?: number
          assignments?: number
          submissions?: number
          posts?: number
          resources?: number
          groups?: number
          opportunities?: number
          open_reports?: number
          registrations?: { day: string; count: number }[]
        }
      }
      admin_user_directory: {
        Args: Record<string, never>
        Returns: {
          id: string
          full_name: string
          email: string
          avatar_url: string | null
          status: AccountStatus
          roles: AppRole[]
          created_at: string
        }[]
      }
      teacher_course_stats: {
        Args: Record<string, never>
        Returns: {
          course_id: string
          course_title: string
          course_code: string | null
          enrolled: number
          assignment_count: number
          submission_count: number
          pending_grading: number
          average_score: number | null
        }[]
      }
    }
    Enums: {
      app_role: AppRole
      account_status: AccountStatus
      assignment_status: AssignmentStatus
      submission_status: SubmissionStatus
      report_status: ReportStatus
      resource_visibility: ResourceVisibility
    }
    CompositeTypes: Record<string, never>
  }
}

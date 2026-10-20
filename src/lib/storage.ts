import { supabase } from '@/integrations/supabase/client'

export const UPLOAD_RULES = {
  maxBytes: 20 * 1024 * 1024,
  maxLabel: '20 MB',
  allowedExtensions: [
    'pdf',
    'doc',
    'docx',
    'ppt',
    'pptx',
    'txt',
    'md',
    'png',
    'jpg',
    'jpeg',
    'webp',
  ],
  imageExtensions: ['png', 'jpg', 'jpeg', 'webp'],
} as const

export interface UploadResult {
  path: string
  publicUrl: string | null
}

/**
 * Lowercased extension, or '' when there isn't one.
 *
 * Deliberately not `split('.').pop()`: for a name with no dot that returns the
 * whole filename, so "README" would report an extension of "readme" and the
 * no-extension branch in validateFile would never run. A leading-dot name like
 * ".env" is treated as having no extension too.
 */
export function extensionOf(fileName: string) {
  const index = fileName.lastIndexOf('.')
  if (index <= 0) return ''
  return fileName.slice(index + 1).toLowerCase()
}

/** Validates size and extension before any bytes leave the browser. */
export function validateFile(file: File, opts?: { imagesOnly?: boolean }): string | null {
  const ext = extensionOf(file.name)
  if (!ext) return 'That file has no extension.'

  if (opts?.imagesOnly) {
    if (
      !UPLOAD_RULES.imageExtensions.includes(ext as (typeof UPLOAD_RULES.imageExtensions)[number])
    ) {
      return 'Please choose a PNG, JPG or WebP image.'
    }
  } else if (
    !UPLOAD_RULES.allowedExtensions.includes(ext as (typeof UPLOAD_RULES.allowedExtensions)[number])
  ) {
    return `Allowed types: ${UPLOAD_RULES.allowedExtensions.join(', ')}.`
  }

  if (file.size > UPLOAD_RULES.maxBytes) {
    return `Files must be under ${UPLOAD_RULES.maxLabel}.`
  }
  return null
}

/**
 * Uploads into `<userId>/…` inside a bucket.
 *
 * The path prefix matters: storage RLS requires the first folder to equal
 * `auth.uid()`, so a user can never write into another user's namespace.
 */
export async function uploadFile(
  bucket: string,
  userId: string,
  file: File,
  opts?: { prefix?: string },
): Promise<UploadResult> {
  const ext = extensionOf(file.name)
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = [userId, opts?.prefix, safeName].filter(Boolean).join('/')

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })
  if (error) throw error

  return { path, publicUrl: publicUrlFor(bucket, path) }
}

/** Public URL — only meaningful for the public buckets (avatars, community). */
export function publicUrlFor(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Short-lived signed URL for the private buckets (course-resources,
 * submissions). Falls back to null when the caller is not authorized.
 */
export async function signedUrlFor(bucket: string, path: string, expiresIn = 60 * 10) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
  if (error) return null
  return data?.signedUrl ?? null
}

export async function removeFile(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
}

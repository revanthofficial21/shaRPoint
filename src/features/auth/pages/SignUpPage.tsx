import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, GraduationCap, Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/auth-context'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

const schema = z
  .object({
    fullName: z.string().min(2, 'Please enter your full name'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    password: z.string().min(8, 'Use at least 8 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  })

type FormValues = z.infer<typeof schema>

const roleOptions = [
  {
    value: 'student' as const,
    label: 'Student',
    blurb: 'Join groups and coursework',
    icon: GraduationCap,
  },
  { value: 'teacher' as const, label: 'Teacher', blurb: 'Manage courses and grading', icon: Users },
]

export function SignUpPage() {
  const { signUp } = useAuth()
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [formError, setFormError] = useState<string | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setFormError(null)
    const { error, needsVerification } = await signUp({
      email: values.email,
      password: values.password,
      fullName: values.fullName,
      role,
    })
    if (error) {
      setFormError(error)
      return
    }
    if (needsVerification) {
      setVerificationSent(true)
      return
    }
    toast.success('Account created')
  }

  if (verificationSent) {
    return (
      <AuthLayout title="Check your inbox" subtitle="One more step to activate your account.">
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            We&apos;ve emailed you a confirmation link. Click it, then sign in.
          </AlertDescription>
        </Alert>
        <Button asChild className="w-full">
          <Link to="/sign-in">Go to sign in</Link>
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Choose how you'll be using SHARPOINT."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/sign-in" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>I am joining as</Label>
          <div className="grid grid-cols-2 gap-2">
            {roleOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                className={cn(
                  'rounded-lg border p-3 text-left transition-colors',
                  role === option.value
                    ? 'border-primary bg-accent'
                    : 'border-input hover:bg-muted',
                )}
              >
                <option.icon className="h-4 w-4 text-primary" />
                <p className="mt-1.5 text-sm font-medium">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.blurb}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Administrator and owner accounts are provisioned by the platform, never through public
            sign-up.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" autoComplete="name" {...register('fullName')} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              {...register('confirm')}
            />
            {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </Button>
      </form>
    </AuthLayout>
  )
}

import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

/**
 * Plain-language legal pages.
 *
 * They describe what the software actually does — which tables hold what, who
 * RLS lets read them, and what the AI assistant sends where. They are a starting
 * point, not legal advice, and say so on the page.
 */

function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              S
            </span>
            SHARPOINT
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-3xl space-y-6 py-12">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">Last updated {updated}</p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Starting point, not legal advice</AlertTitle>
          <AlertDescription>
            This page is written to match what the software actually does. It is a template — have
            it reviewed against the law where you and your users are before you rely on it.
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="space-y-6 pt-6 text-sm leading-relaxed text-muted-foreground">
            {children}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{heading}</h2>
      {children}
    </section>
  )
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Privacy policy" updated="October 2026">
      <Section heading="What we hold">
        <ul className="list-inside list-disc space-y-1">
          <li>
            <strong className="text-foreground">Account</strong> — your email address and a password
            that is hashed by Supabase Auth. Nobody, including administrators, can read the
            password.
          </li>
          <li>
            <strong className="text-foreground">Profile</strong> — the name, college, course or
            designation, bio, skills and avatar you choose to add.
          </li>
          <li>
            <strong className="text-foreground">Academic record</strong> — the courses you are
            enrolled in, assignments you submit, and the grades your teachers give.
          </li>
          <li>
            <strong className="text-foreground">Content</strong> — posts, comments, study groups,
            resources you upload, opportunity applications, and direct messages.
          </li>
          <li>
            <strong className="text-foreground">Activity</strong> — points and badges earned, and
            the audit entries created when an administrator acts on an account.
          </li>
        </ul>
      </Section>

      <Section heading="Where it is stored">
        <p>
          In a Supabase project — a Postgres database for records and object storage for uploaded
          files. Session tokens are kept in your browser's local storage so you stay signed in.
        </p>
      </Section>

      <Section heading="Who can see it">
        <p>
          Access is enforced by row-level security in the database itself, not by what the interface
          chooses to show. Concretely:
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>Your profile is visible to signed-in members of the platform.</li>
          <li>
            A submission, its grade and its feedback are visible to you, the teacher of that course,
            and administrators — nobody else.
          </li>
          <li>Direct messages are visible only to the people in the conversation.</li>
          <li>Uploaded files are stored under your user id and cannot be written to by anyone else.</li>
          <li>
            Audit logs are readable only by administrators and cannot be edited or deleted through
            the app.
          </li>
        </ul>
      </Section>

      <Section heading="The AI assistant">
        <p>
          If the assistant is enabled and you use it, the messages you type are sent to the AI
          provider your platform has configured, so it can generate a reply. They are not used to
          train anything by us. If the assistant is not configured, nothing is sent anywhere.
        </p>
      </Section>

      <Section heading="What we do not do">
        <p>
          We do not sell your data, run third-party advertising, or share your information with
          anyone beyond the infrastructure above. There is no analytics or tracking script embedded
          in the application.
        </p>
      </Section>

      <Section heading="Keeping and removing it">
        <p>
          Data is kept while your account exists. You can download a copy of your account details
          from <strong className="text-foreground">Settings → Your data</strong>. To have your
          account and its content removed, ask a platform administrator; deletion is deliberately
          not self-service, because your coursework and messages are part of other people's records
          too.
        </p>
      </Section>

      <Section heading="Getting in touch">
        <p>
          For any question about your data, or to exercise a right under the law that applies to
          you, contact the administrator of your SHARPOINT instance.
        </p>
      </Section>
    </LegalLayout>
  )
}

export function TermsPage() {
  return (
    <LegalLayout title="Terms of service" updated="October 2026">
      <Section heading="Using SHARPOINT">
        <p>
          SHARPOINT is for students, teachers and administrators at the institution running it. Use
          it for coursework and collaboration. Do not use it to harass anyone, to post content that
          is unlawful or harmful, or to attempt to access parts of the platform your account is not
          entitled to.
        </p>
      </Section>

      <Section heading="Accounts and roles">
        <p>
          You are responsible for keeping your password to yourself. Public sign-up only creates
          student or teacher accounts — administrator and owner access is provisioned deliberately by
          the platform, never through the sign-up form. Attempting to grant yourself a role you were
          not given is a breach of these terms and is blocked and logged by the database.
        </p>
      </Section>

      <Section heading="Academic integrity">
        <p>
          The AI assistant is there to explain and guide. It is not there to produce work you submit
          as your own, and it is instructed to teach rather than to hand over finished answers.
          Submitting generated work as your own is a matter for your institution's academic policy,
          not for this platform.
        </p>
      </Section>

      <Section heading="Your content">
        <p>
          You keep ownership of what you post and upload. By sharing it here you allow the platform
          to store it and show it to the people your permissions allow. Do not upload anything you do
          not have the right to share.
        </p>
      </Section>

      <Section heading="Moderation">
        <p>
          Anything you post can be reported by another member. Moderators can hide content that
          breaks these terms, and every moderation action is recorded in an audit log with the
          administrator who took it. Repeated or serious breaches can lead to your account being
          suspended.
        </p>
      </Section>

      <Section heading="Availability and changes">
        <p>
          The platform is provided as-is; it may be unavailable during maintenance or outages. These
          terms may change, and material changes will be surfaced in the app. Continuing to use
          SHARPOINT after a change means you accept it.
        </p>
      </Section>
    </LegalLayout>
  )
}

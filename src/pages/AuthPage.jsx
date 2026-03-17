import { SignIn, SignUp } from '@clerk/clerk-react'

export default function AuthPage({ mode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#04091a' }}>
      <div>
        {mode === 'sign-in'
          ? <SignIn routing="path" path="/sign-in" afterSignInUrl="/feed" />
          : <SignUp routing="path" path="/sign-up" afterSignUpUrl="/feed" />
        }
      </div>
    </div>
  )
}

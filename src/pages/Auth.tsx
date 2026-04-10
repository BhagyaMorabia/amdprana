/** Auth page — sign in / sign up with Google or email */

import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { Leaf, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const signInSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = signInSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignInForm = z.infer<typeof signInSchema>;
type SignUpForm = z.infer<typeof signUpSchema>;

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';

  const {
    register: registerSignIn,
    handleSubmit: handleSignIn,
    formState: { errors: signInErrors, isSubmitting: signInLoading },
  } = useForm<SignInForm>({ resolver: zodResolver(signInSchema) });

  const {
    register: registerSignUp,
    handleSubmit: handleSignUp,
    formState: { errors: signUpErrors, isSubmitting: signUpLoading },
  } = useForm<SignUpForm>({ resolver: zodResolver(signUpSchema) });

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Welcome to NutriSense!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSignIn = async (data: SignInForm) => {
    try {
      await signInWithEmail(data.email, data.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch {
      toast.error('Invalid email or password.');
    }
  };

  const onSignUp = async (data: SignUpForm) => {
    try {
      await signUpWithEmail(data.email, data.password, data.name);
      toast.success('Account created! Let\'s set up your profile.');
      navigate('/onboarding', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      toast.error(msg.includes('email-already-in-use') ? 'Email already registered.' : 'Sign up failed. Try again.');
    }
  };



  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6"
            aria-label="NutriSense home">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-brand-400" aria-hidden="true" />
            </div>
            <span className="font-display font-bold text-2xl text-white">NutriSense</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-zinc-400 text-sm">
            {mode === 'signin'
              ? 'Sign in to continue your health journey.'
              : 'Start building healthier habits today. Free forever.'}
          </p>
        </div>

        <div className="card">
          {/* Google Sign-in */}
          <button
            onClick={handleGoogleAuth}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl
              border border-surface-border bg-surface-elevated hover:bg-surface-border
              transition-all duration-200 text-sm font-medium text-white mb-6
              disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-brand-400"
            aria-label="Continue with Google account"
          >
            {googleLoading
              ? <Loader2 className="w-4 h-4 animate-spin" aria-label="Loading" />
              : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )
            }
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-xs text-zinc-600 font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          {/* Email Form */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn(onSignIn)} noValidate className="space-y-4">
              <div>
                <label htmlFor="signin-email" className="label">Email</label>
                <input
                  id="signin-email" type="email" autoComplete="email"
                  {...registerSignIn('email')}
                  className={`input ${signInErrors.email ? 'border-red-500' : ''}`}
                  placeholder="you@example.com"
                  aria-describedby={signInErrors.email ? 'email-error' : undefined}
                  aria-invalid={!!signInErrors.email}
                />
                {signInErrors.email && (
                  <p id="email-error" className="text-red-400 text-xs mt-1 flex items-center gap-1" role="alert">
                    <AlertCircle className="w-3 h-3" aria-hidden="true" /> {signInErrors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="signin-password" className="label">Password</label>
                <div className="relative">
                  <input
                    id="signin-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                    {...registerSignIn('password')}
                    className={`input pr-10 ${signInErrors.password ? 'border-red-500' : ''}`}
                    placeholder="••••••••"
                    aria-invalid={!!signInErrors.password}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword
                      ? <EyeOff className="w-4 h-4" aria-hidden="true" />
                      : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
                {signInErrors.password && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1" role="alert">
                    <AlertCircle className="w-3 h-3" aria-hidden="true" /> {signInErrors.password.message}
                  </p>
                )}
              </div>

              <button type="submit" disabled={signInLoading} className="btn-primary w-full">
                {signInLoading ? <Loader2 className="w-4 h-4 animate-spin" aria-label="Signing in" /> : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp(onSignUp)} noValidate className="space-y-4">
              <div>
                <label htmlFor="signup-name" className="label">Full Name</label>
                <input id="signup-name" type="text" autoComplete="name"
                  {...registerSignUp('name')} className={`input ${signUpErrors.name ? 'border-red-500' : ''}`}
                  placeholder="Your full name" aria-invalid={!!signUpErrors.name} />
                {signUpErrors.name && (
                  <p className="text-red-400 text-xs mt-1" role="alert">{signUpErrors.name.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="signup-email" className="label">Email</label>
                <input id="signup-email" type="email" autoComplete="email"
                  {...registerSignUp('email')} className={`input ${signUpErrors.email ? 'border-red-500' : ''}`}
                  placeholder="you@example.com" aria-invalid={!!signUpErrors.email} />
                {signUpErrors.email && (
                  <p className="text-red-400 text-xs mt-1" role="alert">{signUpErrors.email.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="signup-password" className="label">Password</label>
                <div className="relative">
                  <input id="signup-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                    {...registerSignUp('password')} className={`input pr-10 ${signUpErrors.password ? 'border-red-500' : ''}`}
                    placeholder="Min. 6 characters" aria-invalid={!!signUpErrors.password} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
                {signUpErrors.password && (
                  <p className="text-red-400 text-xs mt-1" role="alert">{signUpErrors.password.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="signup-confirm" className="label">Confirm Password</label>
                <input id="signup-confirm" type="password" autoComplete="new-password"
                  {...registerSignUp('confirmPassword')} className={`input ${signUpErrors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Repeat password" aria-invalid={!!signUpErrors.confirmPassword} />
                {signUpErrors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1" role="alert">{signUpErrors.confirmPassword.message}</p>
                )}
              </div>
              <button type="submit" disabled={signUpLoading} className="btn-primary w-full">
                {signUpLoading ? <Loader2 className="w-4 h-4 animate-spin" aria-label="Creating account" /> : 'Create Free Account'}
              </button>
            </form>
          )}

          {/* Mode toggle */}
          <p className="text-center text-sm text-zinc-500 mt-6">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-brand-400 font-medium hover:underline focus-visible:outline-none focus-visible:underline"
            >
              {mode === 'signin' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          By continuing, you agree to our{' '}
          <a href="#" className="text-zinc-500 hover:text-white">Privacy Policy</a>.
          Your data is stored securely in Firebase.
        </p>
      </div>
    </div>
  );
}

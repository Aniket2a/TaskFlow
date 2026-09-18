import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Mail,
  Lock,
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useTaskFlowStore } from '../../store/useTaskFlowStore';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signInGuestUser,
} from '../../lib/firebase';
import { Button } from '../ui/Button';
import { authFormSchema, AuthFormData } from '../../lib/validations';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    setUser,
    setCloudSynced,
    setSyncNotice,
  } = useTaskFlowStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
    },
  });

  if (!isAuthModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSocialLoading(true);
    setAuthError(null);
    try {
      const userProfile = await signInWithGoogle();
      setUser(userProfile);
      setCloudSynced(true);
      setSyncNotice(`Welcome back, ${userProfile.name}!`);
      setAuthModalOpen(false);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setAuthError(
        err?.message || 'Failed to sign in with Google. Please check your browser popup settings.'
      );
    } finally {
      setIsSocialLoading(false);
    }
  };

  const onEmailSubmit = async (data: AuthFormData) => {
    setAuthError(null);
    try {
      let userProfile;
      if (mode === 'signup') {
        userProfile = await signUpWithEmail(
          data.displayName || data.email.split('@')[0],
          data.email,
          data.password
        );
        setSyncNotice(`Account created! Welcome, ${userProfile.name}!`);
      } else {
        userProfile = await signInWithEmail(data.email, data.password);
        setSyncNotice(`Welcome back, ${userProfile.name}!`);
      }
      setUser(userProfile);
      setCloudSynced(true);
      setAuthModalOpen(false);
      reset();
    } catch (err: any) {
      console.error('Email auth error:', err);
      const msg =
        err.code === 'auth/invalid-credential'
          ? 'Invalid email or password.'
          : err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists.'
          : err.code === 'auth/weak-password'
          ? 'Password must be at least 6 characters.'
          : err.message || 'Authentication failed. Please check credentials.';
      setAuthError(msg);
    }
  };

  const handleGuestSignIn = async () => {
    setIsSocialLoading(true);
    setAuthError(null);
    try {
      const guestProfile = await signInGuestUser();
      setUser(guestProfile);
      setSyncNotice('Browsing in guest mode');
      setAuthModalOpen(false);
    } catch (err: any) {
      console.error('Guest mode warning:', err);
      // Do not create a fake client-side identity when Firebase anonymous
      // authentication fails. That state is not backed by Firebase Auth and
      // must not be treated as an authenticated session.
      setAuthError('Guest mode is temporarily unavailable. Please try again or sign in.');

    } finally {
      setIsSocialLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="auth-modal"
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                {mode === 'signin' ? 'Sign In to TaskFlow' : 'Create an Account'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Secure cloud sync across devices with Firebase Auth
              </p>
            </div>
          </div>
          <button
            id="close-auth-modal"
            onClick={() => setAuthModalOpen(false)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {authError && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Google Sign In */}
          <button
            id="google-signin-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSocialLoading || isSubmitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-100 text-sm font-medium rounded-xl transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
              Or email
            </span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          </div>

          {/* Email / Password Form with React Hook Form + Zod */}
          <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-name-input"
                    type="text"
                    {...register('displayName')}
                    placeholder="Alex Johnson"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
                {errors.displayName && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {errors.displayName.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-email-input"
                  type="email"
                  {...register('email')}
                  placeholder="student@university.edu"
                  className={`w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border ${
                    errors.email ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'
                  } rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-indigo-600`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-password-input"
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border ${
                    errors.password ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'
                  } rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-indigo-600`}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-500 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              id="auth-submit-btn"
              type="submit"
              disabled={isSubmitting || isSocialLoading}
              className="w-full justify-center mt-2"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : mode === 'signin' ? (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle mode */}
          <div className="pt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
            {mode === 'signin' ? (
              <span>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signup');
                    setAuthError(null);
                  }}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                >
                  Create one here
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signin');
                    setAuthError(null);
                  }}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </span>
            )}
          </div>

          {/* Guest session option */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <button
              onClick={handleGuestSignIn}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Continue with local guest session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { RegisterRequest, SessionUser } from '@/types';
import { ArrowRight, Lock, Mail, User, AlertCircle, Loader2 } from 'lucide-react';

interface FormState {
  errors: Partial<Record<keyof RegisterRequest | '_form', string>>;
  submitting: boolean;
}

const INITIAL_STATE: FormState = { errors: {}, submitting: false };

function validate(
  displayName: string,
  email: string,
  password: string,
): FormState['errors'] {
  const errors: FormState['errors'] = {};

  if (!displayName.trim()) {
    errors.displayName = 'Name is required.';
  } else if (displayName.trim().length < 2) {
    errors.displayName = 'Name must be at least 2 characters.';
  }

  if (!email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  } else if (!/[A-Z]/.test(password)) {
    errors.password = 'Password must contain at least one uppercase letter.';
  } else if (!/[0-9]/.test(password)) {
    errors.password = 'Password must contain at least one number.';
  }

  return errors;
}

export default function RegisterPage() {
  const router = useRouter();
  const [state, setState] = useState<FormState>(INITIAL_STATE);

  useEffect(() => {
    apiClient.warmServer();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const displayName = (
      form.elements.namedItem('displayName') as HTMLInputElement
    ).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement)
      .value;

    const errors = validate(displayName, email, password);
    if (Object.keys(errors).length > 0) {
      setState({ errors, submitting: false });
      return;
    }

    setState({ errors: {}, submitting: true });

    const result = await apiClient.post<SessionUser>('/auth/register', {
      displayName: displayName.trim(),
      email,
      password,
    } satisfies RegisterRequest);

    if (!result.ok) {
      const apiErrors: FormState['errors'] = {};

      switch (result.error.error.code) {
        case 'TIMEOUT_ERROR':
          apiErrors._form =
            'The server is waking up from idle state. Please wait a moment and click Create account again.';
          break;
        case 'EMAIL_EXISTS':
          apiErrors.email = 'An account with this email already exists.';
          break;
        case 'VALIDATION_ERROR':
          Object.assign(apiErrors, result.error.error.details);
          break;
        default:
          apiErrors._form =
            result.error.error.message ||
            'Registration failed. Please try again.';
      }

      setState({ errors: apiErrors, submitting: false });
      return;
    }

    const authData = result.data as unknown as { session?: { accessToken?: string }; accessToken?: string };
    const token = authData?.session?.accessToken || authData?.accessToken;

    if (token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('saar_token', token);
      }

      try {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch {
        // Ignore network failure on internal session sync
      }
      document.cookie = `saar_session=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax${typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''}`;
    }

    const nextUrl =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('next') || '/dashboard'
        : '/dashboard';

    window.location.href = nextUrl;
  }

  const { errors, submitting } = state;

  return (
    <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200 shadow-sm">
      {/* Tab Switcher */}
      <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-8 max-w-xs mx-auto">
        <Link
          href="/login"
          className="flex-1 py-2 text-center rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          Sign In
        </Link>
        <button
          type="button"
          className="flex-1 py-2 rounded-lg text-xs font-bold text-white bg-slate-900 shadow-sm"
        >
          Create Account
        </button>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1.5">
          Create Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-normal">
          Begin your deliberate growth journey with SAAR.
        </p>
      </div>

      {errors._form && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium"
        >
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-rose-500" />
          <span>{errors._form}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Full Name */}
        <div>
          <label
            htmlFor="displayName"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1"
          >
            Your Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User size={16} />
            </div>
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              required
              aria-describedby={errors.displayName ? 'name-error' : undefined}
              aria-invalid={Boolean(errors.displayName)}
              placeholder="Alex Morgan"
              className={`w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none ${
                errors.displayName
                  ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'
              }`}
            />
          </div>
          {errors.displayName && (
            <p id="name-error" className="text-[11px] text-rose-600 mt-1 ml-1 font-medium">
              {errors.displayName}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail size={16} />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={Boolean(errors.email)}
              placeholder="name@domain.com"
              className={`w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none ${
                errors.email
                  ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'
              }`}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="text-[11px] text-rose-600 mt-1 ml-1 font-medium">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock size={16} />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={Boolean(errors.password)}
              placeholder="Min. 8 chars, 1 uppercase, 1 number"
              className={`w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none ${
                errors.password
                  ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'
              }`}
            />
          </div>
          {errors.password && (
            <p id="password-error" className="text-[11px] text-rose-600 mt-1 ml-1 font-medium">
              {errors.password}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Free Account</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

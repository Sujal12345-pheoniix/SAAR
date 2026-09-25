'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { LoginRequest, SessionUser } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormState {
  errors: Partial<Record<keyof LoginRequest | '_form', string>>;
  submitting: boolean;
}

const INITIAL_STATE: FormState = { errors: {}, submitting: false };

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(email: string, password: string): FormState['errors'] {
  const errors: FormState['errors'] = {};

  if (!email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const router = useRouter();
  const [state, setState] = useState<FormState>(INITIAL_STATE);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    // Client-side validation
    const errors = validate(email, password);
    if (Object.keys(errors).length > 0) {
      setState({ errors, submitting: false });
      return;
    }

    setState({ errors: {}, submitting: true });

    const result = await apiClient.post<SessionUser>('/auth/login', {
      email,
      password,
    } satisfies LoginRequest);

    if (!result.ok) {
      const apiErrors: FormState['errors'] = {};

      // Map API error codes to field-level messages
      switch (result.error.error.code) {
        case 'TIMEOUT_ERROR':
          apiErrors._form =
            'The server is waking up from idle state. Please wait a moment and click Sign in again.';
          break;
        case 'INVALID_CREDENTIALS':
          apiErrors._form = 'Incorrect email or password. Please try again.';
          break;
        case 'ACCOUNT_LOCKED':
          apiErrors._form = 'Your account has been temporarily locked. Please try again later.';
          break;
        case 'VALIDATION_ERROR':
          Object.assign(apiErrors, result.error.error.details);
          break;
        default:
          apiErrors._form =
            result.error.error.message || 'Login failed. Please try again.';
      }

      setState({ errors: apiErrors, submitting: false });
      return;
    }

    // Success — persist session token in localStorage AND cookies for bulletproof auth
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
    <>
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
            letterSpacing: '-0.025em',
          }}
        >
          Welcome back
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Sign in to continue your growth journey.
        </p>
      </div>

      {/* Form-level error */}
      {errors._form && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            color: '#dc2626',
            marginBottom: '1.25rem',
          }}
        >
          {errors._form}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
        {/* Email */}
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className="form-input"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p id="email-error" className="form-error" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <Link
              href="/forgot-password"
              style={{ fontSize: '0.8125rem', color: '#6366f1', textDecoration: 'none' }}
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className="form-input"
            placeholder="••••••••"
          />
          {errors.password && (
            <p id="password-error" className="form-error" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary btn-full"
          style={{ marginTop: '0.25rem' }}
          aria-busy={submitting}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {/* Register link */}
      <p
        style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#6b7280',
        }}
      >
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: '#6366f1', fontWeight: 500 }}>
          Create one
        </Link>
      </p>
    </>
  );
}

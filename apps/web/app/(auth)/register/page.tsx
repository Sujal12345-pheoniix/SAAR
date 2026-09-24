'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { RegisterRequest, SessionUser } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormState {
  errors: Partial<Record<keyof RegisterRequest | '_form', string>>;
  submitting: boolean;
}

const INITIAL_STATE: FormState = { errors: {}, submitting: false };

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(
  displayName: string,
  email: string,
  password: string,
): FormState['errors'] {
  const errors: FormState['errors'] = {};

  if (!displayName.trim()) {
    errors.displayName = 'Display name is required.';
  } else if (displayName.trim().length < 2) {
    errors.displayName = 'Display name must be at least 2 characters.';
  } else if (displayName.trim().length > 60) {
    errors.displayName = 'Display name must be 60 characters or fewer.';
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RegisterPage() {
  const router = useRouter();
  const [state, setState] = useState<FormState>(INITIAL_STATE);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    const displayName = (
      form.elements.namedItem('displayName') as HTMLInputElement
    ).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (
      form.elements.namedItem('password') as HTMLInputElement
    ).value;

    // Client-side validation
    const errors = validate(displayName, email, password);
    if (Object.keys(errors).length > 0) {
      setState({ errors, submitting: false });
      return;
    }

    setState({ errors: {}, submitting: true });

    const result = await apiClient.post<SessionUser>('/auth/register', {
      displayName: displayName.trim(),
      email: email.trim(),
      password,
    } satisfies RegisterRequest);

    if (!result.ok) {
      const apiErrors: FormState['errors'] = {};

      switch (result.error.error.code) {
        case 'EMAIL_TAKEN':
          apiErrors.email =
            'An account with this email already exists. Try signing in instead.';
          break;
        case 'VALIDATION_ERROR':
          Object.assign(apiErrors, result.error.error.details);
          break;
        default:
          apiErrors._form =
            result.error.error.message || 'Registration failed. Please try again.';
      }

      setState({ errors: apiErrors, submitting: false });
      return;
    }

    // Success — persist session cookie on our domain
    const authData = result.data as unknown as { session?: { accessToken?: string }; accessToken?: string };
    const token = authData?.session?.accessToken || authData?.accessToken;

    if (token) {
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

    window.location.href = '/dashboard';
  }

  const { errors, submitting } = state;

  return (
    <>
      <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
        <h1
          style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.375rem' }}
        >
          Create your account
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
          Start your personal growth journey with SAAR
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

      <form
        onSubmit={handleSubmit}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}
      >
        {/* Display Name */}
        <div className="form-group">
          <label htmlFor="displayName" className="form-label">
            Display name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            required
            aria-invalid={errors.displayName ? 'true' : 'false'}
            aria-describedby={errors.displayName ? 'displayName-error' : undefined}
            className="form-input"
            placeholder="Jane Smith"
            maxLength={60}
          />
          {errors.displayName && (
            <p id="displayName-error" className="form-error" role="alert">
              {errors.displayName}
            </p>
          )}
        </div>

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
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={
              errors.password ? 'password-error' : 'password-hint'
            }
            className="form-input"
            placeholder="Min. 8 characters"
          />
          {errors.password ? (
            <p id="password-error" className="form-error" role="alert">
              {errors.password}
            </p>
          ) : (
            <p
              id="password-hint"
              style={{ fontSize: '0.8rem', color: '#9ca3af' }}
            >
              At least 8 characters with one uppercase letter and one number.
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
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        {/* Terms */}
        <p
          style={{
            fontSize: '0.78rem',
            color: '#9ca3af',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          By creating an account you agree to our{' '}
          <Link
            href="/terms"
            style={{ color: '#6366f1', textDecoration: 'none' }}
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            style={{ color: '#6366f1', textDecoration: 'none' }}
          >
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      {/* Login link */}
      <p
        style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#6b7280',
        }}
      >
        Already have an account?{' '}
        <Link href="/login" style={{ color: '#6366f1', fontWeight: 500 }}>
          Sign in
        </Link>
      </p>
    </>
  );
}

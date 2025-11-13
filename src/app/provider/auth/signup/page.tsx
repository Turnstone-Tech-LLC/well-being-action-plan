/**
 * Provider Signup Page
 *
 * Registration page for new providers to create an account.
 * Collects provider information and creates both auth and profile records.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { revokeProviderMode } from '@/lib/utils/providerMode';

export const dynamic = 'force-dynamic';

export default function SignupPage() {
  const router = useRouter();
  const { signUp, user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/provider');
    }
  }, [user, router]);

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await signUp(formData.email, formData.password, {
        name: formData.name,
        organization: formData.organization || undefined,
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccess(true);
        // Supabase will send confirmation email if email confirmation is enabled
        setTimeout(() => {
          router.push('/provider/auth/login');
        }, 3000);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-morning-fog px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="rounded-md bg-[#154734]/10 p-4 dark:bg-[#154734]/20">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-zone dark:text-[#7FD4B8]">
                  Account Created Successfully!
                </h3>
                <div className="mt-2 text-sm text-green-zone dark:text-[#7FD4B8]">
                  <p>
                    Your provider account has been created. You will be redirected to the login page
                    shortly.
                  </p>
                  {/* Note: If email confirmation is required, update this message */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-morning-fog px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold tracking-tight text-catamount-green dark:text-[#7FD4B8]">
            Provider Portal
          </h1>
          <h2 className="mt-2 text-center text-xl text-vermont-slate dark:text-[#A8D5FF]">
            Create your provider account
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-[#DC582A]/10 p-4 dark:bg-[#DC582A]/20">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-zone dark:text-[#FF9B7F]">
                    Registration Error
                  </h3>
                  <div className="mt-2 text-sm text-red-zone dark:text-[#FF9B7F]">{error}</div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Dr. Jane Smith"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                Organization (optional)
              </label>
              <input
                id="organization"
                name="organization"
                type="text"
                value={formData.organization}
                onChange={handleChange}
                className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Mental Health Clinic"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              Already have an account?{' '}
              <Link
                href="/provider/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            </div>
          </div>
        </form>

        <div className="text-center">
          <button
            onClick={() => revokeProviderMode()}
            className="text-sm font-medium text-gray-600 hover:text-gray-500"
          >
            ← Leave Provider Mode
          </button>
        </div>
      </div>
    </div>
  );
}

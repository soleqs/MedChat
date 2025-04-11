import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';

export function ResetPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { resetPassword, updatePassword } = useAuthStore();

  // Get token from URL if present
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      if (token) {
        // If we have a token, we're setting a new password
        await updatePassword(token, password);
        setMessage(t('auth.passwordResetSuccess'));
        setTimeout(() => navigate('/login'), 2000);
      } else {
        // Otherwise, we're requesting a reset email
        await resetPassword(email);
        setMessage(t('auth.resetEmailSent'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.resetError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-24 h-24 relative overflow-hidden rounded-2xl shadow-xl">
            <img 
              src="https://lphvctwbxtpmpoqcrcmo.supabase.co/storage/v1/object/public/MedOk_logos/logo.jpg" 
              alt="MedChat Logo"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {token ? t('auth.setNewPassword') : t('auth.resetPassword')}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!token ? (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {t('auth.email')}
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('auth.enterEmail')}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                  {t('auth.newPassword')}
                </label>
                <div className="mt-1">
                  <input
                    id="new-password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('auth.enterNewPassword')}
                    minLength={6}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {t('auth.minPasswordLength')}
                </p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('auth.processing')}
                  </span>
                ) : token ? (
                  t('auth.updatePassword')
                ) : (
                  t('auth.sendResetLink')
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {t('auth.backToLogin')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
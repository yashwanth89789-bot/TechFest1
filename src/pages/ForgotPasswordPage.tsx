import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { useToast } from '../context/ToastContext.tsx';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [demoResetUrl, setDemoResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const data = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setSubmitted(true);
      if (data.resetUrl) {
        setDemoResetUrl(data.resetUrl);
      }
      showToast('info', 'Password Reset Requested', data.message);
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Reset Your Password
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Enter your registered college email to receive a secure password reset link.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Reset Link Dispatched</span>
              </div>
              <p>
                If an account exists for <strong>{email}</strong>, password reset instructions have been dispatched.
              </p>
            </div>

            {demoResetUrl && (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs space-y-2">
                <p className="font-bold text-indigo-900">Demo Instant Reset Link:</p>
                <Link
                  to={demoResetUrl}
                  className="block p-2 bg-white rounded-lg border border-indigo-200 text-indigo-700 font-mono text-[11px] hover:underline break-all"
                >
                  {window.location.origin}{demoResetUrl}
                </Link>
                <p className="text-[10px] text-indigo-600">
                  Click the link above to proceed directly to the password reset form.
                </p>
              </div>
            )}

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs font-bold text-indigo-600 hover:underline">
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">College Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="student@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : 'Send Reset Link'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-center text-xs text-slate-500 pt-2">
              Remember your password?{' '}
              <Link to="/login" className="text-indigo-600 font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

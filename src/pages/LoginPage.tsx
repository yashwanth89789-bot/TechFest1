import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid college email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch {
      // error handled by Toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign In to TechFest Hub
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Access your registrations, digital QR tickets, and technical team portals.
          </p>
        </div>

        {/* Quick 1-Click Demo Login Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Instant Demo Accounts</span>
            </span>
            <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">
              1-Click Sign In
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={async () => {
                await loginAsDemo('STUDENT');
                navigate('/dashboard');
              }}
              className="py-2 px-2 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 rounded-xl font-bold text-slate-800 transition-colors shadow-2xs text-center"
            >
              <span className="block text-emerald-600 text-[10px]">Student</span>
              <span>Alex</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await loginAsDemo('ORGANIZER');
                navigate('/organizer');
              }}
              className="py-2 px-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-xl font-bold text-slate-800 transition-colors shadow-2xs text-center"
            >
              <span className="block text-indigo-600 text-[10px]">Organizer</span>
              <span>Sarah</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await loginAsDemo('ADMIN');
                navigate('/admin');
              }}
              className="py-2 px-2 bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 rounded-xl font-bold text-slate-800 transition-colors shadow-2xs text-center"
            >
              <span className="block text-purple-600 text-[10px]">Admin</span>
              <span>Dr. Vance</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">College Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                {...register('email')}
                placeholder="student@college.edu"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <Link
                to="/forgot-password"
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-indigo-600 font-bold hover:underline">
            Register as a Student
          </Link>
        </p>
      </div>
    </div>
  );
};

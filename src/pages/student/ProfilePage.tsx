import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Building2, GraduationCap, Phone, Github, Linkedin, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { apiRequest } from '../../lib/api.ts';
import { useToast } from '../../context/ToastContext.tsx';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user?.name || '',
      college: user?.profile?.college || '',
      department: user?.profile?.department || '',
      graduationYear: user?.profile?.graduationYear?.toString() || '',
      phoneNumber: user?.profile?.phoneNumber || '',
      studentIdNumber: user?.profile?.studentIdNumber || '',
      githubUrl: user?.profile?.githubUrl || '',
      linkedinUrl: user?.profile?.linkedinUrl || '',
      bio: user?.profile?.bio || '',
      skills: user?.profile?.skills || '',
    },
  });

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await apiRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      await refreshProfile();
      showToast('success', 'Profile Saved', 'Your student details have been updated.');
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your collegiate credentials, verified skills, and technical symposium identity.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8">
        {/* User Avatar & Role Overview */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100 text-center sm:text-left">
          <img
            src={
              user?.avatarUrl ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`
            }
            alt={user?.name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
          />
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
            <div className="pt-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {user?.role} Access Tier
              </span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  {...register('name')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">College / University</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  {...register('college')}
                  placeholder="e.g. Imperial College of Engineering"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department / Major</label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  {...register('department')}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Student Roll / ID Number</label>
              <input
                type="text"
                {...register('studentIdNumber')}
                placeholder="e.g. ICE-CS-2027-108"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Graduation Year</label>
              <input
                type="number"
                {...register('graduationYear')}
                placeholder="2027"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  {...register('phoneNumber')}
                  placeholder="+1 (555) 012-3456"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">GitHub Profile URL</label>
              <div className="relative">
                <Github className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="url"
                  {...register('githubUrl')}
                  placeholder="https://github.com/username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn Profile URL</label>
              <div className="relative">
                <Linkedin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="url"
                  {...register('linkedinUrl')}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Technical Skills</label>
            <input
              type="text"
              {...register('skills')}
              placeholder="e.g. React, TypeScript, Python, Docker, PyTorch, ROS"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-600 mt-1">Comma-separated list of technical tools and frameworks.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Student Bio</label>
            <textarea
              rows={3}
              {...register('bio')}
              placeholder="Tell organizers and hackathon teammates about your technical interests, past hackathons, or project specializations..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span>{submitting ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

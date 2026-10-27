import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Check,
  Building2,
  Users,
  Award,
  ShieldAlert,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';

export const CreateEditEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      title: '',
      categoryId: '',
      format: 'OFFLINE',
      venue: '',
      onlineLink: '',
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      capacity: '100',
      registrationType: 'INDIVIDUAL',
      minTeamSize: '1',
      maxTeamSize: '4',
      shortDescription: '',
      description: '',
      eligibility: 'Open to all undergraduate and postgraduate engineering students.',
      rules: 'Code written must be original. Third party open-source tools permitted.',
      prizes: '1st Place: $2,000 | 2nd Place: $1,000 | 3rd Place: $500',
      bannerUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
  });

  const registrationType = watch('registrationType');

  // Load categories and existing event if editing
  useEffect(() => {
    async function init() {
      try {
        const catData = await apiRequest('/events/categories/all');
        setCategories(catData || []);
        if (catData?.length > 0 && !isEditing) {
          setValue('categoryId', catData[0].id);
        }

        if (isEditing) {
          const eventData = await apiRequest(`/events/${id}`);
          const ev = eventData.event;
          setValue('title', ev.title);
          setValue('categoryId', ev.categoryId);
          setValue('format', ev.format);
          setValue('venue', ev.venue || '');
          setValue('onlineLink', ev.onlineLink || '');
          setValue('startDate', new Date(ev.startDate).toISOString().slice(0, 16));
          setValue('endDate', new Date(ev.endDate).toISOString().slice(0, 16));
          setValue('registrationDeadline', new Date(ev.registrationDeadline).toISOString().slice(0, 16));
          setValue('capacity', ev.capacity.toString());
          setValue('registrationType', ev.registrationType);
          setValue('minTeamSize', ev.minTeamSize?.toString() || '1');
          setValue('maxTeamSize', ev.maxTeamSize?.toString() || '4');
          setValue('shortDescription', ev.shortDescription || '');
          setValue('description', ev.description || '');
          setValue('eligibility', ev.eligibility || '');
          setValue('rules', ev.rules || '');
          setValue('prizes', ev.prizes || '');
          setValue('bannerUrl', ev.bannerUrl || '');
          setValue('status', ev.status);
        }
      } catch (err: any) {
        showToast('error', 'Error', err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id, isEditing, setValue]);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      if (isEditing) {
        await apiRequest(`/events/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
        showToast('success', 'Event Updated', 'Changes saved successfully.');
      } else {
        const res = await apiRequest('/events', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        showToast('success', 'Event Created', res.message);
      }
      navigate('/organizer');
    } catch (err: any) {
      showToast('error', 'Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
        <div className="h-8 w-40 bg-slate-100 rounded animate-pulse" />
        <div className="h-96 w-full bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Hub</span>
      </button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isEditing ? 'Edit Event Details' : 'Create New Technical Event'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure event registration parameters, schedules, capacity caps, and rules.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Title *</label>
              <input
                type="text"
                required
                {...register('title')}
                placeholder="e.g. HackSphere 2026: Autonomous AI Sprint"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Category & Format */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                <select
                  {...register('categoryId')}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Format *</label>
                <select
                  {...register('format')}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="OFFLINE">In-Person (Campus Venue)</option>
                  <option value="ONLINE">Virtual (Live Stream / Meet)</option>
                  <option value="HYBRID">Hybrid (In-Person + Stream)</option>
                </select>
              </div>
            </div>

            {/* Venue & Online Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Campus Venue</label>
                <input
                  type="text"
                  {...register('venue')}
                  placeholder="e.g. Grand Innovation Complex, Hall 4"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Online Meeting / Stream URL</label>
                <input
                  type="url"
                  {...register('onlineLink')}
                  placeholder="https://meet.google.com/xyz"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Dates: Start, End, Registration Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  {...register('startDate')}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">End Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  {...register('endDate')}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registration Deadline *</label>
                <input
                  type="datetime-local"
                  required
                  {...register('registrationDeadline')}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Capacity & Registration Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Maximum Capacity *</label>
                <input
                  type="number"
                  required
                  {...register('capacity')}
                  placeholder="100"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registration Type *</label>
                <select
                  {...register('registrationType')}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="INDIVIDUAL">Individual Only</option>
                  <option value="TEAM">Team Event</option>
                </select>
              </div>

              {registrationType === 'TEAM' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Min Size</label>
                    <input
                      type="number"
                      {...register('minTeamSize')}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Max Size</label>
                    <input
                      type="number"
                      {...register('maxTeamSize')}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Short & Full Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Short Description (1-2 sentences)</label>
              <input
                type="text"
                {...register('shortDescription')}
                placeholder="Brief summary for event cards and search snippets"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Event Description *</label>
              <textarea
                rows={5}
                required
                {...register('description')}
                placeholder="Detailed event breakdown, problem statements, what to bring, and schedule..."
                className="w-full p-4 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Banner URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Banner Image URL</label>
              <input
                type="url"
                {...register('bannerUrl')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Status (Draft / Publish / Submit) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Publication Status</label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none"
                >
                  <option value="PUBLISHED">Published (Active on Platform)</option>
                  <option value="DRAFT">Save as Draft</option>
                  <option value="PENDING_APPROVAL">Submit for Admin Review</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/organizer')}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span>{submitting ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

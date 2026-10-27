import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Ticket,
  Users,
  Award,
  Bell,
  Compass,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { apiRequest } from '../../lib/api.ts';
import { StatusBadge } from '../../components/StatusBadge.tsx';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [regData, notifData] = await Promise.all([
          apiRequest('/registrations/me'),
          apiRequest('/notifications'),
        ]);
        setRegistrations(regData || []);
        setNotifications(notifData.notifications || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const confirmed = registrations.filter((r) => r.status === 'CONFIRMED');
  const waitlisted = registrations.filter((r) => r.status === 'WAITLISTED');
  const upcoming = confirmed.filter((r) => new Date(r.event.startDate) >= new Date());
  const completed = registrations.filter(
    (r) => r.status === 'CONFIRMED' && new Date(r.event.endDate) < new Date()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Collegiate Technical Portal</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sm text-indigo-100 mt-2 max-w-xl leading-relaxed">
            {user?.profile?.college || 'Imperial College of Engineering'} •{' '}
            {user?.profile?.department || 'Student Developer'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/events"
            className="px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-xs hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Events</span>
          </Link>
          <Link
            to="/tickets"
            className="px-5 py-2.5 rounded-xl bg-indigo-500/40 hover:bg-indigo-500/60 border border-white/20 text-white font-bold text-xs transition-colors flex items-center gap-2"
          >
            <Ticket className="w-4 h-4" />
            <span>My Digital Tickets</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Registrations</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{registrations.length}</p>
          <span className="text-[11px] text-slate-600 mt-1 block">Lifetime applied</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Upcoming Confirmed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{upcoming.length}</p>
          <span className="text-[11px] text-emerald-700 mt-1 block">Active seats reserved</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Waitlisted</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">{waitlisted.length}</p>
          <span className="text-[11px] text-amber-700 mt-1 block">Auto-promotion queue</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Completed</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-purple-600">{completed.length}</p>
          <span className="text-[11px] text-slate-600 mt-1 block">Past symposiums</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Certificates</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
            {user?.certificatesCount || (completed.length > 0 ? 1 : 0)}
          </p>
          <Link to="/certificates" className="text-[11px] text-indigo-600 font-bold mt-1 block hover:underline">
            View Credentials →
          </Link>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-center">
        <Link
          to="/events"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Explore Events</p>
        </Link>

        <Link
          to="/registrations"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">My Registrations</p>
        </Link>

        <Link
          to="/teams"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">My Teams</p>
        </Link>

        <Link
          to="/tickets"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
            <Ticket className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Digital Tickets</p>
        </Link>

        <Link
          to="/certificates"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
            <Award className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Certificates</p>
        </Link>

        <Link
          to="/profile"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
            <User className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Profile & Settings</p>
        </Link>
      </div>

      {/* Two Column Layout: Upcoming Registered Events & Recent Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Upcoming Registered Events */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>Upcoming Registered Events</span>
            </h2>
            <Link to="/registrations" className="text-xs font-bold text-indigo-600 hover:underline">
              View All ({registrations.length})
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No upcoming events registered</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Explore upcoming hackathons, coding contests, and workshops across college departments.
              </p>
              <Link
                to="/events"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700 transition-colors"
              >
                <span>Browse Events</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map((reg) => (
                <div
                  key={reg.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {reg.event.category.name}
                      </span>
                      <StatusBadge status={reg.status} />
                      {reg.team && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{reg.team.name}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 truncate">
                      <Link to={`/events/${reg.event.id}`} className="hover:text-indigo-600">
                        {reg.event.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-slate-600 flex items-center gap-3">
                      <span>
                        {new Date(reg.event.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span className="truncate">{reg.event.venue || 'Virtual Campus'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    {reg.ticket && (
                      <Link
                        to="/tickets"
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Ticket className="w-3.5 h-3.5" /> View Ticket
                      </Link>
                    )}
                    <Link
                      to={`/events/${reg.event.id}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Recent In-App Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              <span>Recent Updates</span>
            </h2>
            <Link to="/notifications" className="text-xs font-bold text-indigo-600 hover:underline">
              Notification Center
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No recent notifications.
              </div>
            ) : (
              notifications.slice(0, 4).map((n) => (
                <Link
                  key={n.id}
                  to={n.link || '/notifications'}
                  className={`p-4 block hover:bg-slate-50 transition-colors text-xs ${
                    !n.isRead ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  <p className="font-bold text-slate-900">{n.title}</p>
                  <p className="text-slate-600 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-600 mt-1.5 block">
                    {new Date(n.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    •{' '}
                    {new Date(n.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

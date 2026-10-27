import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Award,
  Layers,
  Search,
  Filter,
  Check,
  Plus,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'USERS' | 'APPROVALS' | 'AUDIT' | 'CATEGORIES'>('ANALYTICS');

  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Event Approvals State
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedPendingEvent, setSelectedPendingEvent] = useState<any>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Categories State
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Fetch Analytics
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await apiRequest('/admin/analytics');
      setAnalytics(data);
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const query = new URLSearchParams();
      if (userSearch) query.set('search', userSearch);
      if (userRoleFilter) query.set('role', userRoleFilter);
      const data = await apiRequest(`/admin/users?${query.toString()}`);
      setUsers(data.users || []);
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Event Approvals
  const fetchPendingEvents = async () => {
    setLoadingApprovals(true);
    try {
      const data = await apiRequest('/events?status=PENDING_APPROVAL');
      setPendingEvents(data.events || []);
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    } finally {
      setLoadingApprovals(false);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await apiRequest('/admin/audit-logs');
      setAuditLogs(data.logs || []);
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const data = await apiRequest('/events/categories/all');
      setCategories(data || []);
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'ANALYTICS') fetchAnalytics();
    if (activeTab === 'USERS') fetchUsers();
    if (activeTab === 'APPROVALS') fetchPendingEvents();
    if (activeTab === 'AUDIT') fetchAuditLogs();
    if (activeTab === 'CATEGORIES') fetchCategories();
  }, [activeTab]);

  const handleUpdateRole = async (targetUserId: string, newRole: string) => {
    try {
      const res = await apiRequest(`/admin/users/${targetUserId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      showToast('success', 'Role Updated', res.message);
      fetchUsers();
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    }
  };

  const handleToggleSuspend = async (targetUserId: string, currentSuspended: boolean) => {
    try {
      const res = await apiRequest(`/admin/users/${targetUserId}/suspend`, {
        method: 'PATCH',
        body: JSON.stringify({ isSuspended: !currentSuspended }),
      });
      showToast('info', 'Status Changed', res.message);
      fetchUsers();
    } catch (err: any) {
      showToast('error', 'Action Failed', err.message);
    }
  };

  const handleReviewEvent = async (approved: boolean) => {
    if (!selectedPendingEvent) return;
    try {
      const res = await apiRequest(`/events/${selectedPendingEvent.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approved, notes: reviewNotes }),
      });
      showToast(approved ? 'success' : 'info', approved ? 'Approved' : 'Returned to Draft', res.message);
      setSelectedPendingEvent(null);
      setReviewNotes('');
      fetchPendingEvents();
    } catch (err: any) {
      showToast('error', 'Review Failed', err.message);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await apiRequest('/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCatName.trim(), description: newCatDesc.trim() }),
      });
      showToast('success', 'Category Created', `Category "${newCatName}" added.`);
      setNewCatName('');
      setNewCatDesc('');
      fetchCategories();
    } catch (err: any) {
      showToast('error', 'Failed', err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-purple-600 text-xs font-bold uppercase tracking-wider mb-1">
          <Shield className="w-4 h-4" />
          <span>System Administration & Platform Governance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Admin Console
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review event submissions, govern user permissions, track registration trends, and inspect audit logs.
        </p>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto text-xs font-bold">
        {[
          { key: 'ANALYTICS', label: 'Platform Analytics', icon: TrendingUp },
          { key: 'USERS', label: 'User Governance', icon: Users },
          { key: 'APPROVALS', label: 'Event Approvals', icon: Calendar },
          { key: 'CATEGORIES', label: 'Category Settings', icon: Layers },
          { key: 'AUDIT', label: 'Security Audit Logs', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Platform Analytics */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-8">
          {loadingAnalytics ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : analytics ? (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Total Users</span>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {analytics.overview.totalUsers}
                  </p>
                  <span className="text-[11px] text-slate-600 mt-1 block">
                    {analytics.overview.studentCount} students, {analytics.overview.organizerCount} organizers
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Total Events</span>
                  <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
                    {analytics.overview.totalEvents}
                  </p>
                  <span className="text-[11px] text-indigo-700 mt-1 block">
                    {analytics.overview.pendingEvents} pending approvals
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">
                    Confirmed Registrations
                  </span>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                    {analytics.overview.confirmedRegistrations}
                  </p>
                  <span className="text-[11px] text-emerald-700 mt-1 block">
                    {analytics.overview.waitlistedRegistrations} on waitlists
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Attendance Rate</span>
                  <p className="text-2xl sm:text-3xl font-extrabold text-purple-600">
                    {analytics.overview.attendanceRate}%
                  </p>
                  <span className="text-[11px] text-slate-600 mt-1 block">
                    {analytics.overview.totalAttendances} verified check-ins
                  </span>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Registration Trends Chart */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">7-Day Registration Velocity</h3>
                    <p className="text-xs text-slate-500">Daily registration activity across all events</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.registrationTrends}>
                        <defs>
                          <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            color: '#fff',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '12px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="registrations"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#regGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category Popularity Chart */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Category Registration Distribution</h3>
                    <p className="text-xs text-slate-500">Confirmed student participation by discipline</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.categoryStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            color: '#fff',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="registrations" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Tab 2: User Governance */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search user by name, email, or college..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                  setTimeout(fetchUsers, 50);
                }}
                className="p-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="STUDENT">Students</option>
                <option value="ORGANIZER">Organizers</option>
                <option value="ADMIN">Admins</option>
              </select>

              <button
                onClick={fetchUsers}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Filter
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">College / Dept</th>
                  <th className="py-3 px-4">Registrations</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className={`text-xs font-bold rounded-lg border px-2 py-1 bg-white focus:outline-none ${
                          u.role === 'ADMIN'
                            ? 'text-purple-700 border-purple-200'
                            : u.role === 'ORGANIZER'
                            ? 'text-indigo-700 border-indigo-200'
                            : 'text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="ORGANIZER">ORGANIZER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800">{u.profile?.college || 'Imperial College'}</div>
                      <div className="text-[11px] text-slate-500">{u.profile?.department || 'Student'}</div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {u._count.registrations} applied
                    </td>

                    <td className="py-3.5 px-4">
                      {u.isSuspended ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleSuspend(u.id, u.isSuspended)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                          u.isSuspended
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {u.isSuspended ? 'Reactivate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Event Approvals */}
      {activeTab === 'APPROVALS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Event Approval Queue</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Organizers submit draft symposiums and hackathons here for administrative vetting.
              </p>
            </div>

            {loadingApprovals ? (
              <div className="p-8 space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : pendingEvents.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No events currently pending approval</p>
                <p className="mt-1">All organizer submissions have been processed.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingEvents.map((ev) => (
                  <div key={ev.id} className="p-6 flex flex-col md:flex-row items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {ev.category?.name}
                        </span>
                        <StatusBadge status={ev.status} />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{ev.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2">{ev.description}</p>
                      <p className="text-[11px] text-slate-600 pt-1">
                        Organizer: {ev.organizer?.name} ({ev.organizer?.email}) • Capacity: {ev.capacity}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedPendingEvent(ev)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors"
                      >
                        Review Submission
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Category Settings */}
      {activeTab === 'CATEGORIES' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add Technical Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cybersecurity & CTF"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description for badges"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors"
              >
                Create Category
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
            <div className="p-5 font-bold text-slate-900 text-sm">Active Event Categories</div>
            {categories.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{c.name}</p>
                  <p className="text-slate-500 text-[11px]">{c.description || 'No description'}</p>
                </div>
                <span className="font-mono text-[10px] text-slate-400">slug: {c.slug}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Security Audit Logs */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Platform Security Audit Log</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable chronological record of administrative actions, role modifications, and attendance scans.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {log.action}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Target: {log.targetType} ({log.targetId || 'N/A'})
                    </span>
                  </div>
                  {log.details && (
                    <p className="font-mono text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {log.details}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Triggered by: {log.actor ? `${log.actor.name} (${log.actor.email})` : 'System Engine'}
                  </p>
                </div>

                <span className="text-[11px] text-slate-400 font-mono shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Event Modal Dialog */}
      {selectedPendingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                Administrative Event Vetting
              </span>
              <h3 className="text-lg font-bold text-slate-900">{selectedPendingEvent.title}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Organizer: {selectedPendingEvent.organizer?.name} • Capacity: {selectedPendingEvent.capacity}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 text-xs text-slate-700 leading-relaxed border border-slate-200 max-h-40 overflow-y-auto">
              {selectedPendingEvent.description}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Review Feedback / Approval Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="e.g. Approved. Venue assigned to Hall B."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPendingEvent(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleReviewEvent(false)}
                className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs"
              >
                Reject / Draft
              </button>
              <button
                type="button"
                onClick={() => handleReviewEvent(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
              >
                Approve & Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

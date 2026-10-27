import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  Bell,
  User,
  LogOut,
  Calendar,
  Ticket,
  Users,
  Award,
  Shield,
  Layers,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Check,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../lib/api.ts';

export const Navbar: React.FC = () => {
  const { user, logout, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const demoMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on route changes
  useEffect(() => {
    setNotificationsOpen(false);
    setUserMenuOpen(false);
    setDemoMenuOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (demoMenuRef.current && !demoMenuRef.current.contains(e.target as Node)) {
        setDemoMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications if user is logged in
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await apiRequest('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'POST' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'ORGANIZER') return '/organizer';
    return '/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg leading-tight">
                  TechFest<span className="text-indigo-600">Hub</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-600 tracking-widest uppercase">
                  College Tech Events
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
              <Link
                to="/events"
                className={`transition-colors hover:text-indigo-600 flex items-center gap-1.5 ${
                  location.pathname === '/events' ? 'text-indigo-600 font-bold' : ''
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Explore Events</span>
              </Link>

              {user && (
                <Link
                  to={getDashboardLink()}
                  className={`transition-colors hover:text-indigo-600 flex items-center gap-1.5 ${
                    location.pathname.startsWith('/dashboard') ||
                    location.pathname.startsWith('/organizer') ||
                    location.pathname.startsWith('/admin')
                      ? 'text-indigo-600 font-bold'
                      : ''
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>
                    {user.role === 'ADMIN'
                      ? 'Admin Console'
                      : user.role === 'ORGANIZER'
                      ? 'Organizer Hub'
                      : 'My Dashboard'}
                  </span>
                </Link>
              )}

              <a href="/#how-it-works" className="hover:text-indigo-600 transition-colors">
                How It Works
              </a>
            </nav>
          </div>

          {/* Right Action Section */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Switcher */}
            <div className="relative" ref={demoMenuRef}>
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-sm"
                title="Switch demo role instantly"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Demo Accounts</span>
                <ChevronDown className="w-3 h-3 text-indigo-500" />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                    Instant Role Switcher
                  </div>

                  <button
                    onClick={() => {
                      loginAsDemo('STUDENT');
                      setDemoMenuOpen(false);
                      navigate('/dashboard');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-800">Alex Rivera</p>
                      <p className="text-[11px] text-slate-600">Student (CS Undergrad)</p>
                    </div>
                    {user?.role === 'STUDENT' && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>

                  <button
                    onClick={() => {
                      loginAsDemo('ORGANIZER');
                      setDemoMenuOpen(false);
                      navigate('/organizer');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-800">Sarah Chen</p>
                      <p className="text-[11px] text-slate-600">Organizer (ACM Lead)</p>
                    </div>
                    {user?.role === 'ORGANIZER' && <Check className="w-4 h-4 text-indigo-600" />}
                  </button>

                  <button
                    onClick={() => {
                      loginAsDemo('ADMIN');
                      setDemoMenuOpen(false);
                      navigate('/admin');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-800">Dr. Eleanor Vance</p>
                      <p className="text-[11px] text-slate-600">College Platform Admin</p>
                    </div>
                    {user?.role === 'ADMIN' && <Check className="w-4 h-4 text-purple-600" />}
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell (Authenticated only) */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-600">
                          No notifications yet. You're all caught up!
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <Link
                            key={n.id}
                            to={n.link || '/notifications'}
                            onClick={() => setNotificationsOpen(false)}
                            className={`p-3.5 block hover:bg-slate-50 transition-colors text-xs ${
                              !n.isRead ? 'bg-indigo-50/40' : ''
                            }`}
                          >
                            <p className="font-bold text-slate-900">{n.title}</p>
                            <p className="text-slate-600 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-600 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </Link>
                        ))
                      )}
                    </div>

                    <div className="p-2 border-t border-slate-100 text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        View All Notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Authenticated User Menu OR Login / Get Started */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <img
                    src={
                      user.avatarUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`
                    }
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-300"
                  />
                  <span className="hidden lg:inline text-xs font-bold text-slate-800 max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="font-bold text-slate-900 text-sm truncate">{user.name}</p>
                      <p className="text-slate-600 font-mono text-[11px] truncate">{user.email}</p>
                      <div className="mt-1.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : user.role === 'ORGANIZER'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {user.role} Role
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to={getDashboardLink()}
                        className="px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 font-medium text-slate-700"
                      >
                        <Layers className="w-4 h-4 text-slate-600" />
                        <span>Dashboard</span>
                      </Link>

                      <Link
                        to="/registrations"
                        className="px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 font-medium text-slate-700"
                      >
                        <Calendar className="w-4 h-4 text-slate-600" />
                        <span>My Registrations</span>
                      </Link>

                      <Link
                        to="/teams"
                        className="px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 font-medium text-slate-700"
                      >
                        <Users className="w-4 h-4 text-slate-600" />
                        <span>My Teams</span>
                      </Link>

                      <Link
                        to="/tickets"
                        className="px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 font-medium text-slate-700"
                      >
                        <Ticket className="w-4 h-4 text-slate-600" />
                        <span>Digital Tickets</span>
                      </Link>

                      <Link
                        to="/certificates"
                        className="px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 font-medium text-slate-700"
                      >
                        <Award className="w-4 h-4 text-slate-600" />
                        <span>Certificates</span>
                      </Link>

                      {user.role === 'ORGANIZER' && (
                        <Link
                          to="/organizer/check-in"
                          className="px-4 py-2 hover:bg-indigo-50 flex items-center gap-2.5 font-bold text-indigo-700"
                        >
                          <Ticket className="w-4 h-4 text-indigo-600" />
                          <span>QR Check-in Terminal</span>
                        </Link>
                      )}

                      {user.role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          className="px-4 py-2 hover:bg-purple-50 flex items-center gap-2.5 font-bold text-purple-700"
                        >
                          <Shield className="w-4 h-4 text-purple-600" />
                          <span>Admin Console</span>
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        className="px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 font-medium text-slate-700"
                      >
                        <User className="w-4 h-4 text-slate-600" />
                        <span>Profile & Settings</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={logout}
                        className="w-full px-4 py-2 hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2.5"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 text-sm font-semibold">
          <Link
            to="/events"
            className="block py-2 text-slate-700 hover:text-indigo-600"
            onClick={() => setMobileMenuOpen(false)}
          >
            Explore Events
          </Link>
          {user && (
            <>
              <Link
                to={getDashboardLink()}
                className="block py-2 text-slate-700 hover:text-indigo-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/registrations"
                className="block py-2 text-slate-700 hover:text-indigo-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Registrations
              </Link>
              <Link
                to="/teams"
                className="block py-2 text-slate-700 hover:text-indigo-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Teams
              </Link>
              <Link
                to="/tickets"
                className="block py-2 text-slate-700 hover:text-indigo-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Digital Tickets
              </Link>
              <Link
                to="/certificates"
                className="block py-2 text-slate-700 hover:text-indigo-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Certificates
              </Link>
            </>
          )}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <p className="text-xs font-bold text-slate-600 uppercase">Quick Demo Login</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => {
                  loginAsDemo('STUDENT');
                  setMobileMenuOpen(false);
                }}
                className="py-1.5 px-2 bg-slate-100 hover:bg-indigo-50 text-indigo-700 rounded-lg font-bold"
              >
                Student
              </button>
              <button
                onClick={() => {
                  loginAsDemo('ORGANIZER');
                  setMobileMenuOpen(false);
                }}
                className="py-1.5 px-2 bg-slate-100 hover:bg-indigo-50 text-indigo-700 rounded-lg font-bold"
              >
                Organizer
              </button>
              <button
                onClick={() => {
                  loginAsDemo('ADMIN');
                  setMobileMenuOpen(false);
                }}
                className="py-1.5 px-2 bg-slate-100 hover:bg-purple-50 text-purple-700 rounded-lg font-bold"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

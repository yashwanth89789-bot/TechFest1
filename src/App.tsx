import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';

// Public Pages
import { LandingPage } from './pages/LandingPage.tsx';
import { EventsPage } from './pages/EventsPage.tsx';
import { EventDetailsPage } from './pages/EventDetailsPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx';
import { ResetPasswordPage } from './pages/ResetPasswordPage.tsx';
import { PublicCertificateVerifyPage } from './pages/PublicCertificateVerifyPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';

// Student Pages
import { DashboardPage } from './pages/student/DashboardPage.tsx';
import { RegistrationsPage } from './pages/student/RegistrationsPage.tsx';
import { TeamsPage } from './pages/student/TeamsPage.tsx';
import { TicketsPage } from './pages/student/TicketsPage.tsx';
import { CertificatesPage } from './pages/student/CertificatesPage.tsx';
import { NotificationsPage } from './pages/student/NotificationsPage.tsx';
import { ProfilePage } from './pages/student/ProfilePage.tsx';

// Organizer Pages
import { OrganizerDashboardPage } from './pages/organizer/OrganizerDashboardPage.tsx';
import { CreateEditEventPage } from './pages/organizer/CreateEditEventPage.tsx';
import { EventParticipantsPage } from './pages/organizer/EventParticipantsPage.tsx';
import { CheckInPage } from './pages/organizer/CheckInPage.tsx';

// Admin Page
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.tsx';

// Protected Route Guard
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: Array<'STUDENT' | 'ORGANIZER' | 'ADMIN'>;
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Your current account role (<strong>{user.role}</strong>) does not have permission to view this portal.
        </p>
        <Navigate to="/dashboard" replace />
      </div>
    );
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventDetailsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-certificate" element={<PublicCertificateVerifyPage />} />

                {/* Student Protected */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/registrations"
                  element={
                    <ProtectedRoute>
                      <RegistrationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teams"
                  element={
                    <ProtectedRoute>
                      <TeamsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tickets"
                  element={
                    <ProtectedRoute>
                      <TicketsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/certificates"
                  element={
                    <ProtectedRoute>
                      <CertificatesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Organizer Protected */}
                <Route
                  path="/organizer"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <OrganizerDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organizer/events/new"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <CreateEditEventPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organizer/events/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <CreateEditEventPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organizer/events/:id/participants"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <EventParticipantsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organizer/check-in"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <CheckInPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Protected */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/auth/ProtectedRoute';
import AdminRoute from '@/auth/AdminRoute';

// Lazy-loaded page components
const LoginPage = React.lazy(() => import('@/pages/LoginPage'));
const RegisterPage = React.lazy(() => import('@/pages/RegisterPage'));
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));
const ProfilePage = React.lazy(() => import('@/pages/ProfilePage'));
const ProfileSetupPage = React.lazy(() => import('@/pages/ProfileSetupPage'));
const CreateCardPage = React.lazy(() => import('@/pages/CreateCardPage'));
const EventsPage = React.lazy(() => import('@/pages/EventsPage'));
const EventDetailPage = React.lazy(() => import('@/pages/EventDetailPage'));
const EventActivePage = React.lazy(() => import('@/pages/EventActivePage'));
const EventOrganizerPage = React.lazy(() => import('@/pages/EventOrganizerPage'));
const EventCheckInPage = React.lazy(() => import('@/pages/EventCheckInPage'));
const MatchesPage = React.lazy(() => import('@/pages/MatchesPage'));
const ScanCardPage = React.lazy(() => import('@/pages/ScanCardPage'));
const ScanLandingPage = React.lazy(() => import('@/pages/ScanLandingPage'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage'));
const OrganizationsPage = React.lazy(() => import('@/pages/OrganizationsPage'));
const OrganizationDetailPage = React.lazy(() => import('@/pages/OrganizationDetailPage'));
const ConnectionsPage = React.lazy(() => import('@/pages/ConnectionsPage'));
const ConnectionDetailPage = React.lazy(() => import('@/pages/ConnectionDetailPage'));
const QRCodePage = React.lazy(() => import('@/pages/QRCodePage'));
const ScanQRPage = React.lazy(() => import('@/pages/ScanQRPage'));
const RecommendationsPage = React.lazy(() => import('@/pages/RecommendationsPage'));
const MatchDetailPage = React.lazy(() => import('@/pages/MatchDetailPage'));
const SchedulePage = React.lazy(() => import('@/pages/SchedulePage'));
const ExhibitorsPage = React.lazy(() => import('@/pages/ExhibitorsPage'));
const ExhibitorDetailPage = React.lazy(() => import('@/pages/ExhibitorDetailPage'));
const AnalyticsPage = React.lazy(() => import('@/pages/AnalyticsPage'));
const MessagesPage = React.lazy(() => import('@/pages/MessagesPage'));
const TimelinePage = React.lazy(() => import('@/pages/TimelinePage'));
const CardWalletPage = React.lazy(() => import('@/pages/CardWalletPage'));
const SearchPage = React.lazy(() => import('@/pages/SearchPage'));
const PublicProfilePage = React.lazy(() => import('@/pages/PublicProfilePage'));
const InsightsPage = React.lazy(() => import('@/pages/InsightsPage'));
const HeatmapPage = React.lazy(() => import('@/pages/HeatmapPage'));
const MyCardsPage = React.lazy(() => import('@/pages/MyCardsPage'));
const PublicCardPage = React.lazy(() => import('@/pages/PublicCardPage'));

// Admin pages
const AdminDashboardPage = React.lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminUsersPage = React.lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminUserDetailPage = React.lazy(() => import('@/pages/admin/AdminUserDetailPage'));
const AdminEventsPage = React.lazy(() => import('@/pages/admin/AdminEventsPage'));
const AdminAnalyticsPage = React.lazy(() => import('@/pages/admin/AdminAnalyticsPage'));
const AdminOrganizerRequestsPage = React.lazy(() => import('@/pages/admin/AdminOrganizerRequestsPage'));

// Admin layout
const AdminLayout = React.lazy(() => import('@/components/admin/AdminLayout'));

// Placeholder Layout component (to be created later)
const Layout = React.lazy(() => import('@/components/Layout'));

const RoutesTree: React.FC = () => {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/scan" element={<ScanLandingPage />} />
        <Route path="/card/:id" element={<PublicCardPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<PublicProfilePage />} />
            <Route path="/profile/setup" element={<ProfileSetupPage />} />
            <Route path="/my-cards" element={<MyCardsPage />} />
            <Route path="/cards/new" element={<CreateCardPage />} />
            <Route path="/cards/:id/edit" element={<CreateCardPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/events/:id/active" element={<EventActivePage />} />
            <Route path="/events/:id/organizer" element={<EventOrganizerPage />} />
            <Route path="/events/:id/check-in" element={<EventCheckInPage />} />
            <Route path="/events/:id/matches" element={<MatchesPage />} />
            <Route path="/events/:eventId/recommendations" element={<RecommendationsPage />} />
            <Route path="/events/:eventId/recommendations/why/:targetUserId" element={<MatchDetailPage />} />
            <Route path="/cards/scan" element={<ScanCardPage />} />
            <Route path="/organizations" element={<OrganizationsPage />} />
            <Route path="/organizations/:id" element={<OrganizationDetailPage />} />
            <Route path="/connections" element={<ConnectionsPage />} />
            <Route path="/connections/:id" element={<ConnectionDetailPage />} />
            <Route path="/qr" element={<QRCodePage />} />
            <Route path="/scan/qr" element={<ScanQRPage />} />
            <Route path="/events/:eventId/schedule" element={<SchedulePage />} />
            <Route path="/events/:eventId/exhibitors" element={<ExhibitorsPage />} />
            <Route path="/events/:eventId/exhibitors/:id" element={<ExhibitorDetailPage />} />
            <Route path="/events/:eventId/analytics" element={<AnalyticsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/wallet" element={<CardWalletPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/events/:eventId/heatmap" element={<HeatmapPage />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/users/:userId" element={<AdminUserDetailPage />} />
              <Route path="/admin/events" element={<AdminEventsPage />} />
              <Route path="/admin/organizer-requests" element={<AdminOrganizerRequestsPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </React.Suspense>
  );
};

export default RoutesTree;

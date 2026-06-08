import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { Layout1 } from '@/components/layouts/layout-1';
import { ProtectedRoute } from '@/auth/protected-route';

const LoginPage = lazy(() => import('@/pages/auth/login'));
const RegisterPage = lazy(() => import('@/pages/auth/register'));
const PrivacyPolicyPage = lazy(() => import('@/pages/legal/privacy-policy'));
const TermsOfServicePage = lazy(() => import('@/pages/legal/terms-of-service'));
const DashboardPage = lazy(() => import('@/pages/dashboard/page'));
const AccountsPage = lazy(() => import('@/pages/accounts/page'));
const PostsPage = lazy(() => import('@/pages/posts/page'));
const CalendarPage = lazy(() => import('@/pages/calendar/page'));
const AiCaptionPage = lazy(() => import('@/pages/ai-caption/page'));
const PlansPage = lazy(() => import('@/pages/plans/page'));
const SubscriptionPage = lazy(() => import('@/pages/subscription/page'));
const SettingsPage = lazy(() => import('@/pages/settings/page'));
const AnalyticsPage = lazy(() => import('@/pages/analytics/page'));
const InboxPage = lazy(() => import('@/pages/inbox/page'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

export function AppRoutingSetup() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/auth/login" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
      <Route path="/auth/register" element={<Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>} />
      <Route path="/legal/privacy-policy" element={<Suspense fallback={<PageLoader />}><PrivacyPolicyPage /></Suspense>} />
      <Route path="/legal/terms-of-service" element={<Suspense fallback={<PageLoader />}><TermsOfServicePage /></Suspense>} />

      {/* App — protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout1 />}>
          <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
          <Route path="/accounts" element={<Suspense fallback={<PageLoader />}><AccountsPage /></Suspense>} />
          <Route path="/posts" element={<Suspense fallback={<PageLoader />}><PostsPage /></Suspense>} />
          <Route path="/calendar" element={<Suspense fallback={<PageLoader />}><CalendarPage /></Suspense>} />
          <Route path="/ai-caption" element={<Suspense fallback={<PageLoader />}><AiCaptionPage /></Suspense>} />
          <Route path="/plans" element={<Suspense fallback={<PageLoader />}><PlansPage /></Suspense>} />
          <Route path="/subscription" element={<Suspense fallback={<PageLoader />}><SubscriptionPage /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
          <Route path="/analytics" element={<Suspense fallback={<PageLoader />}><AnalyticsPage /></Suspense>} />
          <Route path="/inbox" element={<Suspense fallback={<PageLoader />}><InboxPage /></Suspense>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}

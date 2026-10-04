import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loading } from "@/components/common";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import HomePage from "@/pages/HomePage";
import TutorsPage from "@/pages/TutorsPage";
import TutorProfilePage from "@/pages/TutorProfilePage";
import { LoginPage, RegisterPage } from "@/pages/AuthPages";
import {
  AboutPage,
  ContactPage,
  FAQsPage,
  HowItWorksPage,
  NotFoundPage,
  PrivacyPage,
  SubjectsPage,
  TermsPage,
} from "@/pages/InfoPages";

// Signed-in areas load on demand so visitors only download the public pages.
const DashboardLayout = lazy(() => import("@/components/layouts/DashboardLayout"));
const MessagesPage = lazy(() => import("@/pages/MessagesPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const LessonRoomPage = lazy(() => import("@/pages/LessonRoomPage"));
const VerificationPage = lazy(() => import("@/pages/tutor/VerificationPage"));
const StudentDashboard = lazy(() => import("@/pages/student/StudentPages").then((m) => ({ default: m.StudentDashboard })));
const StudentBookingsPage = lazy(() => import("@/pages/student/StudentPages").then((m) => ({ default: m.StudentBookingsPage })));
const TutorDashboard = lazy(() => import("@/pages/tutor/TutorPages").then((m) => ({ default: m.TutorDashboard })));
const TutorBookingsPage = lazy(() => import("@/pages/tutor/TutorPages").then((m) => ({ default: m.TutorBookingsPage })));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminPages").then((m) => ({ default: m.AdminDashboard })));
const AdminInbox = lazy(() => import("@/pages/admin/AdminPages").then((m) => ({ default: m.AdminInbox })));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 } },
});

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster position="top-center" richColors />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<Loading className="h-screen" />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/tutors" element={<TutorsPage />} />
                <Route path="/tutors/:id" element={<TutorProfilePage />} />
                <Route path="/subjects" element={<SubjectsPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/faqs" element={<FAQsPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/ask-question" element={<Navigate to="/contact" replace />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<Navigate to="/register/student" replace />} />
                <Route path="/register/student" element={<RegisterPage role="student" />} />
                <Route path="/register/tutor" element={<RegisterPage role="tutor" />} />

                <Route
                  path="/student"
                  element={
                    <ProtectedRoute roles={["student"]}>
                      <DashboardLayout role="student" />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<StudentDashboard />} />
                  <Route path="bookings" element={<StudentBookingsPage />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>

                <Route
                  path="/tutor"
                  element={
                    <ProtectedRoute roles={["tutor"]}>
                      <DashboardLayout role="tutor" />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<TutorDashboard />} />
                  <Route path="bookings" element={<TutorBookingsPage />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="verification" element={<VerificationPage />} />
                  <Route path="test" element={<Navigate to="/tutor/verification" replace />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>

                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute roles={["admin"]}>
                      <DashboardLayout role="admin" />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="inbox" element={<AdminInbox />} />
                </Route>

                <Route
                  path="/lesson/:bookingId"
                  element={
                    <ProtectedRoute roles={["student", "tutor"]}>
                      <LessonRoomPage />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

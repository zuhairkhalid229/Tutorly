import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterStudentPage from "./pages/RegisterStudentPage";
import RegisterTutorPage from "./pages/RegisterTutorPage";
import StudentDashboard from "./pages/student/Dashboard";
import TutorDashboard from "./pages/tutor/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import TutorsPage from "./pages/TutorsPage";
import TutorProfilePage from "./pages/TutorProfilePage";
import StudentProfilePage from "./pages/student/ProfilePage";
import StudentBookingsPage from "./pages/student/BookingsPage";
import TutorBookingsPage from "./pages/tutor/BookingsPage";
import MessagesPage from "./pages/MessagesPage";
import NotFound from "./pages/NotFound";
import FAQsPage from "./pages/FAQsPage";
import ContactPage from "./pages/ContactPage";
import AskQuestionPage from "./pages/AskQuestionPage";
import AboutPage from "./pages/AboutPage";
import SubjectsPage from "./pages/SubjectsPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import AITestPage from "./pages/tutor/AITestPage";
import LessonRoomPage from "./pages/LessonRoomPage";

// Layouts and Protected Routes
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/layouts/DashboardLayout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register/student" element={<RegisterStudentPage />} />
              <Route path="/register/tutor" element={<RegisterTutorPage />} />
              <Route path="/tutors" element={<TutorsPage />} />
              <Route path="/tutor/:id" element={<TutorProfilePage />} />
              <Route path="/faqs" element={<FAQsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/ask-question" element={<AskQuestionPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/subjects" element={<SubjectsPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              
              {/* Protected Student Routes */}
              <Route path="/student" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <DashboardLayout userType="student" />
                </ProtectedRoute>
              }>
                <Route index element={<StudentDashboard />} />
                <Route path="profile" element={<StudentProfilePage />} />
                <Route path="bookings" element={<StudentBookingsPage />} />
                <Route path="messages" element={<MessagesPage userType="student" />} />
              </Route>
              
              {/* Protected Tutor Routes */}
              <Route path="/tutor" element={
                <ProtectedRoute allowedRoles={['tutor']}>
                  <DashboardLayout userType="tutor" />
                </ProtectedRoute>
              }>
                <Route index element={<TutorDashboard />} />
                <Route path="profile" element={<TutorProfilePage isOwnProfile={true} />} />
                <Route path="bookings" element={<TutorBookingsPage />} />
                <Route path="messages" element={<MessagesPage userType="tutor" />} />
                <Route path="test" element={<AITestPage />} />
              </Route>
              
              {/* Protected Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout userType="admin" />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
              </Route>
              
              {/* Add the new lesson room route */}
              <Route 
                path="/lesson/:bookingId" 
                element={
                  <ProtectedRoute>
                    <LessonRoomPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch-all Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

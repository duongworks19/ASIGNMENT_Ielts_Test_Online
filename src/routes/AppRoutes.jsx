import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

import Home from '../pages/guest/Home';
import Login from '../pages/guest/Login';
import Register from '../pages/guest/Register';
import VerifyEmail from '../pages/guest/VerifyEmail';
import ForgotPassword from '../pages/guest/ForgotPassword';
import ResetPassword from '../pages/guest/ResetPassword';
import AccessDenied from '../pages/guest/AccessDenied';
import CourseList from '../pages/guest/CourseList';
import CourseDetail from '../pages/guest/CourseDetail';
import OnlineCourses from '../pages/guest/OnlineCourses';
import ResourceDetail from '../pages/guest/ResourceDetail';
import SkillPractice from '../pages/guest/SkillPractice';
import Checkout from '../pages/guest/Checkout';
import CartCheckout from '../pages/guest/CartCheckout';
import PaymentResult from '../pages/guest/PaymentResult';
import WishlistPage from '../pages/guest/WishlistPage';

import StudentDashboard from '../pages/student/DashboardPage';
import StudentHomePage from '../pages/student/StudentHomePage';
import MyCoursesPage from '../pages/student/MyCoursesPage';
import CourseListPage from '../pages/student/CourseListPage';
import CourseDetailPage from '../pages/student/CourseDetailPage';
import LessonPage from '../pages/student/LessonPage';
import LearningHistoryPage from '../pages/student/LearningHistoryPage';
import TestListPage from '../pages/student/TestListPage';
import TestDetailPage from '../pages/student/TestDetailPage';
import TestSessionPage from '../pages/student/TestSessionPage';
import TestReviewPage from '../pages/student/TestReviewPage';
import StudentProfile from '../pages/student/Profile';
import FlashcardListPage from '../pages/student/FlashcardListPage';
import FlashcardStudyPage from '../pages/student/FlashcardStudyPage';
import ExamLibraryPage from '../pages/student/ExamLibraryPage';
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import TeacherCourseManagement from '../pages/teacher/CourseManagement';
import CourseCreatePage from '../pages/teacher/CourseCreatePage';
import CourseEditPage from '../pages/teacher/CourseEditPage';
import LessonListPage from '../pages/teacher/LessonListPage';
import CourseDetailBuilder from '../pages/teacher/CourseDetailBuilder';
import LessonCreatePage from '../pages/teacher/LessonCreatePage';
import TeacherTestListPage from '../pages/teacher/TestListPage';
import TestCreatePage from '../pages/teacher/TestCreatePage';
import StudentTrackingPage from '../pages/teacher/StudentTrackingPage';
import QuestionBankPage from '../pages/teacher/QuestionBankPage';
import FlashcardManagementPage from '../pages/teacher/FlashcardManagementPage';
import FlashcardDeckDetail from '../pages/teacher/FlashcardDeckDetail';
import MarkingQueuePage from '../pages/teacher/MarkingQueuePage';
import MarkingHistoryPage from '../pages/teacher/MarkingHistoryPage';
import LibraryResourceListPage from '../pages/teacher/LibraryResourceListPage';
import LibraryResourceCreatePage from '../pages/teacher/LibraryResourceCreatePage';
import LibraryResourceEditPage from '../pages/teacher/LibraryResourceEditPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/UserManagement';
import AdminCourseManagement from '../pages/admin/CourseManagement';
import LessonManagement from '../pages/admin/LessonManagement';
import TestManagement from '../pages/admin/TestManagement';
import AuditLogs from '../pages/admin/AuditLogs';
import AdminFlashcardManagement from '../pages/admin/FlashcardManagement';
import TransactionList from '../pages/admin/TransactionList';
import RevenueStatistics from '../pages/admin/RevenueStatistics';
import MainLayout from '../layouts/MainLayout';
import StudentLayout from '../layouts/StudentLayout';
import TeacherLayout from '../layouts/TeacherLayout';
import AdminLayout from '../layouts/AdminLayout';

const ProfileRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/admin/profile" replace />;
  if (user?.role === 'teacher') return <Navigate to="/teacher/profile" replace />;
  return <Navigate to="/learning/profile" replace />;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']} />}>
        <Route path="/profile" element={<ProfileRedirect />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/403" element={<AccessDenied />} />
        <Route path="/courses" element={<CourseList />} />
        <Route path="/resources/:id" element={<ResourceDetail />} />
        <Route path="/skills" element={<SkillPractice />} />
        <Route path="/online-courses" element={<OnlineCourses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/checkout/:id" element={<Checkout />} />
        <Route path="/checkout" element={<CartCheckout />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/free-tests/:id" element={<TestDetailPage />} />
        <Route path="/free-tests/attempt/:attemptId" element={<TestSessionPage />} />
        <Route path="/free-tests/review/:attemptId" element={<TestReviewPage />} />
        <Route element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']} />}>
          <Route path="/profile" element={<ProfileRedirect />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/payment/success" element={<PaymentResult />} />
          <Route path="/payment/cancel" element={<PaymentResult cancelled />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<StudentLayout />}>
          <Route path="/learning" element={<StudentHomePage />} />
          <Route path="/learning/dashboard" element={<StudentDashboard />} />
          <Route path="/learning/courses" element={<CourseListPage />} />
          <Route path="/learning/my-courses" element={<MyCoursesPage />} />
          <Route path="/learning/history" element={<LearningHistoryPage />} />
          <Route path="/learning/courses/:id" element={<CourseDetailPage />} />
          <Route path="/learning/courses/:courseId/lessons" element={<LessonPage />} />
          <Route path="/learning/courses/:courseId/lessons/:lessonId" element={<LessonPage />} />
          <Route path="/learning/tests" element={<TestListPage />} />
          <Route path="/learning/exam-library" element={<ExamLibraryPage />} />
          <Route path="/learning/tests/:id" element={<TestDetailPage />} />
          <Route path="/learning/tests/attempt/:attemptId" element={<TestSessionPage />} />
          <Route path="/learning/tests/review/:attemptId" element={<TestReviewPage />} />
          <Route path="/learning/profile" element={<Navigate to="/profile" replace />} />
          <Route path="/learning/flashcards" element={<FlashcardListPage />} />
        </Route>
      </Route>

      {/* Flashcard Study Page (Accessible by Student, Teacher, and Admin for Preview/Learning) */}
      <Route element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']} />}>
        <Route element={<StudentLayout />}>
          <Route path="/learning/flashcards/:deckId" element={<FlashcardStudyPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
        <Route element={<TeacherLayout />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/courses" element={<TeacherCourseManagement />} />
          <Route path="/teacher/courses/create" element={<CourseCreatePage />} />
          <Route path="/teacher/courses/:id" element={<CourseDetailBuilder />} />
          <Route path="/teacher/courses/:id/edit" element={<CourseEditPage />} />
          <Route path="/teacher/lessons" element={<LessonListPage />} />
          <Route path="/teacher/lessons/create" element={<LessonCreatePage />} />
          <Route path="/teacher/lessons/:id/edit" element={<LessonCreatePage />} />
          <Route path="/teacher/tests" element={<TeacherTestListPage />} />
          <Route path="/teacher/tests/create" element={<TestCreatePage />} />
          <Route path="/teacher/tests/:id/edit" element={<TestCreatePage />} />
          <Route path="/teacher/tests/:id/questions" element={<QuestionBankPage />} />
          <Route path="/teacher/students" element={<StudentTrackingPage />} />
          <Route path="/teacher/questions" element={<QuestionBankPage />} />
          <Route path="/teacher/flashcards" element={<FlashcardManagementPage />} />
          <Route path="/teacher/flashcards/:deckId" element={<FlashcardDeckDetail />} />
          <Route path="/teacher/marking-queue" element={<MarkingQueuePage />} />
          <Route path="/teacher/marking-history" element={<MarkingHistoryPage />} />
          <Route path="/teacher/library" element={<LibraryResourceListPage />} />
          <Route path="/teacher/library/create" element={<LibraryResourceCreatePage />} />
          <Route path="/teacher/library/edit/:id" element={<LibraryResourceEditPage />} />
          <Route path="/teacher/profile" element={<StudentProfile />} />
        </Route>
      </Route>

      {/* ===== ADMIN ROUTES ===== */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/audit-logs" element={<AuditLogs />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/courses" element={<AdminCourseManagement />} />
          <Route path="/admin/lessons" element={<LessonManagement />} />
          <Route path="/admin/tests" element={<TestManagement />} />
          <Route path="/admin/flashcards" element={<AdminFlashcardManagement />} />
          <Route path="/admin/transactions" element={<TransactionList />} />
          <Route path="/admin/revenue" element={<RevenueStatistics />} />
          <Route path="/admin/profile" element={<StudentProfile />} />
        </Route>
      </Route>
    </Routes>
  );
}

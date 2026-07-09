import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Mock component imports to make the app runnable
import ScrollToTop from './utils/ScrollToTop';
import Header from './components/Header';
import Hero from './components/Hero';
import Courses from './components/Courses';
import Skills from './components/Skills';
import Reviews from './components/Reviews';
import Contact from './components/Contact';
import Footer from './components/Footer';
import CourseDetail from './components/CourseDetail';
import ApplicationForm from './components/ApplicationForm';
import WebinarPortal from './components/WebinarPortal';
import GalleryPage from './components/GalleryPage';
import AdminPanel from './components/AdminPanel';
import PaymentPage from './components/PaymentPage';
import BlogPage from './components/BlogPage';
import BlogPostDetail from './components/BlogPostDetail';

// CRM Imports
import { MobileNavigation } from './components/layout/MobileNavigation';
import { Sidebar } from './components/layout/Sidebar';
import CrmLogin from './pages/crm/Login';
import LeadPipeline from './pages/crm/LeadPipeline';
import LeadCapture from './pages/crm/LeadCapture';
import LeadDetail from './pages/crm/LeadDetail';
import SalesList from './pages/crm/SalesList';
import AsanaTaskApp from './components/crm/tasks/AsanaTaskApp';
import ChatPortal from './pages/crm/ChatPortal';
import Profile from './pages/crm/Profile';
import SalesDashboard from './pages/crm/SalesDashboard';
import SalesPitchPage from './pages/crm/SalesPitchPage';

// Manager Imports
import ManagerDashboard from './pages/crm/manager/ManagerDashboard';
import ApprovalDetail from './pages/crm/manager/ApprovalDetail';
import OnboardingFlow from './pages/crm/manager/OnboardingFlow';
import UserManagement from './pages/crm/manager/UserManagement';
import GamificationSettings from './pages/crm/manager/GamificationSettings';

import TimetableManager from './pages/crm/manager/TimetableManager';

// Admin & Student Imports
import AdminDashboard from './pages/admin/AdminDashboard';
import LiveStreamDashboard from './pages/teacher/LiveStreamDashboard';
import AttendanceSystem from './pages/teacher/AttendanceSystem';
import StudentPortal from './pages/student/StudentPortal';
import CourseManagement from './pages/shared/CourseManagement';
import ModuleEditor from './pages/shared/ModuleEditor';
import ClassEditor from './pages/shared/ClassEditor';
import CareerCenter from './pages/student/CareerCenter';
import ReferralCenter from './pages/student/ReferralCenter';
import ClassFlow from './pages/student/ClassFlow';
import ModuleMap from './pages/student/ModuleMap';
import MockInterview from './pages/student/MockInterview';
import AttendancePage from './pages/student/AttendancePage';
import Leaderboard from './pages/student/Leaderboard';
import StudentLayout from './components/layout/StudentLayout';

// DM Imports
import DMDashboard from './pages/crm/dm/DMDashboard';
import ContentPlanner from './pages/crm/dm/ContentPlanner';

// CEO Imports
import CEODashboard from './pages/crm/ceo/CEODashboard';
import CEOSettings from './pages/crm/ceo/CEOSettings';
import AIVoiceSettings from './pages/crm/ceo/AIVoiceSettings';

// Teacher Imports
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherCMS from './pages/teacher/TeacherCMS';
import PresentationView from './pages/teacher/PresentationView';
import TeacherTimetable from './pages/teacher/TeacherTimetable';

// Security Imports
import { RequireAuth } from './components/layout/RequireAuth';

const CRMLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="h-screen bg-erp-background font-sans selection:bg-erp-primary/30 flex flex-col md:flex-row overflow-hidden">
    {/* Desktop Sidebar */}
    <div className="hidden md:block w-64 flex-shrink-0 border-r-2 border-erp-border bg-erp-surface">
      <Sidebar />
    </div>
    
    {/* Main Content Area */}
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
      {children}
    </div>

    {/* Mobile Bottom Navigation */}
    <div className="md:hidden flex-shrink-0">
      <MobileNavigation />
    </div>
  </div>
);

const HomePage = () => (
  <>
    <Hero />
    <Courses />
    <Skills />
    <Reviews />
    <Contact />
  </>
);

const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-primary-900">
    <Header />
    {children}
    <Footer />
  </div>
);

// RBAC Layout Wrappers
const SalesLayout = ({ children }: { children: React.ReactNode }) => (
  <RequireAuth allowedRoles={['Sales/HR', 'Manager', 'CEO']}>
    <CRMLayout>{children}</CRMLayout>
  </RequireAuth>
);

const ManagerLayout = ({ children }: { children: React.ReactNode }) => (
  <RequireAuth allowedRoles={['Manager', 'CEO']}>
    <CRMLayout>{children}</CRMLayout>
  </RequireAuth>
);

const DMLayout = ({ children }: { children: React.ReactNode }) => (
  <RequireAuth allowedRoles={['DM', 'Manager', 'CEO']}>
    <CRMLayout>{children}</CRMLayout>
  </RequireAuth>
);

const CEOLayout = ({ children }: { children: React.ReactNode }) => (
  <RequireAuth allowedRoles={['CEO']}>
    <CRMLayout>{children}</CRMLayout>
  </RequireAuth>
);

const StudentLayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <RequireAuth allowedRoles={['Student']}>
    <StudentLayout>{children}</StudentLayout>
  </RequireAuth>
);

const TeacherLayout = ({ children }: { children: React.ReactNode }) => (
  <RequireAuth allowedRoles={['Teacher', 'Manager', 'CEO']}>
    <CRMLayout>{children}</CRMLayout>
  </RequireAuth>
);

const SharedLayout = ({ children }: { children: React.ReactNode }) => (
  <RequireAuth>
    <CRMLayout>{children}</CRMLayout>
  </RequireAuth>
);

function App() {
  React.useEffect(() => {
    const setupDB = async () => {
      const { initTursoDB, seedCRMData } = await import('./lib/turso');
      await initTursoDB();
      await seedCRMData();
    };
    setupDB();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
        <Route path="/course/:courseId" element={<MainLayout><CourseDetail /></MainLayout>} />
        <Route path="/apply/:courseId" element={<MainLayout><ApplicationForm /></MainLayout>} />
        <Route path="/webinar" element={<MainLayout><WebinarPortal /></MainLayout>} />
        <Route path="/gallery" element={<MainLayout><GalleryPage /></MainLayout>} />
        <Route path="/admin" element={<RequireAuth allowedRoles={['Admin', 'CEO']}><MainLayout><AdminPanel /></MainLayout></RequireAuth>} />
        <Route path="/pay" element={<MainLayout><PaymentPage /></MainLayout>} />
        <Route path="/blog" element={<MainLayout><BlogPage /></MainLayout>} />
        <Route path="/blog/:id" element={<MainLayout><BlogPostDetail /></MainLayout>} />
        <Route path="/sales/pitch" element={<SalesLayout><SalesPitchPage /></SalesLayout>} />
        <Route path="/sales/pipeline" element={<SalesLayout><LeadPipeline /></SalesLayout>} />
        <Route path="/sales/leads/new" element={<SalesLayout><LeadCapture /></SalesLayout>} />
        <Route path="/sales/leads/:id" element={<SalesLayout><LeadDetail /></SalesLayout>} />
        <Route path="/sales/history" element={<SalesLayout><SalesList /></SalesLayout>} />
        <Route path="/crm/leads/new" element={<Navigate to="/sales/leads/new" replace />} />
        <Route path="/crm/leads" element={<Navigate to="/sales/pipeline" replace />} />
        
        {/* ERP Routes */}
        <Route path="/login" element={<CrmLogin />} />
        
        {/* Sales / HR Routes */}
        <Route path="/sales/dashboard" element={<SalesLayout><SalesDashboard /></SalesLayout>} />
        <Route path="/sales/tasks" element={<SalesLayout><AsanaTaskApp /></SalesLayout>} />
        
        {/* Shared Routes */}
        <Route path="/profile" element={<SharedLayout><Profile /></SharedLayout>} />
        <Route path="/chat" element={<SharedLayout><ChatPortal /></SharedLayout>} />
        
        {/* Manager Routes */}
        <Route path="/manager" element={<RequireAuth allowedRoles={['Manager', 'CEO']}><ManagerLayout><ManagerDashboard /></ManagerLayout></RequireAuth>} />
        <Route path="/manager/courses" element={<RequireAuth allowedRoles={['Manager', 'CEO']}><ManagerLayout><CourseManagement /></ManagerLayout></RequireAuth>} />
        <Route path="/manager/courses/:courseId/modules/:moduleId" element={<RequireAuth allowedRoles={['Manager', 'CEO']}><ManagerLayout><ModuleEditor /></ManagerLayout></RequireAuth>} />
        <Route path="/manager/courses/:courseId/modules/:moduleId/classes/:classId" element={<RequireAuth allowedRoles={['Manager', 'CEO']}><ManagerLayout><ClassEditor /></ManagerLayout></RequireAuth>} />
        <Route path="/manager/users" element={<RequireAuth allowedRoles={['Manager', 'CEO']}><ManagerLayout><UserManagement /></ManagerLayout></RequireAuth>} />
        <Route path="/manager/gamification" element={<RequireAuth allowedRoles={['Manager', 'CEO']}><ManagerLayout><GamificationSettings /></ManagerLayout></RequireAuth>} />
        <Route path="/manager/tasks" element={<RequireAuth allowedRoles={['Manager', 'CEO']}><ManagerLayout><AsanaTaskApp /></ManagerLayout></RequireAuth>} />
        <Route path="/manager/timetable" element={<RequireAuth allowedRoles={['Manager', 'CEO']}><ManagerLayout><TimetableManager /></ManagerLayout></RequireAuth>} />
        <Route path="/manager/approvals/:id" element={<RequireAuth allowedRoles={['Manager', 'CEO']}><ManagerLayout><ApprovalDetail /></ManagerLayout></RequireAuth>} />
        
        {/* Onboarding is done by Sales/HR, then approved by Manager */}
        <Route path="/sales/onboarding/:id" element={<RequireAuth allowedRoles={['Sales/HR', 'Manager', 'CEO']}><SalesLayout><OnboardingFlow /></SalesLayout></RequireAuth>} />

        {/* DM Routes */}
        <Route path="/dm/dashboard" element={<RequireAuth allowedRoles={['DM', 'Manager', 'CEO']}><DMLayout><DMDashboard /></DMLayout></RequireAuth>} />
        <Route path="/dm/planner" element={<RequireAuth allowedRoles={['DM', 'Manager', 'CEO']}><DMLayout><ContentPlanner /></DMLayout></RequireAuth>} />
        <Route path="/dm/tasks" element={<RequireAuth allowedRoles={['DM', 'Manager', 'CEO']}><DMLayout><AsanaTaskApp /></DMLayout></RequireAuth>} />

        {/* CEO Routes */}
        <Route path="/ceo/dashboard" element={<RequireAuth allowedRoles={['CEO']}><CEOLayout><CEODashboard /></CEOLayout></RequireAuth>} />
        <Route path="/ceo/tasks" element={<RequireAuth allowedRoles={['CEO']}><CEOLayout><AsanaTaskApp /></CEOLayout></RequireAuth>} />
        <Route path="/ceo/settings" element={<RequireAuth allowedRoles={['CEO']}><CEOLayout><CEOSettings /></CEOLayout></RequireAuth>} />
        <Route path="/ceo/users" element={<RequireAuth allowedRoles={['CEO']}><CEOLayout><UserManagement /></CEOLayout></RequireAuth>} />
        <Route path="/ceo/ai-voice" element={<RequireAuth allowedRoles={['CEO']}><CEOLayout><AIVoiceSettings /></CEOLayout></RequireAuth>} />
        <Route path="/ceo/courses" element={<RequireAuth allowedRoles={['CEO']}><CEOLayout><CourseManagement /></CEOLayout></RequireAuth>} />
        <Route path="/ceo/courses/:courseId/modules/:moduleId" element={<RequireAuth allowedRoles={['CEO']}><CEOLayout><ModuleEditor /></CEOLayout></RequireAuth>} />
        <Route path="/ceo/courses/:courseId/modules/:moduleId/classes/:classId" element={<RequireAuth allowedRoles={['CEO']}><CEOLayout><ClassEditor /></CEOLayout></RequireAuth>} />

        {/* Teacher Routes */}
        <Route path="/teacher" element={<TeacherLayout><TeacherDashboard /></TeacherLayout>} />
        <Route path="/teacher/timetable" element={<TeacherLayout><TeacherTimetable /></TeacherLayout>} />
        <Route path="/teacher/tasks" element={<TeacherLayout><AsanaTaskApp /></TeacherLayout>} />
        <Route path="/teacher/cms" element={<TeacherLayout><TeacherCMS /></TeacherLayout>} />
        <Route path="/teacher/live" element={<TeacherLayout><LiveStreamDashboard /></TeacherLayout>} />
        <Route path="/teacher/attendance" element={<TeacherLayout><AttendanceSystem /></TeacherLayout>} />
        {/* Fullscreen presentation route (No Layout) */}
        <Route path="/teacher/presentation-view" element={<RequireAuth allowedRoles={['Teacher', 'Manager', 'CEO']}><PresentationView /></RequireAuth>} />

        {/* Admin & Student Routes */}
        <Route path="/admin/dashboard" element={<RequireAuth allowedRoles={['CEO']}><CRMLayout><AdminDashboard /></CRMLayout></RequireAuth>} />
        <Route path="/student" element={<StudentLayoutWrapper><StudentPortal /></StudentLayoutWrapper>} />
        <Route path="/student/module/:moduleId" element={<StudentLayoutWrapper><ModuleMap /></StudentLayoutWrapper>} />
        <Route path="/student/class-flow" element={<StudentLayoutWrapper><ClassFlow /></StudentLayoutWrapper>} />
        <Route path="/student/interview" element={<StudentLayoutWrapper><MockInterview /></StudentLayoutWrapper>} />
        <Route path="/student/attendance" element={<StudentLayoutWrapper><AttendancePage /></StudentLayoutWrapper>} />
        <Route path="/student/leaderboard" element={<StudentLayoutWrapper><Leaderboard /></StudentLayoutWrapper>} />
        <Route path="/student/career" element={<StudentLayoutWrapper><CareerCenter /></StudentLayoutWrapper>} />
        <Route path="/student/referrals" element={<StudentLayoutWrapper><ReferralCenter /></StudentLayoutWrapper>} />
      </Routes>
    </Router>
  );
}

export default App;

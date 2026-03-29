import { useEffect, useState } from 'react';
import AdminNavbar from './components/layout/AdminNavbar';
import AdminSidebar from './components/layout/AdminSidebar';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import LoginPage from './pages/LoginPage';
import AdminCoursesPage from './pages/admin/AdminCoursesPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminGradeApprovalsPage from './pages/admin/AdminGradeApprovalsPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminSectionsPage from './pages/admin/AdminSectionsPage';
import AdminSubjectsPage from './pages/admin/AdminSubjectsPage';
import AdminUserPage from './pages/admin/AdminUserPage';

// Student pages
import StudentClassStanding from './pages/student/StudentClassStanding';
import StudentDashboard from './pages/student/StudentDashboard';

// Instructor pages
import ClassRosterPage from './pages/instructor/ClassRosterPage';
import FacultyLoadPage from './pages/instructor/FacultyLoadPage';
import InstructorClassStanding from './pages/instructor/InstructorClassStanding';
import ReportCardPage from './pages/instructor/ReportCardPage';
import SubjectLoadPage from './pages/instructor/SubjectLoadPage';

import { initStore } from './utils/store';
import api from './api/axios';

const INSTRUCTOR_NAV = [
  { id: 'class-standing', label: 'Class Standing' },
  { id: 'subject-load', label: 'Subject Load' },
  { id: 'faculty-load', label: 'Faculty Load' },
  { id: 'class-roster', label: 'Class Roster' },
  { id: 'report-card', label: 'Report Card' },
];

const STUDENT_NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'class-standing', label: 'Class Standing' },
];

const ADMIN_NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Users' },
  { id: 'sections', label: 'Sections' },
  { id: 'subjects', label: 'Subjects' },
  { id: 'courses', label: 'Courses' },
  { id: 'grade-approvals', label: 'Grade Approvals' },
];

export default function App() {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState('dashboard');
  const [store, setStore] = useState(initStore);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setRole(userData.role);
    }
  }, []);

  useEffect(() => {
    if (role === 'student') {
      setLoadingStudent(true);
      api.get('/my-grades').then(res => {
        setStudentData(res.data);
      }).catch(err => {
        console.error(err);
      }).finally(() => {
        setLoadingStudent(false);
      });
    }
  }, [role]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setRole(null);
    setUser(null);
    setPage('dashboard');
    setShowAdminLogin(false);
    setStudentData(null);
  };

  if (showAdminLogin && !role) {
    return (
      <AdminLoginPage onLogin={(u) => { setUser(u); setRole(u.role); setShowAdminLogin(false); }} />
    );
  }

  if (!role) {
    return (
      <LoginPage
        onLogin={r => { setUser(r); setRole(r.role); setPage(r.role === 'professor' ? 'class-standing' : 'dashboard'); }}
      />
    );
  }

  const isInstructor = role === 'professor';
  const isAdmin = role === 'admin';
  const isStudent = role === 'student';

  if (isStudent && (loadingStudent || !studentData)) {
    return <div className="flex flex-col h-screen items-center justify-center bg-gray-50 text-navy-900 font-display text-lg animate-pulse">Loading amazing things...</div>;
  }

  const student = studentData?.student || { name: user?.first_name || '', studentId: '', section: '', semester: '', cumulativeGPA: 0.0 };
  const subjects = studentData?.subjects || [];

  if (isAdmin) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <AdminNavbar
          title="AICS"
          user={user ? `${user.first_name} ${user.last_name}` : 'Admin'}
          userId={user?.email}
          onToggle={() => setCollapsed(c => !c)}
          onLogout={logout}
        />
        <div className="flex flex-1 overflow-hidden">
          <AdminSidebar
            items={ADMIN_NAV}
            activePage={page}
            onNav={setPage}
            collapsed={collapsed}
            footer="2nd Semester, A.Y. 2025–2026"
          />
          <main className="flex-1 overflow-y-auto px-8 py-7 bg-gray-50">
            {page === 'dashboard' && <AdminDashboard />}
            {page === 'users' && <AdminUserPage />}
            {page === 'sections' && <AdminSectionsPage />}
            {page === 'subjects' && <AdminSubjectsPage />}
            {page === 'courses' && <AdminCoursesPage />}
            {page === 'grade-approvals' && <AdminGradeApprovalsPage />}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar
        title="AICS"
        role={role}
        user={user ? `${user.first_name} ${user.last_name}` : (isInstructor ? 'Instructor' : student.name)}
        userId={user?.email || student.studentId}
        userSub={isInstructor ? undefined : student.section}
        onToggle={() => setCollapsed(c => !c)}
        onLogout={logout}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          items={isInstructor ? INSTRUCTOR_NAV : STUDENT_NAV}
          activePage={page}
          onNav={setPage}
          collapsed={collapsed}
          footer={isInstructor ? '2nd Semester, A.Y. 2025–2026' : student.semester}
        />

        <main className="flex-1 overflow-y-auto px-8 py-7 bg-gray-50">
          {/* Instructor pages */}
          {isInstructor && page === 'class-standing' && <InstructorClassStanding />}
          {isInstructor && page === 'subject-load' && <SubjectLoadPage />}
          {isInstructor && page === 'faculty-load' && <FacultyLoadPage />}
          {isInstructor && page === 'class-roster' && <ClassRosterPage />}
          {isInstructor && page === 'report-card' && <ReportCardPage />}

          {/* Student pages */}
          {!isInstructor && page === 'dashboard' && <StudentDashboard student={student} subjects={subjects} />}
          {!isInstructor && page === 'class-standing' && <StudentClassStanding subjects={subjects} />}
        </main>
      </div>
    </div>
  );
}

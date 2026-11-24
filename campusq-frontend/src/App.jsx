import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, getHomePathForRole } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import StudentRegisterPage from './pages/StudentRegisterPage';
import VendorRegisterPage from './pages/VendorRegisterPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import CollegeAdminDashboard from './pages/CollegeAdminDashboard';
import VendorDashboard from './pages/VendorDashboard';
import StudentDashboard from './pages/StudentDashboard';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={user ? getHomePathForRole(user.role) : '/login'} replace />}
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register/student" element={<StudentRegisterPage />} />
      <Route path="/register/vendor" element={<VendorRegisterPage />} />

      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <CollegeAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor"
        element={
          <ProtectedRoute allowedRoles={['VENDOR']}>
            <VendorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

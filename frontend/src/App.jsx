import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/common/RoleGuard';
import { Layout } from './components/layout/Layout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { EmployeeList } from './pages/Employees/EmployeeList';
import { DepartmentList } from './pages/Departments/DepartmentList';
import { AttendanceLeave } from './pages/Attendance/AttendanceLeave';
import { PayrollProcessing } from './pages/Payroll/PayrollProcessing';
import { PayrollConfig } from './pages/Payroll/PayrollConfig';
import { MyPayslips } from './pages/Payroll/MyPayslips';
import { PayrollReports } from './pages/Reports/PayrollReports';

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Portal Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Workforce Management */}
              <Route
                path="employees"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'HR', 'Payroll Manager']}>
                    <EmployeeList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="departments"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'HR']}>
                    <DepartmentList />
                  </ProtectedRoute>
                }
              />
              <Route path="attendance" element={<AttendanceLeave />} />

              {/* Phase 5 Payroll Management */}
              <Route
                path="payroll"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Payroll Manager']}>
                    <PayrollProcessing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payroll/config"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Payroll Manager']}>
                    <PayrollConfig />
                  </ProtectedRoute>
                }
              />

              {/* Employee Self-Service */}
              <Route
                path="my-payslips"
                element={
                  <ProtectedRoute allowedRoles={['Employee']}>
                    <MyPayslips />
                  </ProtectedRoute>
                }
              />

              {/* Reports & Analytics */}
              <Route
                path="reports"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Payroll Manager']}>
                    <PayrollReports />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;

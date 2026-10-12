import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck2,
  Banknote,
  Sliders,
  Receipt,
  BarChart3,
  LogOut,
  ShieldCheck,
  X,
} from 'lucide-react';

import { ForvexIcon } from '../common/ForvexLogo';

export const Sidebar = ({ mobileOpen, onClose }) => {
  const { user, logout } = useAuth();
  const role = user?.role;

  return (
    <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <div
            className="brand-icon"
            style={{
              background: 'linear-gradient(135deg, #00b8a9 0%, #007a70 100%)',
              boxShadow: '0 4px 14px rgba(0, 184, 169, 0.4)',
            }}
          >
            <ForvexIcon size={22} color="#ffffff" />
          </div>
          <div>
            <div className="brand-title">Forvex EMS</div>
            <div className="brand-subtitle">HR &amp; Payroll Suite</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-sm btn-link text-white-50 p-1 d-lg-none"
          title="Close Navigation Drawer"
          style={{ textDecoration: 'none' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <div className="sidebar-nav">
        {role === 'Employee' ? (
          <>
            <div className="nav-section-title">Employee Portal</div>
            <NavLink
              to="/dashboard"
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>My Dashboard</span>
            </NavLink>
            <NavLink
              to="/attendance"
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <CalendarCheck2 size={18} />
              <span>My Attendance &amp; Leaves</span>
            </NavLink>
            <NavLink
              to="/my-payslips"
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Receipt size={18} />
              <span>My Payslips</span>
            </NavLink>
          </>
        ) : (
          <>
            <div className="nav-section-title">Core</div>
            <NavLink
              to="/dashboard"
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            {/* HR & Employee Management */}
            {['Admin', 'HR', 'Payroll Manager'].includes(role) && (
              <>
                <div className="nav-section-title">Workforce</div>
                <NavLink
                  to="/employees"
                  onClick={onClose}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Users size={18} />
                  <span>Employees</span>
                </NavLink>
              </>
            )}

            {['Admin', 'HR'].includes(role) && (
              <NavLink
                to="/departments"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Building2 size={18} />
                <span>Departments</span>
              </NavLink>
            )}

            <NavLink
              to="/attendance"
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <CalendarCheck2 size={18} />
              <span>Attendance &amp; Leaves</span>
            </NavLink>

            {/* Phase 5 Payroll Modules */}
            {['Admin', 'Payroll Manager'].includes(role) && (
              <>
                <div className="nav-section-title">Payroll System</div>
                <NavLink
                  to="/payroll"
                  onClick={onClose}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Banknote size={18} />
                  <span>Payroll Processing</span>
                </NavLink>
                <NavLink
                  to="/payroll/config"
                  onClick={onClose}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Sliders size={18} />
                  <span>Payroll Rules &amp; Config</span>
                </NavLink>
                <NavLink
                  to="/reports"
                  onClick={onClose}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <BarChart3 size={18} />
                  <span>Salary Reports</span>
                </NavLink>
              </>
            )}
          </>
        )}
      </div>

      {/* Footer Profile */}
      <div className="sidebar-footer">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#f8fafc',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.name}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ShieldCheck size={12} color="#10b981" />
                {role}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn-sm btn-link p-1 text-secondary"
            title="Log Out"
            style={{ color: '#94a3b8' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

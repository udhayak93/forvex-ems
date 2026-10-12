import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { User, LogOut, ArrowRightLeft, Menu } from 'lucide-react';

export const Navbar = ({ onToggleMobileMenu }) => {
  const { user, login, logout } = useAuth();
  const { success, error } = useNotification();

  const handleQuickSwitch = async (email, password, roleName) => {
    try {
      await login(email, password);
      success(`Switched role to ${roleName}`);
    } catch (err) {
      error(`Could not switch to ${roleName}: ${err.message}`);
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Admin':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
      case 'Payroll Manager':
        return { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' };
      case 'HR':
        return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      default:
        return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
    }
  };

  const badgeStyle = getRoleBadgeStyle(user?.role);

  return (
    <header className="app-navbar">
      <div className="d-flex align-items-center gap-2">
        <button
          type="button"
          className="btn btn-sm btn-light border d-lg-none p-1 px-2 me-1"
          onClick={onToggleMobileMenu}
          title="Toggle Navigation Menu"
        >
          <Menu size={18} />
        </button>
        <h5 className="mb-0 fw-bold text-dark d-none d-md-block">Forvex EMS</h5>
        <span
          style={{
            backgroundColor: badgeStyle.bg,
            color: badgeStyle.text,
            border: `1px solid ${badgeStyle.border}`,
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
        >
          {user?.role}
        </span>
      </div>

      <div className="d-flex align-items-center gap-2">
        {/* Quick Demo Switcher - Strictly available to Admin */}
        {user?.role === 'Admin' && (
          <div className="dropdown d-none d-lg-block">
            <button
              className="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center gap-1"
              type="button"
              id="roleSwitchDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ fontSize: '0.78rem', borderRadius: 6 }}
            >
              <ArrowRightLeft size={14} />
              <span>Switch Demo Role</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-sm" aria-labelledby="roleSwitchDropdown">
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => handleQuickSwitch('udhaya@gmail.com', 'udhaya@123', 'Admin & HR (Udhaya)')}
                >
                  👑 <strong>Admin & HR</strong> (Udhaya)
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => handleQuickSwitch('admin@forvex.in', 'Admin@123', 'Admin (Aditya Varma)')}
                >
                  ⚙️ <strong>SysAdmin</strong> (Aditya Varma)
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => handleQuickSwitch('payroll@forvex.in', 'Payroll@123', 'Payroll Lead (Vikram Iyer)')}
                >
                  💰 <strong>Payroll Lead</strong> (Vikram Iyer)
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => handleQuickSwitch('hr@forvex.in', 'Hr@123', 'HR Partner (Ananya Rao)')}
                >
                  👥 <strong>HR Partner</strong> (Ananya Rao)
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => handleQuickSwitch('rahul.sharma@forvex.in', 'Employee@123', 'Employee (Rahul Sharma)')}
                >
                  👤 <strong>Employee</strong> (Rahul Sharma)
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => handleQuickSwitch('priya.patel@forvex.in', 'Employee@123', 'Employee (Priya Patel)')}
                >
                  👤 <strong>Employee</strong> (Priya Patel)
                </button>
              </li>
            </ul>
          </div>
        )}

        {/* Profile Info */}
        <div className="d-flex align-items-center gap-2 border-start ps-3 ms-2">
          <div className="text-end d-none d-sm-block">
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{user?.name}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{user?.email}</div>
          </div>
          <button
            onClick={logout}
            className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
            title="Log out"
            style={{ borderRadius: 6, fontSize: '0.78rem' }}
          >
            <LogOut size={14} />
            <span className="d-none d-sm-inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

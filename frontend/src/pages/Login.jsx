import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { authService } from '../services/authService';
import { LogIn, UserPlus, Lock, Mail, User, Eye, EyeOff, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { ForvexLogo } from '../components/common/ForvexLogo';

export const Login = () => {
  // Portal selector: 'admin' (Admin & HR) | 'employee' (Employee Self-Service)
  const [portal, setPortal] = useState('admin');

  // Employee portal tab: 'signin' | 'signup'
  const [employeeTab, setEmployeeTab] = useState('signin');

  // Form input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Employee registration states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [signupSuccessMsg, setSignupSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordInputRef = useRef(null);

  const { login } = useAuth();
  const { success, error } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Switch between Admin & HR portal and Employee portal
  const switchPortal = (newPortal) => {
    setPortal(newPortal);
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setSignupSuccessMsg('');
  };

  // Quick fill Admin & HR credentials for user udhaya@gmail.com
  const fillAdminCredentials = () => {
    setEmail('udhaya@gmail.com');
    setPassword('udhaya@123');
  };

  // Sign In handler (used by both Admin/HR and Employee)
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      success(`Welcome, ${user.name}!`);
      navigate(from, { replace: true });
    } catch (err) {
      error(err.response?.data?.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // Employee Sign Up handler (strictly creates Employee role)
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      error('Please fill in all required fields.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      error('Passwords do not match.');
      return;
    }

    if (regPassword.length < 6) {
      error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: 'Employee',
      });

      success('Employee account created! Please sign in with your password.');
      setEmail(regEmail);
      setPassword('');
      setSignupSuccessMsg(`Account created for ${regEmail}! Please enter your password to sign in.`);
      setEmployeeTab('signin');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');

      setTimeout(() => passwordInputRef.current?.focus(), 150);
    } catch (err) {
      error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 p-3"
      style={{
        backgroundColor: '#041d1b',
        backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(0, 184, 169, 0.22) 0%, transparent 60%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div
          className="p-4 p-sm-5 rounded-4 shadow-2xl text-white"
          style={{
            backgroundColor: 'rgba(5, 30, 28, 0.92)',
            border: '1px solid rgba(0, 184, 169, 0.22)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Brand Header */}
          <div className="text-center mb-4">
            <div className="d-flex justify-content-center mb-2">
              <ForvexLogo iconSize={38} textSize="1.75rem" showSubtitle={true} />
            </div>
            <p className="text-white-50 small mb-0">
              Enterprise Employee & Payroll Portal
            </p>
          </div>

          {/* Primary Portal Switcher: Admin & HR vs Employee */}
          <div
            className="d-flex p-1 rounded-3 mb-4"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
          >
            <button
              type="button"
              className="btn btn-sm flex-fill fw-semibold py-2 rounded-2 transition"
              style={{
                backgroundColor: portal === 'admin' ? '#00b8a9' : 'transparent',
                color: portal === 'admin' ? '#ffffff' : '#94a3b8',
                border: 'none',
                fontSize: '0.82rem',
              }}
              onClick={() => switchPortal('admin')}
            >
              👑 Admin & HR
            </button>
            <button
              type="button"
              className="btn btn-sm flex-fill fw-semibold py-2 rounded-2 transition"
              style={{
                backgroundColor: portal === 'employee' ? '#00b8a9' : 'transparent',
                color: portal === 'employee' ? '#ffffff' : '#94a3b8',
                border: 'none',
                fontSize: '0.82rem',
              }}
              onClick={() => switchPortal('employee')}
            >
              👤 Employee Portal
            </button>
          </div>

          {/* ======================================================== */}
          {/* SECTION 1: SEPARATE ADMIN & HR LOGIN (No Public Sign Up) */}
          {/* ======================================================== */}
          {portal === 'admin' && (
            <form onSubmit={handleSignIn} autoComplete="off">
              {/* Decoy fields to block browser autofill */}
              <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden' }}>
                <input type="text" name="decoy_user_admin" tabIndex="-1" autoComplete="off" />
                <input type="password" name="decoy_pwd_admin" tabIndex="-1" autoComplete="new-password" />
              </div>

              {/* Security Advisory for Management */}
              <div
                className="p-2 px-3 mb-3 rounded-2 small d-flex align-items-center justify-content-between"
                style={{
                  backgroundColor: 'rgba(0, 184, 169, 0.08)',
                  border: '1px solid rgba(0, 184, 169, 0.25)',
                  color: '#99f6e4',
                  fontSize: '0.78rem',
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <ShieldCheck size={16} color="#00b8a9" className="flex-shrink-0" />
                  <span>Admin &amp; HR Access Portal</span>
                </div>
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none fw-bold small d-flex align-items-center gap-1"
                  style={{ color: '#2dd4bf', fontSize: '0.74rem' }}
                  onClick={fillAdminCredentials}
                  title="Fill udhaya@gmail.com"
                >
                  <Sparkles size={12} /> Fill Details
                </button>
              </div>

              {/* Admin Email Input */}
              <div className="mb-3">
                <label className="form-label small text-white-50 fw-semibold mb-1">
                  Admin / HR Email
                </label>
                <div className="input-group">
                  <span
                    className="input-group-text border-0"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}
                  >
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    name="admin_signin_email"
                    className="form-control text-white border-0"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      fontSize: '0.88rem',
                    }}
                    placeholder="udhaya@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="off"
                    data-lpignore="true"
                    required
                  />
                </div>
              </div>

              {/* Admin Password Input */}
              <div className="mb-3">
                <label className="form-label small text-white-50 fw-semibold mb-1">
                  Password
                </label>
                <div className="input-group">
                  <span
                    className="input-group-text border-0"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}
                  >
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="admin_signin_pwd"
                    className="form-control text-white border-0"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      fontSize: '0.88rem',
                    }}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    data-lpignore="true"
                    required
                  />
                  <button
                    type="button"
                    className="btn border-0"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Show Password Checkbox */}
                <div className="form-check mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="adminShowPassword"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: showPassword ? '#00b8a9' : 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(0, 184, 169, 0.4)',
                    }}
                  />
                  <label
                    className="form-check-label small text-white-50 user-select-none"
                    htmlFor="adminShowPassword"
                    style={{ cursor: 'pointer', fontSize: '0.82rem' }}
                  >
                    Show Password
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="btn w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold rounded-3 text-white mb-3 mt-4"
                style={{
                  background: 'linear-gradient(135deg, #00b8a9 0%, #008f84 100%)',
                  boxShadow: '0 4px 14px rgba(0, 184, 169, 0.35)',
                  border: 'none',
                  fontSize: '0.92rem',
                }}
                disabled={loading}
              >
                <LogIn size={18} />
                <span>{loading ? 'Authenticating...' : 'Sign In as Admin & HR'}</span>
              </button>

              <div className="text-center text-white-50 small mt-2">
                <span style={{ fontSize: '0.76rem' }}>
                  Admin &amp; HR accounts are managed internally. No public sign-up is permitted.
                </span>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* SECTION 2: SEPARATE EMPLOYEE PORTAL (Sign In + Sign Up)  */}
          {/* ======================================================== */}
          {portal === 'employee' && (
            <div>
              {/* Employee Tab Switcher */}
              <div
                className="d-flex p-1 rounded-2 mb-3"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
              >
                <button
                  type="button"
                  className="btn btn-sm flex-fill fw-semibold py-1 rounded transition"
                  style={{
                    backgroundColor: employeeTab === 'signin' ? 'rgba(0, 184, 169, 0.25)' : 'transparent',
                    color: employeeTab === 'signin' ? '#2dd4bf' : '#94a3b8',
                    border: 'none',
                    fontSize: '0.8rem',
                  }}
                  onClick={() => setEmployeeTab('signin')}
                >
                  Employee Sign In
                </button>
                <button
                  type="button"
                  className="btn btn-sm flex-fill fw-semibold py-1 rounded transition"
                  style={{
                    backgroundColor: employeeTab === 'signup' ? 'rgba(0, 184, 169, 0.25)' : 'transparent',
                    color: employeeTab === 'signup' ? '#2dd4bf' : '#94a3b8',
                    border: 'none',
                    fontSize: '0.8rem',
                  }}
                  onClick={() => setEmployeeTab('signup')}
                >
                  New Registration
                </button>
              </div>

              {/* Success Banner */}
              {signupSuccessMsg && employeeTab === 'signin' && (
                <div
                  className="p-3 mb-3 rounded-3 d-flex align-items-start gap-2 small"
                  style={{
                    backgroundColor: 'rgba(0, 184, 169, 0.15)',
                    border: '1px solid rgba(0, 184, 169, 0.35)',
                    color: '#2dd4bf',
                  }}
                >
                  <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{signupSuccessMsg}</span>
                </div>
              )}

              {/* Employee Sign In */}
              {employeeTab === 'signin' && (
                <form onSubmit={handleSignIn} autoComplete="off">
                  <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden' }}>
                    <input type="text" name="decoy_emp_user" tabIndex="-1" autoComplete="off" />
                    <input type="password" name="decoy_emp_pwd" tabIndex="-1" autoComplete="new-password" />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-white-50 fw-semibold mb-1">
                      Work Email Address
                    </label>
                    <div className="input-group">
                      <span
                        className="input-group-text border-0"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}
                      >
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        name="emp_signin_email"
                        className="form-control text-white border-0"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          fontSize: '0.88rem',
                        }}
                        placeholder="e.g. rahul.sharma@forvex.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="off"
                        data-lpignore="true"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-white-50 fw-semibold mb-1">
                      Password
                    </label>
                    <div className="input-group">
                      <span
                        className="input-group-text border-0"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}
                      >
                        <Lock size={16} />
                      </span>
                      <input
                        ref={passwordInputRef}
                        type={showPassword ? 'text' : 'password'}
                        name="emp_signin_pwd"
                        className="form-control text-white border-0"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          fontSize: '0.88rem',
                        }}
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        data-lpignore="true"
                        required
                      />
                      <button
                        type="button"
                        className="btn border-0"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <div className="form-check mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="empShowPassword"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: showPassword ? '#00b8a9' : 'rgba(255, 255, 255, 0.1)',
                          borderColor: 'rgba(0, 184, 169, 0.4)',
                        }}
                      />
                      <label
                        className="form-check-label small text-white-50 user-select-none"
                        htmlFor="empShowPassword"
                        style={{ cursor: 'pointer', fontSize: '0.82rem' }}
                      >
                        Show Password
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold rounded-3 text-white mb-3 mt-4"
                    style={{
                      background: 'linear-gradient(135deg, #00b8a9 0%, #008f84 100%)',
                      boxShadow: '0 4px 14px rgba(0, 184, 169, 0.35)',
                      border: 'none',
                      fontSize: '0.92rem',
                    }}
                    disabled={loading}
                  >
                    <LogIn size={18} />
                    <span>{loading ? 'Authenticating...' : 'Sign In as Employee'}</span>
                  </button>

                  <div className="text-center text-white-50 small">
                    New team member?{' '}
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none fw-semibold small"
                      style={{ color: '#2dd4bf' }}
                      onClick={() => setEmployeeTab('signup')}
                    >
                      Register here
                    </button>
                  </div>
                </form>
              )}

              {/* Employee Sign Up */}
              {employeeTab === 'signup' && (
                <form onSubmit={handleSignUp} autoComplete="off">
                  <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden' }}>
                    <input type="text" name="decoy_reg_user" tabIndex="-1" autoComplete="off" />
                    <input type="password" name="decoy_reg_pwd" tabIndex="-1" autoComplete="new-password" />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-white-50 fw-semibold mb-1">
                      Full Name
                    </label>
                    <div className="input-group">
                      <span
                        className="input-group-text border-0"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}
                      >
                        <User size={16} />
                      </span>
                      <input
                        type="text"
                        name="emp_reg_name"
                        className="form-control text-white border-0"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          fontSize: '0.88rem',
                        }}
                        placeholder="e.g. Vikram Sharma"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        autoComplete="off"
                        data-lpignore="true"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-white-50 fw-semibold mb-1">
                      Work Email Address
                    </label>
                    <div className="input-group">
                      <span
                        className="input-group-text border-0"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}
                      >
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        name="emp_reg_email"
                        className="form-control text-white border-0"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          fontSize: '0.88rem',
                        }}
                        placeholder="name@forvex.in"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        autoComplete="off"
                        data-lpignore="true"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-white-50 fw-semibold mb-1">
                      Password (Min 6 characters)
                    </label>
                    <div className="input-group">
                      <span
                        className="input-group-text border-0"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}
                      >
                        <Lock size={16} />
                      </span>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        name="emp_reg_pwd"
                        className="form-control text-white border-0"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          fontSize: '0.88rem',
                        }}
                        placeholder="Enter password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        autoComplete="new-password"
                        data-lpignore="true"
                        required
                      />
                      <button
                        type="button"
                        className="btn border-0"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        tabIndex="-1"
                      >
                        {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-white-50 fw-semibold mb-1">
                      Confirm Password
                    </label>
                    <div className="input-group">
                      <span
                        className="input-group-text border-0"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}
                      >
                        <Lock size={16} />
                      </span>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        name="emp_reg_pwd_confirm"
                        className="form-control text-white border-0"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          fontSize: '0.88rem',
                        }}
                        placeholder="Repeat password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        data-lpignore="true"
                        required
                      />
                    </div>

                    <div className="form-check mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="regShowPassword"
                        checked={showRegPassword}
                        onChange={(e) => setShowRegPassword(e.target.checked)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: showRegPassword ? '#00b8a9' : 'rgba(255, 255, 255, 0.1)',
                          borderColor: 'rgba(0, 184, 169, 0.4)',
                        }}
                      />
                      <label
                        className="form-check-label small text-white-50 user-select-none"
                        htmlFor="regShowPassword"
                        style={{ cursor: 'pointer', fontSize: '0.82rem' }}
                      >
                        Show Password
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold rounded-3 text-white mb-3 mt-4"
                    style={{
                      background: 'linear-gradient(135deg, #00b8a9 0%, #008f84 100%)',
                      boxShadow: '0 4px 14px rgba(0, 184, 169, 0.35)',
                      border: 'none',
                      fontSize: '0.92rem',
                    }}
                    disabled={loading}
                  >
                    <UserPlus size={18} />
                    <span>{loading ? 'Registering...' : 'Register as Employee'}</span>
                  </button>

                  <div className="text-center text-white-50 small">
                    Already registered?{' '}
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none fw-semibold small"
                      style={{ color: '#2dd4bf' }}
                      onClick={() => setEmployeeTab('signin')}
                    >
                      Sign In instead
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Minimal Footer */}
          <div className="mt-4 pt-3 border-top text-center" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
            <span
              className="d-inline-flex align-items-center gap-1 text-white-50"
              style={{ fontSize: '0.72rem' }}
            >
              <ShieldCheck size={13} color="#00b8a9" />
              <span>Encrypted &amp; Protected by Forvex Enterprise Security</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      {mobileMenuOpen && (
        <div
          className="sidebar-backdrop d-lg-none"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <div className="main-wrapper">
        <Navbar onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

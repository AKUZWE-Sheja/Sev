import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaListAlt, FaEnvelope, FaUsers, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/authUtils';
import { logout } from '../services/api';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: <FaHome className="mr-2" /> },
    { to: '/listings', label: 'Listings', icon: <FaListAlt className="mr-2" /> },
    { to: '/requests', label: 'Requests', icon: <FaListAlt className="mr-2" /> },
    { to: '/messages', label: 'Messages', icon: <FaEnvelope className="mr-2" /> },
    { to: '/users', label: 'Users', icon: <FaUsers className="mr-2" />, adminOnly: true },
    { to: '/logs', label: 'Logs', icon: <FaListAlt className="mr-2" />, adminOnly: true },
  ];

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <nav className="bg-gradient-to-r from-primary-orange to-secondary-orange text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex-shrink-0 flex items-center">
              <Link
                to="/dashboard"
                className="flex items-center text-xl font-bold tracking-tight"
              >
                <span>Community Resource <span className="text-light-orange-tint">Tracker</span></span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-4">
                {navItems
                  .filter((item) => !item.adminOnly || (user && user.role === 'ADMIN'))
                  .map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === item.to
                          ? 'bg-dark-orange text-white shadow-inner'
                          : 'text-off-white-tint hover:bg-secondary-orange hover:text-white'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center ml-4 px-3 py-2 rounded-md text-sm font-medium text-off-white-tint hover:bg-red-500 hover:text-white transition-colors"
                >
                  <FaSignOutAlt className="mr-2" />
                  Log out
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-light-orange-tint hover:text-white hover:bg-secondary-orange focus:outline-none transition-colors"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <span className="sr-only">{isMobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
                {isMobileMenuOpen ? (
                  <FaTimes className="block h-6 w-6" />
                ) : (
                  <FaBars className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-primary-orange shadow-lg" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems
                .filter((item) => !item.adminOnly || (user && user.role === 'ADMIN'))
                .map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      location.pathname === item.to
                        ? 'bg-dark-orange text-white'
                        : 'text-off-white-tint hover:bg-secondary-orange hover:text-white'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              <button
                onClick={() => {
                  handleLogoutClick();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium text-off-white-tint hover:bg-red-500 hover:text-white transition-colors"
              >
                <FaSignOutAlt className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <div className="bg-off-white-tint p-8 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-dark-orange">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavBar;
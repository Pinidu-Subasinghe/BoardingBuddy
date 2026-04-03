import React, { useContext, useState } from 'react';
import logo from '../assets/logo-no-bg.png';
import { Link, useLocation } from 'react-router-dom';
import { FiHeart } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Nav = () => {
  const { user, openAuth } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLink = (path) =>
    `text-sm font-medium transition-colors duration-200 ${
      location.pathname === path
        ? 'text-indigo-700 font-semibold'
        : 'text-gray-700 hover:text-indigo-600'
    }`;

  if (user && ['admin', 'owner', 'inspector'].includes(user.role) && location.pathname !== '/') return null;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">

          {/* Left – Logo+Title group (desktop), Title only (mobile) */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src={logo}
                alt="BoardingBuddy Logo"
                className="hidden md:block w-10 transition-transform"
                draggable="false"
              />
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight hover:text-indigo-700 transition">
                <span className="text-[#4A90E2]">Boarding</span><span className="text-[#F47C20]">Buddy</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav – Center */}
          <nav className="hidden md:flex items-center gap-10">
            <Link to="/browse" className={navLink('/browse')}>
              Browse
            </Link>
            <Link to="/about" className={navLink('/about')}>
              About
            </Link>
            <Link to="/contact" className={navLink('/contact')}>
              Contact
            </Link>
          </nav>

          {/* Right – Auth / Profile (desktop only) + Mobile Hamburger */}
          <div className="flex items-center gap-4">
            {user && user.role === 'student' && (
              <Link
                to="/student-dashboard"
                state={{ activeMenu: 'wishlist' }}
                aria-label="Wishlist"
                title="Wishlist"
                className="p-2 rounded-full bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition"
              >
                <FiHeart className="w-5 h-5" aria-hidden="true" />
              </Link>
            )}
            <NotificationBell user={user} />
            {user && user.role === 'student' ? (
              <Link
                to="/student-dashboard"
                className="
                  group flex items-center gap-2 px-3 py-1.5
                  bg-gradient-to-r from-blue-600 to-blue-700
                  hover:from-blue-700 hover:to-blue-800
                  text-white text-xs font-semibold
                  rounded-full shadow-sm hover:shadow-md
                  transition-all duration-200 active:scale-[0.98]
                  hidden md:flex
                "
              >
                <div className="
                  w-6 h-6 rounded-full bg-white/20 text-white
                  flex items-center justify-center
                  ring-1 ring-white/30 shadow-sm flex-shrink-0
                ">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0H3z" />
                  </svg>
                </div>
                <span className="hidden sm:inline">My profile</span>
              </Link>
            ) : (
              <button
                onClick={openAuth}
                className="
                  px-5 py-2.5 rounded-full text-sm font-medium 
                  bg-indigo-600 text-white 
                  hover:bg-indigo-700 active:bg-indigo-800 
                  shadow-md hover:shadow-lg 
                  transition-all duration-200 active:scale-95
                  hidden md:block
                "
              >
                Sign In
              </button>
            )}
            {/* Mobile Hamburger */}
            <button
              className="md:hidden p-2 -mr-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition"
              onClick={() => setMobileOpen(s => !s)}
              aria-label="Toggle menu"
            >
              <svg
                className="w-7 h-7 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`
          md:hidden overflow-hidden transition-all duration-300 ease-in-out
          ${mobileOpen ? 'max-h-96 opacity-100 border-t border-gray-200' : 'max-h-0 opacity-0'}
          bg-white/95 backdrop-blur-sm
        `}
      >
        <div className="px-5 py-6 space-y-4">
          <Link
            to="/browse"
            className="block py-2.5 text-base font-medium text-gray-800 hover:text-indigo-600 transition"
            onClick={() => setMobileOpen(false)}
          >
            Browse
          </Link>

          <Link
            to="/about"
            className="block py-2.5 text-base font-medium text-gray-800 hover:text-indigo-600 transition"
            onClick={() => setMobileOpen(false)}
          >
            About
          </Link>

          <Link
            to="/contact"
            className="block py-2.5 text-base font-medium text-gray-800 hover:text-indigo-600 transition"
            onClick={() => setMobileOpen(false)}
          >
            Contact
          </Link>

          <div className="pt-4 border-t border-gray-200">
            {user && user.role === 'student' ? (
              <Link
                to="/student-dashboard"
                onClick={() => setMobileOpen(false)}
                className="
                  group flex items-center justify-center gap-2 px-3 py-1.5
                  bg-gradient-to-r from-blue-600 to-blue-700
                  hover:from-blue-700 hover:to-blue-800
                  text-white text-s font-semibold
                  rounded-full shadow-sm hover:shadow-md
                  transition-all duration-200 active:scale-[0.98]
                "
              >
                <div className="
                  w-6 h-6 rounded-full bg-white/20 text-white
                  flex items-center justify-center
                  ring-1 ring-white/30 shadow-sm flex-shrink-0
                ">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0H3z" />
                  </svg>
                </div>
                My Profile
              </Link>
            ) : (
              <button
                onClick={() => {
                  openAuth();
                  setMobileOpen(false);
                }}
                className="
                  w-full py-3 px-5 text-base font-medium 
                  bg-indigo-600 text-white rounded-xl 
                  hover:bg-indigo-700 active:bg-indigo-800 
                  shadow-md transition
                "
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Nav;
import React from "react";
import { Link, useLocation } from "react-router-dom";

const Footer = () => {
  const location = useLocation();

  const isDashboardPath = /\/(student|owner|admin|inspector)-dashboard(\/|$)/.test(
    location.pathname
  );

  if (isDashboardPath) return null;

  const footerLink = "text-sm font-medium text-gray-600 hover:text-indigo-600 hover:underline underline-offset-4 transition-all duration-200";

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Footer Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12 mb-10 md:mb-12">
          {/* Brand */}
          <div className="space-y-3">
            <Link
              to="/"
              className="text-3xl sm:text-3.5xl md:text-4xl font-extrabold tracking-tight hover:text-indigo-700 transition-colors duration-300 flex items-center gap-2"
            >
              <span>
                <span className="text-[#4A90E2]">Boarding</span><span className="text-[#F47C20]">Buddy</span>
              </span>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
              Find safe, affordable, and verified student boarding near your university.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-5">
              Quick Links
            </h4>
            <div className="flex flex-col space-y-3">
              <Link to="/browse" className={footerLink}>
                Browse Boardings
              </Link>
              <Link to="/about" className={footerLink}>
                About Us
              </Link>
              <Link to="/contact" className={footerLink}>
                Contact
              </Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-5">
              Company
            </h4>
            <div className="flex flex-col space-y-3">
              <Link to="/privacy" className={footerLink}>
                Privacy Policy
              </Link>
              <Link to="/terms" className={footerLink}>
                Terms of Service
              </Link>
              <Link to="/faq" className={footerLink}>
                FAQ
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-5">
              Get in Touch
            </h4>
            <div className="space-y-3 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a
                  href="mailto:boardingbuddy1@gmail.com"
                  className="hover:text-indigo-600 hover:underline underline-offset-4 transition-colors duration-200"
                >
                  boardingbuddy1@gmail.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +94 (0) 123 456 789
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8 flex flex-col sm:flex-row justify-between items-center gap-6 text-sm text-gray-600">
          <p>
            © {new Date().getFullYear()} BoardingBuddy. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <a
              href="https://facebook.com/BoardingBuddy"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="BoardingBuddy on Facebook"
              className="text-gray-500 hover:text-indigo-600 hover:scale-110 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="https://instagram.com/BoardingBuddy"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="BoardingBuddy on Instagram"
              className="text-gray-500 hover:text-pink-600 hover:scale-110 transition-all duration-200"
            >
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 2A3.75 3.75 0 004 7.75v8.5A3.75 3.75 0 007.75 20h8.5A3.75 3.75 0 0020 16.25v-8.5A3.75 3.75 0 0016.25 4h-8.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6zm5.25-.88a1.12 1.12 0 11-2.24 0 1.12 1.12 0 012.24 0z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
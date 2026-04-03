import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';

import { AuthProvider, AuthContext } from './context/AuthContext';
import Nav from './components/Nav';
import Home from './pages/Home';
import Browse from './pages/Browse';
import BoardingDetails from './pages/BoardingDetails';
import BoardingReviewsPage from './pages/BoardingReviewsPage';
import About from './pages/About';
import Contact from './pages/Contact';
import Footer from './components/Footer';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import FAQ from './pages/FAQ';
import StudentDashboard from './pages/StudentDashboard';
import StudentPaymentPage from './pages/StudentPaymentPage';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import InspectorDashboard from './pages/InspectorDashboard';
import LoginPage from './pages/LoginPage';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';


// Floating Jump to Top Button
function JumpToTopButton() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 200);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg p-3"
      aria-label="Jump to top"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}


// Scroll to top on route change
function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}


// Role Guard
function RoleDashboardGuard({ children }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (user && user.role && user.role !== 'student') {
    let dashboardPath = '/';

    if (user.role === 'admin') dashboardPath = '/admin-dashboard';
    else if (user.role === 'owner') dashboardPath = '/owner-dashboard';
    else if (user.role === 'inspector') dashboardPath = '/inspector-dashboard';

    if (location.pathname !== dashboardPath) {
      return <Navigate to={dashboardPath} replace />;
    }
  }

  return children;
}

// Main App
function App() {
  return (
    <Router>
      <AuthProvider>
        <RoleDashboardGuard>
          <Nav />
          <ScrollToTop />
          <JumpToTopButton />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/boardings/:id" element={<BoardingDetails />} />
            <Route path="/boardings/:id/reviews" element={<BoardingReviewsPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/faq" element={<FAQ />} />

            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/student-payment/:bookingId" element={<StudentPaymentPage />} />
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/inspector-dashboard" element={<InspectorDashboard />} />
          </Routes>

          <Footer />
        </RoleDashboardGuard>
      </AuthProvider>
    </Router>
  );
}

export default App;
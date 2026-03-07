import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Hero = () => (
  <section
  className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 text-white overflow-hidden"
  style={{ minHeight: 'calc(100vh - 4rem)' }} // 4rem = navbar height
>
  {/* Optional subtle background pattern / overlay */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.08)_0%,transparent_50%)] pointer-events-none" />

  <div className="relative max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-20 md:py-28 lg:py-32 flex flex-col justify-center items-center text-center">
    <h1 className="
      text-4xl sm:text-5xl md:text-6xl lg:text-7xl 
      font-extrabold tracking-tight 
      leading-tight md:leading-snug 
      mb-5 md:mb-7
    ">
      Find Safe, Affordable<br className="sm:hidden" /> Student Boarding
      <span className="block mt-1 sm:mt-2 text-indigo-200/90 text-3xl sm:text-4xl md:text-5xl font-bold">
        Near You
      </span>
    </h1>

    <p className="
      text-base sm:text-lg md:text-xl 
      text-indigo-100/90 max-w-3xl mx-auto 
      leading-relaxed md:leading-relaxed 
      mb-8 md:mb-10
    ">
      Discover trusted hostels & PGs with verified inspections,<br className="hidden sm:inline" />
      real student reviews and hassle-free bookings.
    </p>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
      <Link
        to="/browse"
        className="
          inline-flex items-center justify-center 
          px-7 py-3.5 sm:px-8 sm:py-4 
          bg-white text-indigo-700 
          font-semibold text-base sm:text-lg 
          rounded-xl shadow-xl hover:shadow-2xl 
          hover:bg-indigo-50 active:bg-indigo-100 
          transform hover:-translate-y-0.5 active:scale-95 
          transition-all duration-200
        "
      >
        Browse Verified Boardings
      </Link>

      <HowItWorksButton />
    </div>
  </div>
</section>
);

export default Hero;

function HowItWorksButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const goToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (location.pathname === '/' && el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    // navigate to home and request scroll
    navigate('/', { state: { scrollTo: 'how-it-works' } });
  };

  return (
    <button
      onClick={goToHowItWorks}
      className="
        inline-flex items-center px-7 py-3.5 sm:px-8 sm:py-4
        border-2 border-white/40 text-white font-medium
        rounded-xl hover:bg-white/10 transition
      "
    >
      See How It Works →
    </button>
  );
}
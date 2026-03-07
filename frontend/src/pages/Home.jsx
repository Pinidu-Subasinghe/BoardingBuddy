import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../components/home/Hero';
import WhyChoose from '../components/home/WhyChoose';
import HowItWorks from '../components/home/HowItWorks';
import Testimonials from '../components/home/Testimonials';

const Home = () => {
  const location = useLocation();

  useEffect(() => {
    const scrollTo = location.state?.scrollTo;
    if (scrollTo) {
      // delay to allow DOM paint
      setTimeout(() => {
        const el = document.getElementById(scrollTo);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // clear history state so it doesn't re-trigger
        try {
          window.history.replaceState({}, document.title);
        } catch {}
      }, 80);
    }
  }, [location]);

  return (
    <main>
      <Hero />
      <WhyChoose />
      <HowItWorks />
      <Testimonials />
    </main>
  );
};

export default Home;

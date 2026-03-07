import React from 'react';

const HowItWorks = () => (
  <section id="how-it-works" className="py-16 md:py-20 lg:py-24 bg-gradient-to-b from-gray-50 to-white">
    <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
      {/* Heading */}
      <div className="text-center mb-12 md:mb-16 lg:mb-20">
        <h2 className="
          text-3xl sm:text-4xl md:text-5xl 
          font-bold text-gray-900 tracking-tight
        ">
          How BoardingBuddy Works
        </h2>
        <p className="
          mt-4 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto
        ">
          Simple 3-step process — from discovery to moving in
        </p>
      </div>

      {/* Steps */}
      <div className="
        grid grid-cols-1 md:grid-cols-3 
        gap-6 lg:gap-8 
        relative
      ">
        {/* Connecting line (desktop only) */}
        <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-indigo-200" />

        {/* Step 1 */}
        <div className="
          group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl 
          border border-gray-100 overflow-hidden 
          transition-all duration-300 hover:-translate-y-3
          p-7 md:p-8
        ">
          <div className="
            w-14 h-14 mx-auto mb-5 rounded-full 
            bg-indigo-100 text-indigo-700 
            flex items-center justify-center text-2xl font-bold
            group-hover:bg-indigo-600 group-hover:text-white
            transition-colors duration-300
            relative z-10
          ">
            1
          </div>

          <h3 className="
            text-xl md:text-2xl font-semibold text-gray-900 mb-4 
            text-center group-hover:text-indigo-700 transition-colors
          ">
            Browse Listings
          </h3>

          <p className="
            text-gray-600 leading-relaxed text-center 
            text-base
          ">
            Search boardings near your university. Filter by price, amenities, boarding type, and verified status.
          </p>
        </div>

        {/* Step 2 */}
        <div className="
          group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl 
          border border-gray-100 overflow-hidden 
          transition-all duration-300 hover:-translate-y-3
          p-7 md:p-8
        ">
          <div className="
            w-14 h-14 mx-auto mb-5 rounded-full 
            bg-emerald-100 text-emerald-700 
            flex items-center justify-center text-2xl font-bold
            group-hover:bg-emerald-600 group-hover:text-white
            transition-colors duration-300
            relative z-10
          ">
            2
          </div>

          <h3 className="
            text-xl md:text-2xl font-semibold text-gray-900 mb-4 
            text-center group-hover:text-emerald-700 transition-colors
          ">
            Schedule Visits
          </h3>

          <p className="
            text-gray-600 leading-relaxed text-center 
            text-base
          ">
            Message owners directly in-app. Request and confirm visit times that work for you.
          </p>
        </div>

        {/* Step 3 */}
        <div className="
          group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl 
          border border-gray-100 overflow-hidden 
          transition-all duration-300 hover:-translate-y-3
          p-7 md:p-8
        ">
          <div className="
            w-14 h-14 mx-auto mb-5 rounded-full 
            bg-amber-100 text-amber-700 
            flex items-center justify-center text-2xl font-bold
            group-hover:bg-amber-600 group-hover:text-white
            transition-colors duration-300
            relative z-10
          ">
            3
          </div>

          <h3 className="
            text-xl md:text-2xl font-semibold text-gray-900 mb-4 
            text-center group-hover:text-amber-700 transition-colors
          ">
            Book Securely
          </h3>

          <p className="
            text-gray-600 leading-relaxed text-center 
            text-base
          ">
            Reserve your spot with clear terms. Get instant confirmation and peace of mind.
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorks;
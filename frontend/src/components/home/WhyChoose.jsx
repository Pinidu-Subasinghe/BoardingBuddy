import React from 'react';

const WhyChoose = () => (
  <section className="py-16 md:py-20 lg:py-24 bg-gray-50/50">
    <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
      {/* Heading */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="
          text-3xl sm:text-4xl md:text-5xl 
          font-bold text-gray-900 tracking-tight
        ">
          Why Students Choose BoardingBuddy
        </h2>
        <p className="
          mt-4 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto
        ">
          Safe, transparent, and student-first boarding search — built for university life in Sri Lanka.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {/* Card 1 */}
        <div className="
          group bg-white rounded-2xl shadow-md hover:shadow-xl 
          border border-gray-100 overflow-hidden 
          transition-all duration-300 hover:-translate-y-2
          p-7 md:p-8
        ">
          <div className="
            w-14 h-14 rounded-xl bg-indigo-100 text-indigo-600 
            flex items-center justify-center mb-5
            group-hover:bg-indigo-600 group-hover:text-white
            transition-colors duration-300
          ">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="
            text-xl font-semibold text-gray-900 mb-3 
            group-hover:text-indigo-700 transition-colors
          ">
            Trusted Inspections
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Every boarding is personally verified by certified inspectors — photos, safety checks & honest reports.
          </p>
        </div>

        {/* Card 2 */}
        <div className="
          group bg-white rounded-2xl shadow-md hover:shadow-xl 
          border border-gray-100 overflow-hidden 
          transition-all duration-300 hover:-translate-y-2
          p-7 md:p-8
        ">
          <div className="
            w-14 h-14 rounded-xl bg-emerald-100 text-emerald-600 
            flex items-center justify-center mb-5
            group-hover:bg-emerald-600 group-hover:text-white
            transition-colors duration-300
          ">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="
            text-xl font-semibold text-gray-900 mb-3 
            group-hover:text-emerald-700 transition-colors
          ">
            Student-friendly Pricing
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Clear, all-inclusive monthly rates — no hidden charges, broker fees or surprise costs.
          </p>
        </div>

        {/* Card 3 */}
        <div className="
          group bg-white rounded-2xl shadow-md hover:shadow-xl 
          border border-gray-100 overflow-hidden 
          transition-all duration-300 hover:-translate-y-2
          p-7 md:p-8
        ">
          <div className="
            w-14 h-14 rounded-xl bg-amber-100 text-amber-600 
            flex items-center justify-center mb-5
            group-hover:bg-amber-600 group-hover:text-white
            transition-colors duration-300
          ">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="
            text-xl font-semibold text-gray-900 mb-3 
            group-hover:text-amber-700 transition-colors
          ">
            Easy Communication
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Message owners directly, request visits, and get quick replies — all inside the app.
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default WhyChoose;
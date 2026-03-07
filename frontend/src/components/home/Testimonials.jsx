import React from 'react';

const testimonials = [
  { id: 1, name: 'Sahan Ovinda',   text: 'Found a great place within 2 days. Inspections gave me confidence.' },
  { id: 2, name: 'Charitha Jayarathna',  text: 'Easy to contact owners and schedule visits. Highly recommended.' },
  { id: 3, name: 'Dilusha Ranasinghe', text: 'Transparent pricing and friendly support helped a lot.' }
];

const Testimonials = () => (
  <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-b from-gray-50 to-white">
    <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
      {/* Heading */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="
          text-3xl sm:text-4xl md:text-5xl 
          font-bold text-gray-900 tracking-tight
        ">
          What Sri Lankan Students Say
        </h2>
        <p className="
          mt-4 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto
        ">
          Real experiences from students who found their perfect boarding through BoardingBuddy
        </p>
      </div>

      {/* Testimonials Grid */}
      <div className="
        grid grid-cols-1 md:grid-cols-3 
        gap-6 lg:gap-8
      ">
        {testimonials.map(t => (
          <div
            key={t.id}
            className="
              group relative bg-white rounded-2xl 
              shadow-lg hover:shadow-2xl 
              border border-gray-100 overflow-hidden 
              transition-all duration-300 hover:-translate-y-3
              p-7 md:p-8
            "
          >
            {/* Quote mark decoration */}
            <div className="
              absolute top-6 left-6 text-6xl text-indigo-100 font-serif 
              leading-none pointer-events-none select-none
              group-hover:text-indigo-50 transition-colors
            ">
              “
            </div>

            <div className="relative z-10">
              <p className="
                text-gray-700 text-lg leading-relaxed mb-6 
                italic
              ">
                {t.text}
              </p>

              <div className="flex items-center gap-3">
                {/* Avatar placeholder */}
                <div className="
                  w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 
                  flex items-center justify-center text-white font-semibold text-sm
                  shadow-sm
                ">
                  {t.name.charAt(0)}
                </div>

                <p className="
                  font-semibold text-gray-900 
                  group-hover:text-indigo-700 transition-colors
                ">
                  — {t.name}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
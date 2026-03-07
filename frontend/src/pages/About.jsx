import React from 'react';

const About = () => (
  <div className="min-h-screen bg-gray-50/50 py-12 md:py-16 lg:py-20">
    <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
      {/* Hero / Intro Section */}
      <div className="text-center mb-16 md:mb-20">
        <h1 className="
          text-4xl sm:text-5xl md:text-6xl 
          font-extrabold tracking-tight 
          mb-5 md:mb-6
        ">
          About <span><span className="text-[#4A90E2]">Boarding</span><span className="text-[#F47C20]">Buddy</span></span>
        </h1>
        <p className="
          text-lg sm:text-xl md:text-2xl 
          text-gray-600 max-w-4xl mx-auto leading-relaxed
        ">
          Connecting Sri Lankan students with safe, affordable, and verified boarding places — 
          <span className="text-indigo-600 font-semibold">built by students, for students</span>.
        </p>
      </div>

      {/* Mission & Story */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-16 md:mb-20 items-center">
        <div className="space-y-6 lg:space-y-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Our Mission
            </h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              We believe every university student deserves a safe, comfortable, and fairly priced place to stay — without hidden fees, unreliable landlords, or endless searching.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              How It Started
            </h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              BoardingBuddy began in 2026 as a university project by a group of Information Technology students who themselves struggled to find decent boarding near campus. After countless frustrating experiences with brokers, outdated listings, and unsafe places — we decided to build something better.
            </p>
            <p className="text-gray-700 leading-relaxed text-lg mt-4">
              What started as a class assignment quickly turned into a real platform — now helping hundreds of students across Sri Lanka find verified, student-friendly accommodation.
            </p>
          </div>
        </div>

        {/* Right side visual/quote block */}
        <div className="
          bg-white rounded-2xl shadow-xl p-8 md:p-10 
          border border-gray-100
        ">
          <blockquote className="text-xl md:text-2xl italic text-gray-700 leading-relaxed mb-6">
            “We were tired of guessing whether a place was safe or worth the price. So we built the solution we wished existed.”
          </blockquote>
          <p className="text-right font-medium text-indigo-600">
            — The BoardingBuddy Team
          </p>
        </div>
      </div>

      {/* Team Section */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Meet the Team
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          A small group of passionate 3rd year university students who turned a project into something real.
        </p>
      </div>

      <div className="
        grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 
        gap-6 md:gap-8 lg:gap-10
      ">
        {[
          { name: "Pinidu Pramudith", role: "Frontend & UI/UX Developer", uni: "SLIIT" },
          { name: "Navod Wijesooriya", role: "Backend & Database Developer", uni: "SLIIT" },
          { name: "Bhagya Navodyani", role: "Backend & Database Developer", uni: "SLIIT" },
          { name: "Kavishka Malshan", role: "Mobile & Testing", uni: "SLIIT" },
        ].map((member, i) => (
          <div
            key={i}
            className="
              group bg-white rounded-xl shadow-md hover:shadow-xl 
              border border-gray-100 overflow-hidden 
              transition-all duration-300 hover:-translate-y-2
              p-6 text-center
            "
          >
            <div className="
              w-20 h-20 mx-auto mb-4 rounded-full 
              bg-gradient-to-br from-indigo-500 to-indigo-700 
              flex items-center justify-center text-white 
              font-bold text-2xl shadow-md
            ">
              {member.name.charAt(0)}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">
              {member.name}
            </h3>
            <p className="text-sm text-indigo-600 font-medium mb-2">
              {member.role}
            </p>
            <p className="text-xs text-gray-500">
              {member.uni}
            </p>
          </div>
        ))}
      </div>

      {/* Closing note */}
      <div className="text-center mt-16 md:mt-20">
        <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
          BoardingBuddy is more than a platform — it's a student-led movement to make university life in Sri Lanka safer, simpler, and more affordable.
        </p>
      </div>
    </div>
  </div>
);

export default About;
import React from 'react';
import AuthForm from '../components/AuthForm';

const Signup = () => {
  return (
    <section className="min-h-[calc(100vh-8rem)] bg-slate-50 py-8 px-4">
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
        <div className="bg-gradient-to-br from-sky-700 via-indigo-700 to-blue-900 p-8 sm:p-10 lg:p-12 text-white flex items-center justify-center">
          <div className="max-w-md text-center lg:text-left space-y-5">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">BoardingBuddy 🏠</h1>
            <p className="text-base sm:text-lg text-blue-100 leading-relaxed">
              Find safe and reliable boarding places with ease.
            </p>
            <ul className="space-y-3 text-blue-50">
              <li className="flex items-center gap-2 justify-center lg:justify-start">Verified properties</li>
              <li className="flex items-center gap-2 justify-center lg:justify-start">Easy communication</li>
              <li className="flex items-center gap-2 justify-center lg:justify-start">Secure platform</li>
            </ul>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-8 lg:p-10 flex items-center justify-center">
          <AuthForm initialMode="signup" />
        </div>
      </div>
    </section>
  );
};

export default Signup;

import React from 'react';
import AuthForm from '../components/AuthForm';

const LoginPage = () => {
  return (
    <section className="min-h-[calc(100vh-6.5rem)] bg-[#eef1f7] px-4 py-4 sm:px-6 sm:py-6 lg:flex lg:items-center">
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl lg:max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#3949ff] via-[#2f35df] to-[#1f27ab] p-10 text-white lg:flex lg:min-h-[560px] lg:items-center">
            <div className="absolute -right-24 -bottom-32 h-[500px] w-[500px] rounded-full border border-white/20" />
            <div className="absolute -right-14 -bottom-24 h-[420px] w-[420px] rounded-full border border-white/15" />
            <div className="absolute -right-4 -bottom-16 h-[340px] w-[340px] rounded-full border border-white/10" />

            <div className="relative z-10 max-w-xl text-center lg:text-left">
              <h1 className="text-5xl font-extrabold tracking-tight leading-[1.08]">
                Hello<br />BoardingBuddy!
              </h1>

              <p className="mt-6 max-w-lg text-lg text-white/90 leading-relaxed">
                Find safe, verified boarding places near your university and manage everything in one place.
              </p>
            </div>
          </div>

          <div className="bg-[#f8f9fc] p-5 sm:p-8 lg:p-10 flex items-center justify-center">
            <AuthForm initialMode="login" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
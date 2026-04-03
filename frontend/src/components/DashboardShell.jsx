import React, { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import NotificationBell from './NotificationBell';

const DashboardShell = ({
  user,
  titleEmoji = '👋',
  activeMenu,
  setActiveMenu,
  menuItems = [],
  logout,
  children
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const contentScrollRef = useRef(null);

  const hasTopNav = user && user.role === 'student';
  const showNotifications = user && user.role !== 'student';

  const confirmLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your account.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout!'
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
      }
    });
  };

  useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeMenu]);

  return (
    <div className={`flex overflow-hidden bg-gray-100 ${hasTopNav ? 'h-[calc(100vh-4.1rem)]' : 'h-screen'}`}>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-white border-r flex-col justify-between">
        <div>
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Hi {user?.name || 'User'} {titleEmoji}</h2>
            {/* Role color pill */}
            <div className="mt-2">
              {user?.role && (
                <span
                  className={`inline-block px-3 py-1 text-xs font-semibold rounded-full capitalize
                    ${user.role === 'admin' ? 'bg-red-100 text-red-700' :
                      user.role === 'owner' ? 'bg-blue-100 text-blue-700' :
                      user.role === 'student' ? 'bg-green-100 text-green-700' :
                      user.role === 'inspector' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-200 text-gray-600'}
                  `}
                >
                  {user.role}
                </span>
              )}
            </div>
          </div>

          <nav className="p-4 space-y-2">
            {menuItems.map(item => (
              <button
                key={item.key}
                onClick={() => setActiveMenu(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition ${
                  activeMenu === item.key ? 'bg-indigo-500 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current opacity-70"></span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t">
          <button onClick={confirmLogout} className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm transition">
            Logout
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-6">Hi {user?.name || 'User'} {titleEmoji}</h2>
              <div className="space-y-2">
                {menuItems.map(item => (
                  <button
                    key={item.key}
                    onClick={() => { setActiveMenu(item.key); setMobileOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition ${activeMenu === item.key ? 'bg-indigo-500 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => { setMobileOpen(false); confirmLogout(); }} className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm">
              Logout
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {showNotifications && (
          <div className="fixed top-4 right-10 z-40">
            <NotificationBell user={user} />
          </div>
        )}
        <div className="flex items-center justify-between px-4 md:px-6 h-14 bg-white border-b md:hidden">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <p className="text-sm font-medium text-gray-700">{user?.name || 'Dashboard'}</p>
          <div />
        </div>

        <div ref={contentScrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50">{children}</div>
      </main>
    </div>
  );
};

export default DashboardShell;
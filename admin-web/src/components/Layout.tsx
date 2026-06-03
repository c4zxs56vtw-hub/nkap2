import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  MessageSquare, 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon,
  Coins,
  Settings,
  ArrowUpDown,
  Bell,
  History
} from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('nkap_admin_user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    setAdminUser(JSON.parse(userStr));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('nkap_admin_token');
    localStorage.removeItem('nkap_admin_user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Vue d\'ensemble', path: '/', icon: LayoutDashboard },
    { name: 'Dossiers KYC', path: '/kyc', icon: ShieldCheck },
    { name: 'Utilisateurs', path: '/users', icon: Users },
    { name: 'Tontines', path: '/tontines', icon: Coins },
    { name: 'Transactions', path: '/transactions', icon: ArrowUpDown },
    { name: 'Tickets Support', path: '/support', icon: MessageSquare },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Journal d\'Activité', path: '/audit-logs', icon: History },
    { name: 'Paramètres', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-900 text-white p-6 border-r border-slate-800">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-brand-500 to-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Nkap Admin</h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Portail de Gestion</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/15' 
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card info inside sidebar footer */}
        {adminUser && (
          <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 mt-auto space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
                {adminUser.avatarUrl ? (
                  <img src={adminUser.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{adminUser.full_name || 'Admin User'}</p>
                <span className="inline-block text-[9px] font-extrabold text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded-full mt-1 border border-brand-500/20">
                  {adminUser.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-bold py-2.5 rounded-xl transition-all border border-slate-700/40"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        )}
      </aside>

      {/* Sidebar - Mobile Toggle & Drawer */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg border border-slate-800"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30" onClick={() => setMobileOpen(false)}>
          <aside 
            className="w-72 bg-slate-900 text-white h-full p-6 flex flex-col border-r border-slate-800 animate-slide-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-10 mt-16 px-2">
              <div className="w-10 h-10 bg-gradient-to-tr from-brand-500 to-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Nkap Admin</h1>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wider">Portail de Gestion</p>
              </div>
            </div>

            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                      isActive 
                        ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/15' 
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {adminUser && (
              <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 mt-auto space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
                    {adminUser.avatarUrl ? (
                      <img src={adminUser.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{adminUser.full_name || 'Admin User'}</p>
                    <span className="inline-block text-[9px] font-extrabold text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded-full mt-1 border border-brand-500/20">
                      {adminUser.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-bold py-2.5 rounded-xl transition-all border border-slate-700/40"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Main Page Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Desktop Navbar to show status and welcome */}
        <header className="h-20 bg-white border-b border-slate-200 hidden md:flex items-center justify-between px-10">
          <div></div>
          <div className="flex items-center gap-4">
            {adminUser && (
              <span className="text-sm font-semibold text-slate-600">
                Bonjour, <strong className="text-slate-900">{adminUser.full_name || 'Admin'}</strong>
              </span>
            )}
          </div>
        </header>

        {/* Content container */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto mt-16 md:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}

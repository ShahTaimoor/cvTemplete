import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FileText,
  LayoutDashboard,
  CreditCard,
  LogOut,
  Crown,
  PenLine,
  Mail,
  Menu,
  X,
} from 'lucide-react';
import { logout } from '../../store/authSlice';
import { overlayFade, drawerPanel } from '../../lib/motion';

const NAV = [
  { to: '/dashboard', label: 'My Resumes', icon: LayoutDashboard },
  { to: '/pricing', label: 'Plans & Pricing', icon: CreditCard },
];

export default function DashboardLayout({ children, fullHeight = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const plan = user?.subscription?.plan || 'free';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (path) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path);

  const handleSignOut = () => {
    dispatch(logout());
    navigate('/');
  };

  // Shared between the desktop sidebar and the mobile drawer so nav items,
  // active-state logic, and sign-out all come from one place.
  const renderNavAndFooter = (onNavigate) => (
    <>
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(to)
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
        {location.pathname.startsWith('/builder') && (
          <span className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-brand-50 text-brand-700">
            <PenLine size={18} />
            Resume Editor
          </span>
        )}
        {location.pathname.startsWith('/cover-letter') && (
          <span className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-brand-50 text-brand-700">
            <Mail size={18} />
            Cover Letter
          </span>
        )}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 mb-3">
          <Crown size={16} className="text-amber-600" />
          <span className="text-xs font-semibold text-slate-700 capitalize">{plan} plan</span>
        </div>
        <p className="px-3 text-xs text-slate-500 truncate mb-2">{user?.email}</p>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className={`flex bg-slate-50 ${fullHeight ? 'h-screen' : 'min-h-screen'}`}>
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white sticky top-0 h-screen overflow-y-auto">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-200">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <FileText size={18} />
            </span>
            ResumeForge
          </Link>
        </div>
        {renderNavAndFooter()}
      </aside>

      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            className="md:hidden fixed inset-0 z-50 bg-slate-900/60 flex"
            onClick={() => setMobileNavOpen(false)}
            initial={overlayFade.initial}
            animate={overlayFade.animate}
            exit={overlayFade.exit}
            transition={overlayFade.transition}
          >
            <motion.div
              className="w-64 max-w-[80vw] h-full bg-white flex flex-col shadow-xl"
              onClick={(e) => e.stopPropagation()}
              initial={drawerPanel.initial}
              animate={drawerPanel.animate}
              exit={drawerPanel.exit}
              transition={drawerPanel.transition}
            >
              <div className="h-14 flex items-center justify-between gap-2 px-4 border-b border-slate-200 shrink-0">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 font-bold text-slate-900"
                  onClick={() => setMobileNavOpen(false)}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                    <FileText size={18} />
                  </span>
                  ResumeForge
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close menu"
                  className="text-slate-500 hover:text-slate-800"
                >
                  <X size={20} />
                </button>
              </div>
              {renderNavAndFooter(() => setMobileNavOpen(false))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex-1 flex flex-col min-w-0 ${fullHeight ? 'h-full overflow-hidden' : ''}`}>
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-slate-200 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="text-slate-600 hover:text-slate-900"
          >
            <Menu size={22} />
          </button>
          <Link to="/dashboard" className="font-bold text-slate-900 flex items-center gap-2">
            <FileText size={18} className="text-brand-600" />
            ResumeForge
          </Link>
          <Link to="/pricing" className="text-sm text-brand-600 font-medium">
            Plans
          </Link>
        </header>
        <main className={fullHeight ? 'flex-1 overflow-hidden' : 'flex-1'}>{children}</main>
      </div>
    </div>
  );
}

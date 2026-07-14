import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FileText,
  LayoutDashboard,
  CreditCard,
  LogOut,
  Crown,
  PenLine,
  Mail,
} from 'lucide-react';
import { logout } from '../../store/authSlice';

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

  const isActive = (path) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path);

  return (
    <div className={`flex bg-slate-50 ${fullHeight ? 'h-screen' : 'min-h-screen'}`}>
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-200">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <FileText size={18} />
            </span>
            ResumeForge
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
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
            onClick={() => {
              dispatch(logout());
              navigate('/');
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-w-0 ${fullHeight ? 'h-full overflow-hidden' : ''}`}>
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-slate-200 bg-white shrink-0">
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

import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FileText, LogOut } from 'lucide-react';
import { logout } from '../../store/authSlice';

export default function Navbar() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <FileText size={20} />
          </span>
          ResumeForge
        </Link>
        <nav className="flex items-center gap-2 sm:gap-6 text-sm font-medium">
          <Link to="/pricing" className="text-slate-600 hover:text-brand-600 px-2 py-1">
            Pricing
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-slate-600 hover:text-brand-600 px-2 py-1">
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  dispatch(logout());
                  navigate('/');
                }}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 px-2 py-1"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-600 hover:text-brand-600 px-2 py-1">
                Sign in
              </Link>
              <Link to="/register" className="app-btn-primary !py-2 !px-4">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

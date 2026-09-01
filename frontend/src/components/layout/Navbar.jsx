import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { logoutUser } from '../../store/authSlice';
import MotionIcon from '../common/MotionIcon';

export default function Navbar() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // This Navbar is shared across every public page (Landing, Pricing,
  // Share), but the scroll-reactive transparent-to-solid treatment is a
  // Landing-page-specific first-impression effect, not a site-wide nav
  // behavior change — so it's gated to '/' only. Every other page keeps
  // today's plain always-solid header, completely unaffected.
  const isLanding = location.pathname === '/';
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 240], [0, 0.95]);
  const blurPx = useTransform(scrollY, [0, 240], [0, 8]);
  const borderOpacity = useTransform(scrollY, [0, 240], [0, 1]);
  const shadowOpacity = useTransform(scrollY, [0, 240], [0, 0.08]);
  const backgroundColor = useTransform(bgOpacity, (v) => `rgba(255,255,255,${v})`);
  const backdropFilter = useTransform(blurPx, (v) => `blur(${v}px)`);
  const borderColor = useTransform(borderOpacity, (v) => `rgba(226,232,240,${v})`);
  const boxShadow = useTransform(shadowOpacity, (v) => `0 4px 20px 0 rgba(15,23,42,${v})`);

  return (
    <motion.header
      className={`sticky top-0 z-50 border-b ${isLanding ? '' : 'border-slate-200 bg-white/95 backdrop-blur-sm'}`}
      style={isLanding ? { backgroundColor, backdropFilter, borderColor, boxShadow } : undefined}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-slate-900">
          <img src="/logo.png" alt="ResumeForge" className="h-9 w-9 object-contain shrink-0" />
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
                  dispatch(logoutUser());
                  navigate('/');
                }}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 px-2 py-1"
              >
                <MotionIcon><LogOut size={16} /></MotionIcon>
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
    </motion.header>
  );
}

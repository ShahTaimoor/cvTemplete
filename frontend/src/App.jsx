import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/auth/ProtectedRoute';
import OfflineOverlay from './components/common/OfflineOverlay';
import { ToastProvider } from './context/ToastProvider';
import { ConfirmDialogProvider } from './context/ConfirmDialogProvider';
import { fetchMe } from './store/authSlice';
import { pageFade } from './lib/motion';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ResumesPage from './pages/ResumesPage';
import CoverLettersPage from './pages/CoverLettersPage';
import BuilderPage from './pages/BuilderPage';
import PricingPage from './pages/PricingPage';
import SharePage from './pages/SharePage';
import CoverLetterSharePage from './pages/CoverLetterSharePage';
import PrintPage from './pages/PrintPage';
import CoverLetterPrintPage from './pages/CoverLetterPrintPage';
import CoverLetterPage from './pages/CoverLetterPage';
import AdminPurchaseRequestsPage from './pages/AdminPurchaseRequestsPage';

function PageTransition({ children }) {
  return (
    <motion.div
      initial={pageFade.initial}
      animate={pageFade.animate}
      exit={pageFade.exit}
      transition={pageFade.transition}
    >
      {children}
    </motion.div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const { user, authChecked } = useSelector((s) => s.auth);

  const usesAppShell =
    user &&
    (location.pathname === '/dashboard' ||
      location.pathname === '/resumes' ||
      location.pathname === '/cover-letters' ||
      location.pathname === '/pricing' ||
      location.pathname.startsWith('/admin') ||
      location.pathname.startsWith('/builder') ||
      location.pathname.startsWith('/cover-letter'));

  // /pricing is the one dual-audience route here — reachable both logged
  // out and logged in, so it isn't behind ProtectedRoute (which already
  // withholds rendering entirely until authChecked settles). Without this,
  // `usesAppShell` reads `user` before the initial fetchMe() resolves,
  // sees it as null, and briefly renders this public Navbar (logged-out
  // "Sign in"/"Get started" buttons) over a genuinely logged-in user's
  // hard refresh — PricingPage itself waits on authChecked too (see its
  // own skeleton), so withholding the navbar here keeps the two in sync
  // instead of showing the wrong chrome around a correct skeleton.
  const showPublicNav =
    !['/login', '/register'].includes(location.pathname) &&
    !location.pathname.startsWith('/print') &&
    !usesAppShell &&
    (location.pathname !== '/pricing' || authChecked);

  return (
    <>
      {showPublicNav && <Navbar />}
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
          <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
          <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
          <Route path="/pricing" element={<PageTransition><PricingPage /></PageTransition>} />
          <Route path="/share/:token" element={<PageTransition><SharePage /></PageTransition>} />
          <Route path="/share/cover-letter/:token" element={<PageTransition><CoverLetterSharePage /></PageTransition>} />
          <Route path="/print/resume/:id" element={<PrintPage />} />
          <Route path="/print/cover-letter/:id" element={<CoverLetterPrintPage />} />
          <Route
            path="/cover-letter/:id"
            element={
              <ProtectedRoute>
                <PageTransition><CoverLetterPage /></PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <PageTransition><DashboardPage /></PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/resumes"
            element={
              <ProtectedRoute>
                <PageTransition><ResumesPage /></PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cover-letters"
            element={
              <ProtectedRoute>
                <PageTransition><CoverLettersPage /></PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/builder/:id"
            element={
              <ProtectedRoute>
                <PageTransition><BuilderPage /></PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/purchase-requests"
            element={
              <ProtectedRoute requireSuperAdmin>
                <PageTransition><AdminPurchaseRequestsPage /></PageTransition>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AnimatePresence>
    </>
  );
}

function App() {
  const dispatch = useDispatch();

  // The auth cookie is httpOnly, so this is the only way to know whether a
  // session already exists — the cookie (if present) is sent automatically.
  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmDialogProvider>
          <AppRoutes />
          <OfflineOverlay />
        </ConfirmDialogProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;

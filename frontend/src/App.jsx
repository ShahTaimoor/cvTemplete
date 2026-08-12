import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ToastProvider } from './context/ToastProvider';
import { ConfirmDialogProvider } from './context/ConfirmDialogProvider';
import { fetchMe } from './store/authSlice';
import { pageFade } from './lib/motion';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BuilderPage from './pages/BuilderPage';
import PricingPage from './pages/PricingPage';
import SharePage from './pages/SharePage';
import PrintPage from './pages/PrintPage';
import CoverLetterPage from './pages/CoverLetterPage';

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
  const { token } = useSelector((s) => s.auth);

  const usesAppShell =
    token &&
    (location.pathname === '/dashboard' ||
      location.pathname === '/pricing' ||
      location.pathname.startsWith('/builder') ||
      location.pathname.startsWith('/cover-letter'));

  const showPublicNav =
    !['/login', '/register'].includes(location.pathname) && !usesAppShell;

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
          <Route path="/print/resume/:id" element={<PrintPage />} />
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
            path="/builder/:id"
            element={
              <ProtectedRoute>
                <PageTransition><BuilderPage /></PageTransition>
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
  const { token } = useSelector((s) => s.auth);

  useEffect(() => {
    if (token) dispatch(fetchMe());
  }, [token, dispatch]);

  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmDialogProvider>
          <AppRoutes />
        </ConfirmDialogProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;

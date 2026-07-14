import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { fetchMe } from './store/authSlice';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BuilderPage from './pages/BuilderPage';
import PricingPage from './pages/PricingPage';
import SharePage from './pages/SharePage';
import PrintPage from './pages/PrintPage';
import CoverLetterPage from './pages/CoverLetterPage';

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
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/share/:token" element={<SharePage />} />
        <Route path="/print/resume/:id" element={<PrintPage />} />
        <Route
          path="/cover-letter/:id"
          element={
            <ProtectedRoute>
              <CoverLetterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/builder/:id"
          element={
            <ProtectedRoute>
              <BuilderPage />
            </ProtectedRoute>
          }
        />
      </Routes>
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
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;

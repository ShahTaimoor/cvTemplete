import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../store/authSlice';
import { useEffect } from 'react';
import AuthSplitLayout from '../components/layout/AuthSplitLayout';

export default function LoginPage() {
  const { register, handleSubmit } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(clearError());
    if (token) navigate('/dashboard');
  }, [token, navigate, dispatch]);

  const onSubmit = (data) => {
    dispatch(loginUser(data)).then((r) => {
      if (r.meta.requestStatus === 'fulfilled') navigate('/dashboard');
    });
  };

  return (
    <AuthSplitLayout title="Sign in" subtitle="Welcome back. Continue building your resume.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <div>
          <label className="app-label">Email</label>
          <input type="email" {...register('email', { required: true })} className="app-input" />
        </div>
        <div>
          <label className="app-label">Password</label>
          <input type="password" {...register('password', { required: true })} className="app-input" />
        </div>
        <button type="submit" disabled={loading} className="app-btn-primary w-full">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
            Create account
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}

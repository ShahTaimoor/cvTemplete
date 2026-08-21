import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../store/authSlice';
import { useEffect } from 'react';
import AuthSplitLayout from '../components/layout/AuthSplitLayout';

export default function RegisterPage() {
  const { register, handleSubmit } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(clearError());
    if (user) navigate('/dashboard');
  }, [user, navigate, dispatch]);

  const onSubmit = (data) => {
    dispatch(registerUser(data)).then((r) => {
      if (r.meta.requestStatus === 'fulfilled') navigate('/dashboard');
    });
  };

  return (
    <AuthSplitLayout title="Create your account" subtitle="Start free. Upgrade when you need more templates.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <div>
          <label className="app-label">Full name</label>
          <input {...register('name', { required: true })} className="app-input" />
        </div>
        <div>
          <label className="app-label">Email</label>
          <input type="email" {...register('email', { required: true })} className="app-input" />
        </div>
        <div>
          <label className="app-label">Password</label>
          <input
            type="password"
            {...register('password', { required: true, minLength: 6 })}
            className="app-input"
          />
          <p className="text-xs text-slate-500 mt-1">At least 6 characters</p>
        </div>
        <button type="submit" disabled={loading} className="app-btn-primary w-full">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}

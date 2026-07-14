import { Link } from 'react-router-dom';
import { FileText, CheckCircle2 } from 'lucide-react';

const AUTH_IMAGE =
  'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1400&q=80';

const highlights = [
  '51+ professional templates',
  'Live preview & one-click PDF',
  'ATS-friendly layouts',
];

export default function AuthSplitLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      <div className="w-full lg:w-[min(480px,42%)] xl:w-[520px] shrink-0 flex flex-col justify-center px-6 sm:px-10 lg:px-12 py-10 lg:py-14">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-slate-900 mb-10">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <FileText size={20} />
          </span>
          ResumeForge
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-slate-600 text-sm sm:text-base">{subtitle}</p>}
        </div>

        {children}
      </div>

      <div className="hidden lg:flex flex-1 relative min-h-[320px] bg-slate-200">
        <img
          src={AUTH_IMAGE}
          alt="Professional resume workspace"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/50" />
        <div className="relative z-10 flex flex-col justify-end p-12 xl:p-16 text-white max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-100 mb-3">
            Trusted by job seekers
          </p>
          <h2 className="text-3xl xl:text-4xl font-bold leading-tight mb-6">
            Build a resume that gets interviews
          </h2>
          <ul className="space-y-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-3 text-slate-100">
                <CheckCircle2 size={20} className="text-brand-100 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { FileText, Download, Palette, Shield, Sparkles, ArrowRight } from 'lucide-react';

const features = [
  { icon: FileText, title: '330+ templates', desc: 'US, UK, EU, Pakistan, Saudi, Gulf & 25+ country CV formats' },
  { icon: Palette, title: 'Custom themes', desc: 'Brand colors and fonts on Pro and Premium' },
  { icon: Download, title: 'PDF export', desc: 'Download a polished resume that matches your preview' },
  { icon: Shield, title: 'ATS checker', desc: 'Optimize keywords before you apply' },
  { icon: Sparkles, title: 'Auto-save', desc: 'Your work is saved as you type' },
];

export default function LandingPage() {
  return (
    <div className="bg-white">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-brand-600 mb-4">Professional CV builder</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1]">
              Build a resume that opens doors
            </h1>
            <p className="text-lg text-slate-600 mt-6 max-w-xl leading-relaxed">
              ResumeForge gives you recruiter-ready templates, live preview, and simple pricing — starting free,
              from Rs. 150/month (PKR).
            </p>
            <div className="flex flex-wrap gap-3 mt-10">
              <Link to="/register" className="app-btn-primary !px-8 !py-3 text-base">
                Start free
                <ArrowRight size={18} className="ml-2" />
              </Link>
              <Link to="/pricing" className="app-btn-secondary !px-8 !py-3 text-base">
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">Everything you need to get hired</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="app-card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600 mb-4">
                <Icon size={22} />
              </span>
              <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-brand-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-white">
            <h2 className="text-2xl font-bold">Ready to create your resume?</h2>
            <p className="text-brand-100 mt-2">Join free — no credit card required.</p>
          </div>
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
          >
            Get started
          </Link>
        </div>
      </section>
    </div>
  );
}

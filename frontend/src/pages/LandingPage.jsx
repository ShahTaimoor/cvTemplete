import { Link } from 'react-router-dom';
import { FileText, Download, Palette, Shield, Sparkles, ArrowRight } from 'lucide-react';

const features = [
  { icon: FileText, title: '330+ templates', desc: 'US, UK, EU, Pakistan, Saudi, Gulf & 25+ country CV formats.' },
  { icon: Palette, title: 'Custom themes', desc: 'Personalize brand colors and professional fonts on Pro & Premium.' },
  { icon: Download, title: 'PDF export', desc: 'Instantly download a polished resume that matches your live preview.' },
  { icon: Shield, title: 'ATS checker', desc: 'Optimize keywords and formatting to clear recruiter scanning systems.' },
  { icon: Sparkles, title: 'Auto-save', desc: 'Never lose your progress. Your drafts are saved automatically as you edit.' },
];

export default function LandingPage() {
  return (
    <div className="bg-white text-slate-900 min-h-screen relative overflow-hidden transition-colors duration-500">
      {/* Soft Light Ambient Glow Blobs */}
      <div className="glow-blob bg-blue-100/40 w-[450px] h-[450px] -top-20 -right-20 animate-blob-one opacity-60" />
      <div className="glow-blob bg-indigo-50/30 w-[350px] h-[350px] top-[35%] -left-20 animate-blob-two opacity-50" />
      <div className="glow-blob bg-teal-50/20 w-[500px] h-[500px] -bottom-32 -right-32 animate-blob-three opacity-40" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20 sm:pt-32 sm:pb-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 bg-brand-50 border border-brand-200 text-brand-700">
            <Sparkles size={13} />
            Professional CV Builder
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.08] text-slate-950">
            Build a resume that <br className="hidden sm:inline" />
            opens executive doors
          </h1>
          
          <p className="text-lg mt-6 max-w-xl leading-relaxed text-slate-600">
            ResumeForge offers recruiter-approved templates, instant PDF downloads, and premium customization starting free, from Rs. 150/month (PKR).
          </p>
          
          <div className="flex flex-wrap gap-4 mt-10">
            <Link 
              to="/register" 
              className="inline-flex items-center justify-center rounded-lg px-8 py-4 font-semibold transition-all duration-300 bg-brand-600 text-white hover:bg-brand-700 shadow-md hover:shadow-lg"
            >
              Start Building Free
              <ArrowRight size={18} className="ml-2" />
            </Link>
            <Link 
              to="/pricing" 
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-8 py-4 font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-300"
            >
              View Plans & Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 border-t border-slate-100">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Everything you need to get hired
          </h2>
          <p className="mt-2 text-slate-500">
            Build an ATS-optimized resume in minutes using our professional tools.
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div 
              key={title} 
              className="hover-float p-6 flex flex-col justify-between rounded-2xl border bg-slate-50 border-slate-200/60 text-slate-900 shadow-sm hover:bg-white hover:border-brand-200 hover:shadow-md transition-all duration-300"
            >
              <div>
                <span className="flex h-12 w-12 items-center justify-center rounded-lg border bg-brand-50 text-brand-600 border-brand-100 mb-6">
                  <Icon size={24} />
                </span>
                <h3 className="text-lg font-semibold mb-2 text-slate-900">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-24 pt-8">
        <div className="relative rounded-2xl overflow-hidden border p-8 sm:p-14 text-center border-slate-200 bg-slate-50">
          <h2 className="text-3xl font-bold mb-3 text-slate-900">Ready to transform your career?</h2>
          <p className="max-w-md mx-auto mb-8 text-slate-600">
            Create your account today and design your premium CV. No credit card required.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-lg px-8 py-3.5 font-semibold transition-colors shadow-md hover:shadow-lg bg-brand-600 text-white hover:bg-brand-700"
          >
            Get Started Instantly
          </Link>
        </div>
      </section>
    </div>
  );
}




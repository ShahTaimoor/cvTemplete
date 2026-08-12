import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Download, Palette, Shield, Sparkles, ArrowRight } from 'lucide-react';

const features = [
  { icon: FileText, title: '330+ templates', desc: 'US, UK, EU, Pakistan, Saudi, Gulf & 25+ country CV formats' },
  { icon: Palette, title: 'Custom themes', desc: 'Brand colors and fonts on Pro and Premium' },
  { icon: Download, title: 'PDF export', desc: 'Download a polished resume that matches your preview' },
  { icon: Shield, title: 'ATS checker', desc: 'Optimize keywords before you apply' },
  { icon: Sparkles, title: 'Auto-save', desc: 'Your work is saved as you type' },
];

/**
 * Landing-page-only motion language: bolder, more expressive than the rest
 * of the app (see frontend/src/lib/motion.js for the functional-app tokens).
 * This is a one-time first impression, not a tool people click through
 * dozens of times a day, so longer durations and spring physics are fair
 * game here.
 */
const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const heroItem = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 110, damping: 15, mass: 0.7 },
  },
};

const featuresContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const featureCard = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

export default function LandingPage() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-50">
        {/* Floating decorative orbs — subtle parallax-style ambient motion */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl"
          animate={{ y: [0, -22, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-1/3 -left-20 h-72 w-72 rounded-full bg-brand-100/60 blur-3xl"
          animate={{ y: [0, 18, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <motion.div
            className="max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={heroContainer}
          >
            <motion.p variants={heroItem} className="text-sm font-semibold text-brand-600 mb-4">
              Professional CV builder
            </motion.p>
            <motion.h1
              variants={heroItem}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1]"
            >
              Build a resume that opens doors
            </motion.h1>
            <motion.p variants={heroItem} className="text-lg text-slate-600 mt-6 max-w-xl leading-relaxed">
              ResumeForge gives you recruiter-ready templates, live preview, and simple pricing — starting free,
              from Rs. 150/month (PKR).
            </motion.p>
            <motion.div variants={heroItem} className="flex flex-wrap gap-3 mt-10">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 350, damping: 18 }}
              >
                <Link to="/register" className="app-btn-primary !px-8 !py-3 text-base">
                  Start free
                  <ArrowRight size={18} className="ml-2" />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 350, damping: 18 }}
              >
                <Link to="/pricing" className="app-btn-secondary !px-8 !py-3 text-base">
                  View pricing
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <motion.h2
          className="text-2xl font-bold text-slate-900 text-center mb-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          Everything you need to get hired
        </motion.h2>
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={featuresContainer}
        >
          {features.map(({ icon: Icon, title, desc }) => (
            <motion.div key={title} variants={featureCard} className="app-card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600 mb-4">
                <Icon size={22} />
              </span>
              <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="border-t border-slate-200 bg-brand-600">
        <motion.div
          className="max-w-6xl mx-auto px-4 sm:px-6 py-14 flex flex-col sm:flex-row items-center justify-between gap-6"
          initial={{ opacity: 0, y: 36, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ type: 'spring', stiffness: 90, damping: 16, mass: 0.8 }}
        >
          <div className="text-white">
            <h2 className="text-2xl font-bold">Ready to create your resume?</h2>
            <p className="text-brand-100 mt-2">Join free — no credit card required.</p>
          </div>
          <motion.div
            initial={{ boxShadow: '0 0 0 0 rgba(255,255,255,0)' }}
            whileHover={{ scale: 1.06, boxShadow: '0 8px 30px 0 rgba(255,255,255,0.35)' }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 16 }}
            className="rounded-lg"
          >
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
            >
              Get started
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}

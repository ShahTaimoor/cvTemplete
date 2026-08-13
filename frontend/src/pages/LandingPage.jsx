import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { FileText, Download, Palette, Shield, Sparkles, ArrowRight } from 'lucide-react';
import Seal from '../components/common/Seal';

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

const ctaBanner = {
  hidden: { opacity: 0, y: 36, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 90, damping: 16, mass: 0.8 },
  },
};

export default function LandingPage() {
  // The app-wide route AnimatePresence uses initial={false} (App.jsx) so the
  // whole app doesn't fade in on first boot — but that also suppresses this
  // hero's own mount-triggered initial->animate transition on a hard page
  // load, since Framer treats anything present at that very first render as
  // already "settled." Flipping `animate` from a useEffect (fires after the
  // first paint) creates a genuine prop-change transition instead of an
  // initial-mount one, which isn't subject to that suppression.
  //
  // The animation is only worth that treatment once per session, though —
  // replaying the full slide-in on every refresh reads as repetitive rather
  // than a first impression. sessionStorage (not localStorage) is read
  // synchronously via a lazy useState initializer, so a repeat visit's very
  // first render already has `heroSeen: true` — no flash of the hidden
  // starting state before it snaps settled. Passing `initial={false}` on the
  // motion.div itself (not just leaving `animate` pre-set to "visible")
  // is what actually skips Framer's mount transition on a repeat visit;
  // without it a fresh mount would still animate from "hidden" to "visible"
  // regardless of the AnimatePresence-level suppression above, since that
  // suppression only applies to the app's very first-ever paint.
  const HERO_SEEN_KEY = 'resumeforge_hero_seen';
  const [heroSeen] = useState(() => {
    try {
      return sessionStorage.getItem(HERO_SEEN_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [heroVisible, setHeroVisible] = useState(heroSeen);
  useEffect(() => {
    if (!heroSeen) setHeroVisible(true);
    try {
      sessionStorage.setItem(HERO_SEEN_KEY, '1');
    } catch {
      // sessionStorage unavailable (e.g. disabled) — animation just replays each time.
    }
  }, [heroSeen]);

  // Same root cause as the hero, different Framer API: the CTA banner's
  // whileInView/initial props were ALSO getting suppressed by the outer
  // AnimatePresence's initial={false} on a fresh load — its opacity/scale
  // sat permanently at the "already revealed" end state, verified by
  // sampling computed style (never transitioned, even after scrolling it
  // into view). useInView is a plain IntersectionObserver-backed hook, not
  // a whileInView/initial prop, so it isn't subject to that suppression;
  // driving `animate` from its boolean result sidesteps the bug entirely.
  const ctaRef = useRef(null);
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.4 });

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden border-b border-slate-200 bg-mist">
        {/* Floating decorative orbs — subtle parallax-style ambient motion */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl"
          animate={{ y: [0, -22, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-1/3 -left-20 h-72 w-72 rounded-full bg-brass/15 blur-3xl"
          animate={{ y: [0, 18, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <motion.div
            className="max-w-3xl"
            initial={heroSeen ? false : 'hidden'}
            animate={heroVisible ? 'visible' : 'hidden'}
            variants={heroContainer}
          >
            <motion.p
              variants={heroItem}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brass-ink mb-5"
            >
              <Shield size={16} className="text-brass-ink" />
              Professional CV Builder
            </motion.p>
            <motion.h1
              variants={heroItem}
              className="text-4xl sm:text-5xl lg:text-6xl font-medium text-brand-600 tracking-tight leading-[1.1]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Build a résumé that earns trust
            </motion.h1>
            <motion.p variants={heroItem} className="text-lg text-slate-600 mt-6 max-w-xl leading-relaxed">
              ResumeForge pairs recruiter-ready templates with real-time preview and transparent pricing —
              trusted by professionals across Pakistan and the Gulf. Starting free, from Rs. 150/month (PKR).
            </motion.p>
            <motion.div variants={heroItem} className="flex flex-wrap gap-3 mt-10">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 350, damping: 18 }}
              >
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-lg bg-brass px-8 py-3 text-base font-semibold text-brand-700 hover:bg-brass/90 transition-colors"
                >
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

            <motion.div variants={heroItem} className="flex items-center gap-3 mt-12">
              <Seal size={36} />
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-graphite">Formats recruiters trust</span> — built for
                Pakistan, the Gulf, and beyond.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <motion.h2
          className="text-2xl font-medium text-brand-600 text-center mb-10"
          style={{ fontFamily: 'var(--font-display)' }}
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
              <h3 className="font-semibold text-graphite mb-1">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="border-t border-slate-200 bg-brand-600">
        <motion.div
          ref={ctaRef}
          className="max-w-6xl mx-auto px-4 sm:px-6 py-14 flex flex-col sm:flex-row items-center justify-between gap-6"
          initial="hidden"
          animate={ctaInView ? 'visible' : 'hidden'}
          variants={ctaBanner}
        >
          <div className="flex items-center gap-4 text-white">
            <Seal size={44} className="ring-2 ring-white/20" />
            <div>
              <h2 className="text-2xl font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                Ready to create your resume?
              </h2>
              <p className="text-brand-100 mt-1">Join free — no credit card required.</p>
            </div>
          </div>
          <motion.div
            initial={{ boxShadow: '0 0 0 0 rgba(185,139,78,0)' }}
            whileHover={{ scale: 1.06, boxShadow: '0 8px 30px 0 rgba(185,139,78,0.45)' }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 16 }}
            className="rounded-lg"
          >
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-lg bg-brass px-8 py-3 font-semibold text-brand-700 hover:bg-brass/90 transition-colors"
            >
              Get started
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}

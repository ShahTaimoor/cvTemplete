import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, PenLine, Mail, PanelLeftClose, PanelLeft, ShieldCheck } from 'lucide-react';
import { logoutUser } from '../../store/authSlice';
import { adminAPI } from '../../services/api';
import { overlayFade, drawerPanel, DURATION, EASE } from '../../lib/motion';
import HamburgerIcon from '../common/HamburgerIcon';
import DashboardGridIcon from '../common/DashboardGridIcon';
import CreditCardShineIcon from '../common/CreditCardShineIcon';
import CrownSparkleIcon from '../common/CrownSparkleIcon';
import LogOutSlideIcon from '../common/LogOutSlideIcon';

const SIDEBAR_COLLAPSED_KEY = 'sidebarCollapsed';
const EXPANDED_WIDTH = 256;
const COLLAPSED_WIDTH = 80;

// NavItem below calls every nav icon as `<Icon hovered={...} size={18} />` —
// the hand-crafted icons (DashboardGridIcon, CreditCardShineIcon) use
// `hovered` for their own Framer Motion hover animation. These two new nav
// slots deliberately use plain, static lucide-react icons instead (per this
// task's own instruction, not a hand-crafted animation), so they just
// absorb and drop `hovered` rather than forwarding it onto the underlying
// <svg>, where it would otherwise leak through lucide's own prop-spread as
// an invalid DOM attribute.
function FileTextNavIcon({ size }) {
  return <FileText size={size} />;
}
function MailNavIcon({ size }) {
  return <Mail size={size} />;
}
function ShieldCheckNavIcon({ size }) {
  return <ShieldCheck size={size} />;
}

const NAV = [
  { to: '/dashboard', label: 'My Dashboard', icon: DashboardGridIcon },
  { to: '/resumes', label: 'My Resumes', icon: FileTextNavIcon },
  { to: '/cover-letters', label: 'My Cover Letters', icon: MailNavIcon },
  { to: '/pricing', label: 'Plans & Pricing', icon: CreditCardShineIcon },
];

// Appended to NAV only for super-admin accounts (see DashboardLayout).
const ADMIN_NAV = { to: '/admin/purchase-requests', label: 'Purchase Requests', icon: ShieldCheckNavIcon };

// Keeps an element's live getBoundingClientRect in sync — used to position
// portaled UI (the collapse toggle, collapsed-rail tooltips) against a real
// on-screen anchor rather than relying on CSS containment, since the
// sidebar needs overflow-y-auto (so it can scroll if the nav list ever
// grows taller than the screen) and that would otherwise clip anything
// positioned outside the sidebar's own box. ResizeObserver re-fires on the
// aside's own width changes, so the toggle button tracks the collapse/
// expand animation in near-real-time, not just at rest; the capturing
// window scroll listener catches the sidebar's own internal scroll too
// (native scroll events don't bubble, but capture-phase listeners on an
// ancestor still see them).
function useTrackedRect(ref) {
  const [rect, setRect] = useState(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setRect(el.getBoundingClientRect());
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [ref]);
  return rect;
}

// Portals its label to document.body, positioned against `anchorRef`'s live
// rect — see useTrackedRect above for why this can't just be an
// absolutely-positioned descendant of the anchor anymore.
function SidebarTooltip({ anchorRef, show, className = '', children }) {
  const rect = useTrackedRect(anchorRef);
  if (!rect || rect.width === 0) return null;

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.fast, ease: EASE }}
          style={{ position: 'fixed', top: rect.top + rect.height / 2, left: rect.right + 8 }}
          className={`pointer-events-none z-[100] -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-lg ${className}`}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>,
    document.body
  );
}

// A label that stays mounted at all times (rather than being conditionally
// rendered on `collapsed`) and instead animates its own max-width/opacity
// to nothing — this is what makes each label visually shrink away in sync
// with the sidebar's own width transition below (same DURATION.base timing,
// expressed here as Tailwind's duration-200) instead of snapping to
// invisible the instant collapse starts.
function CollapsibleLabel({ collapsed, maxWidth = 160, className = '', children }) {
  return (
    <span
      className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${collapsed ? 'opacity-0' : 'opacity-100'} ${className}`}
      style={{ maxWidth: collapsed ? 0 : maxWidth }}
    >
      {children}
    </span>
  );
}

// Each of these four own their own hover state and anchor ref locally —
// hooks can't live inside renderNavAndFooter below, since it's a plain
// function (not a component) called up to twice per render (desktop aside +
// mobile drawer), which would violate the rules of hooks. The custom icons
// themselves only take a plain `hovered` boolean, driven by the whole
// row/button/badge — not just the icon's own small bounding box — so
// hovering anywhere on the control triggers its animation, matching how
// these rows already highlight via their own hover: background classes.
function NavItem({ to, label, Icon, active, onNavigate, collapsed, badge = 0 }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  return (
    <>
      <Link
        ref={ref}
        to={to}
        onClick={onNavigate}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
          collapsed ? 'justify-center px-2.5 py-2.5' : 'px-3 py-2.5'
        } ${active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
      >
        <Icon hovered={hovered} size={18} />
        <CollapsibleLabel collapsed={collapsed}>{label}</CollapsibleLabel>
        {badge > 0 && !collapsed && (
          <span className="ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
        {badge > 0 && collapsed && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-brand-600" />
        )}
      </Link>
      <SidebarTooltip anchorRef={ref} show={collapsed && hovered}>
        {label}
        {badge > 0 ? ` (${badge})` : ''}
      </SidebarTooltip>
    </>
  );
}

function PlanBadge({ plan, collapsed }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  return (
    <>
      <div
        ref={ref}
        className={`mb-3 flex items-center gap-2 rounded-lg bg-slate-50 ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <CrownSparkleIcon hovered={hovered} size={16} className="shrink-0 text-brass" />
        <CollapsibleLabel collapsed={collapsed} maxWidth={120} className="text-xs font-semibold capitalize text-slate-700">
          {plan} plan
        </CollapsibleLabel>
      </div>
      <SidebarTooltip anchorRef={ref} show={collapsed && hovered} className="capitalize">
        {plan} plan
      </SidebarTooltip>
    </>
  );
}

function SignOutButton({ onSignOut, collapsed }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={onSignOut}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`flex w-full items-center gap-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 ${
          collapsed ? 'justify-center p-2.5' : 'px-3 py-2'
        }`}
      >
        <LogOutSlideIcon hovered={hovered} size={16} />
        <CollapsibleLabel collapsed={collapsed} maxWidth={120}>
          Sign out
        </CollapsibleLabel>
      </button>
      <SidebarTooltip anchorRef={ref} show={collapsed && hovered}>
        Sign out
      </SidebarTooltip>
    </>
  );
}

// The "Resume Editor" / "Cover Letter" context badge shown when a
// contextual sub-route (the Builder, or a cover letter's own editor) is
// active — same collapsed-icon + tooltip treatment as a real NavItem, just
// not a link (there's nowhere else for it to go).
function ContextIndicator({ icon: Icon, label, collapsed }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  return (
    <>
      <span
        ref={ref}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`flex items-center gap-3 rounded-lg bg-brand-50 text-sm font-medium text-brand-700 ${
          collapsed ? 'justify-center px-2.5 py-2.5' : 'px-3 py-2.5'
        }`}
      >
        <Icon size={18} />
        <CollapsibleLabel collapsed={collapsed}>{label}</CollapsibleLabel>
      </span>
      <SidebarTooltip anchorRef={ref} show={collapsed && hovered}>
        {label}
      </SidebarTooltip>
    </>
  );
}

export default function DashboardLayout({ children, fullHeight = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const plan = user?.subscription?.plan || 'free';
  const isSuperAdmin = user?.role === 'superadmin';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);

  // Keep the "Purchase Requests" badge roughly current for admins: refetch on
  // mount and whenever the route changes (so approving/rejecting on that page
  // and navigating away updates the count).
  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    adminAPI
      .purchaseRequestCount()
      .then(({ data }) => {
        if (!cancelled) setPendingRequests(data?.pending || 0);
      })
      .catch(() => {
        /* badge is best-effort */
      });
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin, location.pathname]);

  const navItems = isSuperAdmin ? [...NAV, ADMIN_NAV] : NAV;
  const asideRef = useRef(null);
  const asideRect = useTrackedRect(asideRef);

  // Desktop-only (the mobile drawer below always renders full-width — a
  // collapsed rail doesn't make sense as a slide-out overlay), persisted so
  // a refresh or normal navigation keeps whatever the user last chose.
  // Loading synchronously from localStorage in the initializer (not an
  // effect) avoids a visible expanded->collapsed flash on a page load that
  // was actually left collapsed.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {
      // Private-browsing / storage-disabled edge case — collapsing still
      // works for the session, it just won't be remembered next time.
    }
  }, [collapsed]);

  const isActive = (path) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path);

  const handleSignOut = () => {
    dispatch(logoutUser());
    navigate('/');
  };

  // Shared between the desktop sidebar and the mobile drawer so nav items,
  // active-state logic, and sign-out all come from one place. `collapsed`
  // is only ever true for the desktop call — the mobile drawer calls this
  // with it omitted (defaulting to false), since it's always full-width.
  const renderNavAndFooter = (onNavigate, collapsed = false) => (
    <>
      <nav className={`flex-1 space-y-1 ${collapsed ? 'p-2' : 'p-4'}`}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavItem
            key={to}
            to={to}
            label={label}
            Icon={Icon}
            active={isActive(to)}
            onNavigate={onNavigate}
            collapsed={collapsed}
            badge={to === ADMIN_NAV.to ? pendingRequests : 0}
          />
        ))}
        {location.pathname.startsWith('/builder') && (
          <ContextIndicator icon={PenLine} label="Resume Editor" collapsed={collapsed} />
        )}
        {location.pathname.startsWith('/cover-letter/') && (
          <ContextIndicator icon={Mail} label="Cover Letter" collapsed={collapsed} />
        )}
      </nav>

      <div className={`border-t border-slate-200 ${collapsed ? 'p-2' : 'p-4'}`}>
        <PlanBadge plan={plan} collapsed={collapsed} />
        {!collapsed && <p className="mb-2 truncate px-3 text-xs text-slate-500">{user?.email}</p>}
        <SignOutButton onSignOut={handleSignOut} collapsed={collapsed} />
      </div>
    </>
  );

  return (
    <div className={`flex bg-slate-50 ${fullHeight ? 'h-screen' : 'min-h-screen'}`}>
      <motion.aside
        ref={asideRef}
        animate={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
        transition={{ duration: DURATION.base, ease: EASE }}
        className="hidden shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white sticky top-0 h-screen md:flex"
      >
        <div className={`flex h-16 items-center border-b border-slate-200 ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
          <Link to="/dashboard" className="flex min-w-0 items-center gap-2 font-bold text-slate-900">
            <img src="/logo.png" alt="ResumeForge" className="h-8 w-8 shrink-0 object-contain" />
            <CollapsibleLabel collapsed={collapsed}>ResumeForge</CollapsibleLabel>
          </Link>
        </div>
        {renderNavAndFooter(undefined, collapsed)}
      </motion.aside>

      {asideRect?.width > 0 &&
        createPortal(
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ position: 'fixed', top: asideRect.top + 20, left: asideRect.right, transform: 'translateX(-50%)' }}
            className="z-[100] hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-brand-200 hover:text-brand-600 md:flex"
          >
            {collapsed ? <PanelLeft size={13} /> : <PanelLeftClose size={13} />}
          </button>,
          document.body
        )}

      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            className="md:hidden fixed inset-0 z-50 bg-slate-900/60 flex cursor-pointer"
            onClick={() => setMobileNavOpen(false)}
            initial={overlayFade.initial}
            animate={overlayFade.animate}
            exit={overlayFade.exit}
            transition={overlayFade.transition}
          >
            <motion.div
              className="w-64 max-w-[80vw] h-full bg-white flex flex-col shadow-xl cursor-default"
              onClick={(e) => e.stopPropagation()}
              initial={drawerPanel.initial}
              animate={drawerPanel.animate}
              exit={drawerPanel.exit}
              transition={drawerPanel.transition}
            >
              <div className="h-14 flex items-center justify-between gap-2 px-4 border-b border-slate-200 shrink-0">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 font-bold text-slate-900"
                  onClick={() => setMobileNavOpen(false)}
                >
                  <img src="/logo.png" alt="ResumeForge" className="h-8 w-8 object-contain shrink-0" />
                  ResumeForge
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close menu"
                  className="text-slate-500 hover:text-slate-800"
                >
                  <HamburgerIcon open size={20} />
                </button>
              </div>
              {renderNavAndFooter(() => setMobileNavOpen(false))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex-1 flex flex-col min-w-0 ${fullHeight ? 'h-full overflow-hidden' : ''}`}>
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-slate-200 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="text-slate-600 hover:text-slate-900"
          >
            <HamburgerIcon open={mobileNavOpen} />
          </button>
          <Link to="/dashboard" className="font-bold text-slate-900 flex items-center gap-2">
            <img src="/logo.png" alt="ResumeForge" className="h-6 w-6 object-contain shrink-0" />
            ResumeForge
          </Link>
          <Link to="/pricing" className="text-sm text-brand-600 font-medium">
            Plans
          </Link>
        </header>
        <main className={fullHeight ? 'flex-1 overflow-hidden' : 'flex-1'}>{children}</main>
      </div>
    </div>
  );
}

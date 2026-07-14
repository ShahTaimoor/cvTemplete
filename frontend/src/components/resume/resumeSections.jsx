import { getThemedCardStyles } from '../../utils/resumeThemeUtils';

export const formatDate = (start, end, current) => {
  const s = start || '';
  const e = current ? 'Present' : end || '';
  if (!s && !e) return '';
  return `${s}${s && e ? ' – ' : ''}${e}`;
};

export const SectionTitle = ({ children, style, variant = 'default' }) => {
  if (variant === 'minimal') {
    return (
      <h2 className="text-xs font-bold tracking-widest text-gray-400 mb-2 uppercase">{children}</h2>
    );
  }
  if (variant === 'elegant') {
    return (
      <h2 className="text-sm font-semibold mb-2 italic" style={{ color: style.primary, fontFamily: style.font }}>
        {children}
      </h2>
    );
  }
  if (variant === 'pill') {
    return (
      <h2
        className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-2 text-white"
        style={{ background: style.primary }}
      >
        {children}
      </h2>
    );
  }
  if (variant === 'underline-light') {
    return (
      <h2 className="text-xs font-bold uppercase tracking-widest mb-2 pb-1 border-b border-gray-200 text-gray-700">
        {children}
      </h2>
    );
  }
  if (variant === 'rule-accent') {
    return (
      <h2
        className="text-xs font-bold uppercase tracking-[0.2em] mb-2 pb-1.5"
        style={{
          color: style.primary,
          fontFamily: style.font,
          borderBottom: `1px solid ${style.primary}`,
        }}
      >
        {children}
      </h2>
    );
  }
  return (
    <h2
      className="text-sm font-semibold uppercase tracking-wide mb-2 pb-1"
      style={{ color: style.primary, borderBottom: `2px solid ${style.primary}` }}
    >
      {children}
    </h2>
  );
};

export const Sections = ({ resume, style, variant = 'default', exclude = [], hideTitles = false }) => {
  const effectiveVariant = style.sectionVariant || variant;
  const order = (resume.sectionOrder || [
    'summary', 'experience', 'education', 'skills', 'projects', 'certifications',
  ]).filter((k) => !exclude.includes(k));

  const Title = hideTitles ? () => null : SectionTitle;
  const projectCardClass = 'mb-3 p-3 rounded-lg border';
  const projectCardStyle = getThemedCardStyles(style, effectiveVariant === 'rule-accent');
  const L = (key, fallback) => style.sectionLabels?.[key] || fallback;

  const renderBlock = (key) => {
    switch (key) {
      case 'summary':
        return resume.summary ? (
          <div key={key} className="mb-4">
            <Title style={style} variant={effectiveVariant}>{L('summary', 'Summary')}</Title>
            <p className="text-gray-600 whitespace-pre-wrap text-[11px] leading-relaxed">{resume.summary}</p>
          </div>
        ) : null;
      case 'experience':
        return resume.experience?.length ? (
          <div key={key} className="mb-4">
            <Title style={style} variant={effectiveVariant}>{L('experience', 'Experience')}</Title>
            {resume.experience.map((e, i) => (
              <div key={i} className="mb-3">
                <div className="font-semibold text-xs text-gray-900">{e.position}</div>
                <div className="text-xs font-medium" style={{ color: style.primary }}>{e.company}</div>
                <div className="text-[10px] text-gray-500">
                  {e.location} · {formatDate(e.startDate, e.endDate, e.current)}
                </div>
                <p className="text-gray-600 mt-1 whitespace-pre-wrap text-[10px] leading-relaxed">{e.description}</p>
              </div>
            ))}
          </div>
        ) : null;
      case 'education':
        return resume.education?.length ? (
          <div key={key} className="mb-4">
            <Title style={style} variant={effectiveVariant}>{L('education', 'Education')}</Title>
            {resume.education.map((e, i) => (
              <div key={i} className="mb-2">
                <div className="font-semibold text-xs">{e.degree} {e.field && `— ${e.field}`}</div>
                <div className="text-[10px]" style={{ color: style.secondary }}>{e.institution}</div>
              </div>
            ))}
          </div>
        ) : null;
      case 'skills':
        return resume.skills?.filter((s) => s.name)?.length ? (
          <div key={key} className="mb-4">
            <Title style={style} variant={effectiveVariant}>{L('skills', 'Skills')}</Title>
            <div className="flex flex-wrap gap-1.5">
              {resume.skills.filter((s) => s.name).map((s, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[10px]"
                  style={{ background: `${style.primary}15`, color: style.primary, border: `1px solid ${style.primary}30` }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        ) : null;
      case 'projects':
        return resume.projects?.length ? (
          <div key={key} className="mb-4">
            <Title style={style} variant={effectiveVariant}>{L('projects', 'Projects')}</Title>
            {resume.projects.map((p, i) => (
              <div key={i} className={projectCardClass} style={projectCardStyle}>
                <div className="font-semibold text-xs text-gray-900">{p.name}</div>
                <p className="text-[10px] mt-0.5" style={{ color: style.secondary }}>{p.technologies}</p>
                <p className="text-gray-600 text-[10px] mt-1 leading-relaxed whitespace-pre-wrap">{p.description}</p>
              </div>
            ))}
          </div>
        ) : null;
      case 'certifications':
        return resume.certifications?.length ? (
          <div key={key} className="mb-4">
            <Title style={style} variant={effectiveVariant}>{L('certifications', 'Certifications')}</Title>
            {resume.certifications.map((c, i) => (
              <div
                key={i}
                className={effectiveVariant === 'rule-accent' ? projectCardClass : 'text-xs mb-1'}
                style={effectiveVariant === 'rule-accent' ? getThemedCardStyles(style, true) : undefined}
              >
                <span className="font-semibold text-xs">{c.name}</span>
                <span className="text-gray-500 text-[10px]"> — {c.issuer}{c.date ? ` · ${c.date}` : ''}</span>
              </div>
            ))}
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return order.filter((k) => k !== 'personal').map(renderBlock);
};

export const TimelineExperience = ({ resume, style }) => {
  if (!resume.experience?.length) return null;
  return (
    <div className="mb-4">
      <SectionTitle style={style} variant="pill">Experience</SectionTitle>
      <div className="relative pl-4 border-l-2 space-y-4" style={{ borderColor: `${style.primary}40` }}>
        {resume.experience.map((e, i) => (
          <div key={i} className="relative">
            <div
              className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2"
              style={{ borderColor: style.primary, backgroundColor: style.bg || '#ffffff' }}
            />
            <div className="font-semibold text-xs">{e.position}</div>
            <div className="text-xs" style={{ color: style.primary }}>{e.company}</div>
            <div className="text-[10px] text-gray-500 mb-1">
              {formatDate(e.startDate, e.endDate, e.current)}
            </div>
            <p className="text-[10px] text-gray-600">{e.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkillBars = ({ skills, style, light }) => (
  <div className="space-y-2">
    {skills.filter((s) => s.name).map((s, i) => (
      <div key={i}>
        <div className={`text-[10px] mb-0.5 ${light ? 'text-white/90' : 'text-gray-600'}`}>{s.name}</div>
        <div className={`h-1.5 rounded-full ${light ? 'bg-white/20' : 'bg-gray-200'}`}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${60 + (i % 4) * 10}%`,
              background: light ? '#fff' : style.primary,
            }}
          />
        </div>
      </div>
    ))}
  </div>
);

export const getContacts = (personal) =>
  [personal?.email, personal?.phone, personal?.location, personal?.website, personal?.linkedin].filter(Boolean);

export const resumeWithoutSkills = (resume) => ({
  ...resume,
  skills: [],
  sectionOrder: (resume.sectionOrder || []).filter((k) => k !== 'skills'),
});

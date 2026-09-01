import { Sections, TimelineExperience, SkillBars, getContacts, getContactEntries, resumeWithoutSkills, SectionTitle } from './resumeSections';
import { getThemedFrameBg, getThemedMutedBandStyle, getThemedCardStyles } from '../../utils/resumeThemeUtils';

/* ─── Sidebar (left) — contact + skills in colored panel ─── */
export const SidebarLeftLayout = ({ resume, style, variant, wide }) => {
  const p = resume.personal || {};
  const contacts = getContactEntries(p);
  const skills = resume.skills || [];

  return (
    <div className="flex min-h-[297mm]" style={{ fontSize: '11px' }}>
      <aside
        className={`${wide ? 'w-[38%]' : 'w-[34%]'} shrink-0 flex flex-col`}
        style={{ background: style.primary }}
      >
        {p.photo && (
          <div className={wide ? 'p-0' : 'p-4 pb-0'}>
            <img
              src={p.photo}
              alt=""
              className={`${wide ? 'w-full h-40 object-cover' : 'w-24 h-24 rounded-full object-cover border-4 border-white/25'}`}
            />
          </div>
        )}
        <div className="p-5 text-white flex-1">
          <h1 className={`font-bold leading-tight ${wide ? 'text-2xl' : 'text-xl'}`}>
            {p.fullName || 'Your Name'}
          </h1>
          <p className="text-sm opacity-90 mt-1 pb-4 border-b border-white/20">{p.jobTitle || 'Job Title'}</p>
          <p className="text-[10px] uppercase tracking-widest opacity-60 mt-4 mb-2">Contact</p>
          {contacts.map((c) => (
            <div key={c.type} className="text-[10px] mb-1.5 opacity-95 break-words">{c.value}</div>
          ))}
          {skills.filter((s) => s.name).length > 0 && (
            <div className="mt-6">
              <p className="text-[10px] uppercase tracking-widest opacity-60 mb-3">Skills</p>
              <SkillBars skills={skills} style={style} light />
            </div>
          )}
        </div>
      </aside>
      <main className="flex-1 p-7 text-gray-800" style={{ background: style.bg }}>
        <Sections resume={resumeWithoutSkills(resume)} style={style} variant={variant} />
      </main>
    </div>
  );
};

/* ─── Sidebar RIGHT — main content left, info panel right ─── */
export const SidebarRightLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  const contacts = getContactEntries(p);

  return (
    <div className="flex min-h-[297mm]" style={{ fontSize: '11px', background: style.bg }}>
      <main className="flex-1 p-7 border-r border-gray-100">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: style.primary }}>
            {p.fullName || 'Your Name'}
          </h1>
          <p className="text-base mt-1 text-gray-600">{p.jobTitle || 'Job Title'}</p>
          {resume.summary && (
            <p className="mt-4 text-[11px] text-gray-600 leading-relaxed border-l-4 pl-4" style={{ borderColor: style.primary }}>
              {resume.summary}
            </p>
          )}
        </div>
        <Sections
          resume={{
            ...resumeWithoutSkills(resume),
            summary: '',
            sectionOrder: (resume.sectionOrder || []).filter((k) => k !== 'summary'),
          }}
          style={style}
          variant="underline-light"
        />
      </main>
      <aside className="w-[32%] shrink-0 p-5" style={{ background: style.secondary }}>
        {p.photo && (
          <img src={p.photo} alt="" className="w-full aspect-square object-cover rounded-lg mb-4 shadow-lg" />
        )}
        <div className="text-white">
          <p className="text-[10px] uppercase tracking-widest opacity-70 mb-3">Contact</p>
          {contacts.map((c) => (
            <div key={c.type} className="text-[10px] mb-2 opacity-95">{c.value}</div>
          ))}
          {resume.skills?.filter((s) => s.name)?.length > 0 && (
            <div className="mt-6">
              <p className="text-[10px] uppercase tracking-widest opacity-70 mb-2">Expertise</p>
              {resume.skills.filter((s) => s.name).map((s, i) => (
                <div key={i} className="text-[10px] py-1 border-b border-white/15">{s.name}</div>
              ))}
            </div>
          )}
          {resume.education?.length > 0 && (
            <div className="mt-6">
              <p className="text-[10px] uppercase tracking-widest opacity-70 mb-2">Education</p>
              {resume.education.map((e, i) => (
                <div key={i} className="text-[10px] mb-2 opacity-95">
                  <div className="font-semibold">{e.degree}</div>
                  <div className="opacity-80">{e.institution}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

/* ─── Accent stripe + light sidebar ─── */
export const SidebarAccentLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  const contacts = getContactEntries(p);

  return (
    <div className="flex min-h-[297mm]" style={{ fontSize: '11px' }}>
      <div className="w-2 shrink-0" style={{ background: style.primary }} />
      <aside className="w-[30%] shrink-0 border-r border-gray-200/60 p-5" style={{ background: getThemedFrameBg(style) }}>
        <div className="p-3 rounded-lg mb-4 text-white" style={{ background: style.primary }}>
          <h1 className="text-lg font-bold">{p.fullName || 'Your Name'}</h1>
          <p className="text-xs opacity-90">{p.jobTitle || 'Job Title'}</p>
        </div>
        {p.photo && (
          <img src={p.photo} alt="" className="w-full h-28 object-cover rounded-md mb-4" />
        )}
        <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Contact</p>
        {contacts.map((c) => (
          <div key={c.type} className="text-[10px] text-gray-600 mb-1">{c.value}</div>
        ))}
        {resume.skills?.filter((s) => s.name)?.length > 0 && (
          <div className="mt-5">
            <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Skills</p>
            <SkillBars skills={resume.skills} style={style} />
          </div>
        )}
      </aside>
      <main className="flex-1 p-7" style={{ background: style.bg }}>
        <Sections resume={resumeWithoutSkills(resume)} style={style} variant="default" />
      </main>
    </div>
  );
};

/* ─── Dual column content below header band ─── */
export const DualColumnLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  const leftOrder = ['experience', 'projects'];
  const rightOrder = ['education', 'skills', 'certifications'];

  return (
    <div style={{ background: style.bg, fontSize: '11px' }}>
      <div className="px-8 py-6 flex justify-between items-center" style={{ background: style.primary, color: '#fff' }}>
        <div>
          <h1 className="text-2xl font-bold">{p.fullName || 'Your Name'}</h1>
          <p className="text-sm opacity-90">{p.jobTitle || 'Job Title'}</p>
        </div>
        <div className="text-right text-[10px] opacity-85">
          {getContactEntries(p).map((c) => (
            <div key={c.type}>{c.value}</div>
          ))}
        </div>
      </div>
      {resume.summary && (
        <div className="px-8 py-4 border-b text-[11px] text-gray-600 italic" style={getThemedMutedBandStyle(style)}>{resume.summary}</div>
      )}
      <div className="grid grid-cols-2 gap-6 p-8">
        <div>
          <Sections resume={{ ...resume, sectionOrder: leftOrder }} style={style} variant="pill" />
        </div>
        <div className="border-l border-gray-200 pl-6">
          <Sections resume={{ ...resume, sectionOrder: rightOrder, summary: '' }} style={style} variant="underline-light" />
        </div>
      </div>
    </div>
  );
};

/* ─── Timeline experience layout ─── */
export const TimelineLayout = ({ resume, style }) => {
  const p = resume.personal || {};

  return (
    <div className="p-8" style={{ background: style.bg, fontSize: '11px' }}>
      <div className="flex gap-6 mb-6 pb-6 border-b-2" style={{ borderColor: style.primary }}>
        {p.photo && (
          <img src={p.photo} alt="" className="w-20 h-20 rounded-lg object-cover" />
        )}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
          <p className="text-gray-600">{p.jobTitle || 'Job Title'}</p>
          <p className="text-[10px] text-gray-500 mt-2">{getContacts(p).join(' · ')}</p>
        </div>
      </div>
      {resume.summary && (
        <div className="mb-5 p-3 rounded-lg border text-[11px] text-gray-700" style={getThemedCardStyles(style)}>
          {resume.summary}
        </div>
      )}
      <TimelineExperience resume={resume} style={style} />
      <Sections
        resume={{
          ...resume,
          experience: [],
          sectionOrder: (resume.sectionOrder || []).filter((k) => k !== 'experience' && k !== 'summary'),
        }}
        style={style}
        variant="underline-light"
      />
    </div>
  );
};

/* ─── Card sections ─── */
export const CardsLayout = ({ resume, style }) => {
  const p = resume.personal || {};

  return (
    <div className="p-6 min-h-[297mm]" style={{ background: getThemedFrameBg(style), fontSize: '11px' }}>
      <div
        className="rounded-xl p-6 mb-4 shadow-sm text-white"
        style={{ background: `linear-gradient(135deg, ${style.primary}, ${style.secondary})` }}
      >
        <h1 className="text-2xl font-bold">{p.fullName || 'Your Name'}</h1>
        <p className="opacity-90">{p.jobTitle || 'Job Title'}</p>
        <p className="text-[10px] mt-2 opacity-80">{getContacts(p).join(' · ')}</p>
      </div>
      <div className="rounded-xl p-5 shadow-sm space-y-4" style={{ background: style.bg }}>
        <Sections resume={resume} style={style} variant="pill" />
      </div>
    </div>
  );
};

/* ─── Split top header ─── */
export const SplitTopLayout = ({ resume, style }) => {
  const p = resume.personal || {};

  return (
    <div style={{ fontSize: '11px' }}>
      <div className="grid grid-cols-2 min-h-[140px]">
        <div className="p-8 flex flex-col justify-center text-white" style={{ background: style.primary }}>
          <h1 className="text-3xl font-black leading-none">{p.fullName || 'Your Name'}</h1>
          <p className="text-lg mt-2 opacity-90">{p.jobTitle || 'Job Title'}</p>
        </div>
        <div className="p-8 flex flex-col justify-center" style={{ background: style.secondary, color: '#fff' }}>
          {getContactEntries(p).map((c) => (
            <div key={c.type} className="text-[11px] mb-1 opacity-95">{c.value}</div>
          ))}
        </div>
      </div>
      <div className="p-8" style={{ background: style.bg }}>
        <Sections resume={resume} style={style} variant="default" />
      </div>
    </div>
  );
};

/* ─── Metro blocks ─── */
export const MetroLayout = ({ resume, style }) => {
  const p = resume.personal || {};

  return (
    <div style={{ background: style.bg, fontSize: '11px' }}>
      <div className="grid grid-cols-3">
        <div className="col-span-2 p-6" style={{ background: style.primary, color: '#fff' }}>
          <h1 className="text-2xl font-bold">{p.fullName || 'Your Name'}</h1>
          <p className="text-sm opacity-90">{p.jobTitle || 'Job Title'}</p>
        </div>
        <div className="p-4 flex items-center justify-center" style={{ background: style.secondary, color: '#fff' }}>
          {p.photo ? (
            <img src={p.photo} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white/40" />
          ) : (
            <div className="text-[10px] text-center opacity-80">{getContacts(p)[0]}</div>
          )}
        </div>
      </div>
      <div className="p-7">
        <Sections resume={resume} style={style} variant="pill" />
      </div>
    </div>
  );
};

/* ─── Full-width banner header with photo ─── */
export const BannerPhotoLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div style={{ background: style.bg, fontSize: '11px' }}>
      <div
        className="relative min-h-[160px] flex items-end p-8 text-white overflow-hidden"
        style={{
          background: p.photo
            ? `linear-gradient(135deg, ${style.primary}dd, ${style.secondary}ee), url(${p.photo}) center/cover`
            : `linear-gradient(135deg, ${style.primary}, ${style.secondary})`,
        }}
      >
        <div>
          <h1 className="text-3xl font-bold drop-shadow">{p.fullName || 'Your Name'}</h1>
          <p className="text-lg opacity-95 mt-1">{p.jobTitle || 'Job Title'}</p>
          <p className="text-[10px] mt-2 opacity-90">{getContacts(p).join(' · ')}</p>
        </div>
      </div>
      <div className="p-8">
        <Sections resume={resume} style={style} variant="pill" />
      </div>
    </div>
  );
};

/* ─── Photo left + info right header row ─── */
export const HeaderPhotoSplitLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div style={{ background: style.bg, fontSize: '11px' }}>
      <div className="flex border-b-4" style={{ borderColor: style.primary }}>
        <div className="w-[35%] shrink-0">
          {p.photo ? (
            <img src={p.photo} alt="" className="w-full h-44 object-cover" />
          ) : (
            <div className="h-44 flex items-center justify-center text-white text-4xl font-bold" style={{ background: style.primary }}>
              {(p.fullName || 'A')[0]}
            </div>
          )}
        </div>
        <div className="flex-1 p-6 flex flex-col justify-center">
          <h1 className="text-2xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
          <p className="text-base text-gray-600 mt-1">{p.jobTitle || 'Job Title'}</p>
          <div className="mt-3 grid grid-cols-2 gap-1 text-[10px] text-gray-500">
            {getContactEntries(p).map((c) => <span key={c.type}>{c.value}</span>)}
          </div>
        </div>
      </div>
      <div className="p-8">
        <Sections resume={resume} style={style} variant="default" />
      </div>
    </div>
  );
};

/* ─── Each section in bordered cards ─── */
export const BoxedSectionsLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  const order = resume.sectionOrder || ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'];

  return (
    <div className="p-6 min-h-[297mm]" style={{ background: getThemedFrameBg(style), fontSize: '11px' }}>
      <div className="rounded-xl p-5 mb-4 shadow-sm" style={{ background: style.bg, borderTop: `4px solid ${style.primary}` }}>
        <h1 className="text-2xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
        <p className="text-gray-600">{p.jobTitle}</p>
        <p className="text-[10px] text-gray-400 mt-2">{getContacts(p).join(' · ')}</p>
      </div>
      {order.filter((k) => k !== 'personal').map((key) => (
        <div key={key} className="rounded-xl p-4 mb-3 shadow-sm border" style={{ background: style.bg, borderColor: getThemedCardStyles(style).borderColor }}>
          <Sections resume={{ ...resume, sectionOrder: [key] }} style={style} variant="rule-accent" />
        </div>
      ))}
    </div>
  );
};

/* ─── Magazine asymmetric header ─── */
export const MagazineLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div className="p-8" style={{ background: style.bg, fontSize: '11px' }}>
      <div className="grid grid-cols-5 gap-6 mb-8 pb-6 border-b border-gray-200">
        <div className="col-span-3">
          <h1 className="text-4xl font-black leading-[0.95] tracking-tight" style={{ color: style.primary }}>
            {p.fullName || 'Your Name'}
          </h1>
          <p className="text-lg mt-3 font-medium text-gray-600">{p.jobTitle || 'Job Title'}</p>
        </div>
        <div className="col-span-2 flex flex-col justify-end text-[10px] text-gray-500 space-y-1 border-l-2 pl-4" style={{ borderColor: style.primary }}>
          {getContactEntries(p).map((c) => <div key={c.type}>{c.value}</div>)}
        </div>
      </div>
      {p.photo && (
        <img src={p.photo} alt="" className="w-24 h-24 rounded object-cover float-right ml-4 mb-2 shadow-md" />
      )}
      <Sections resume={resume} style={style} variant="pill" />
    </div>
  );
};

/* ─── Alternating stripe sections ─── */
export const StripeLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  const blocks = [
    { key: 'summary', content: resume.summary },
    { key: 'experience', has: resume.experience?.length },
    { key: 'education', has: resume.education?.length },
    { key: 'skills', has: resume.skills?.filter((s) => s.name)?.length },
  ].filter((b) => b.key === 'summary' ? b.content : b.has);

  return (
    <div style={{ fontSize: '11px' }}>
      <div className="p-8 text-white" style={{ background: style.primary }}>
        <h1 className="text-3xl font-bold">{p.fullName || 'Your Name'}</h1>
        <p className="opacity-90">{p.jobTitle}</p>
      </div>
      {blocks.map((b, i) => (
        <div
          key={b.key}
          className="px-8 py-5"
          style={{ background: i % 2 === 0 ? style.bg : `${style.primary}08` }}
        >
          <Sections resume={{ ...resume, sectionOrder: [b.key] }} style={style} variant={i % 2 === 0 ? 'default' : 'pill'} />
        </div>
      ))}
      <div className="px-8 py-5" style={{ background: style.bg }}>
        <Sections
          resume={{
            ...resume,
            summary: '',
            experience: [],
            education: [],
            skills: [],
            sectionOrder: (resume.sectionOrder || []).filter(
              (k) => !['summary', 'experience', 'education', 'skills', 'personal'].includes(k)
            ),
          }}
          style={style}
          variant="default"
        />
      </div>
    </div>
  );
};

/* ─── Diagonal clip header ─── */
export const DiagonalHeaderLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div style={{ background: style.bg, fontSize: '11px' }}>
      <div className="relative h-36 overflow-hidden">
        <div
          className="absolute inset-0 text-white flex items-center px-10"
          style={{
            background: `linear-gradient(120deg, ${style.primary} 55%, ${style.secondary} 55%)`,
          }}
        >
          <div>
            <h1 className="text-2xl font-bold">{p.fullName || 'Your Name'}</h1>
            <p className="text-sm opacity-90">{p.jobTitle}</p>
          </div>
        </div>
      </div>
      <div className="px-8 py-2 text-[10px] text-gray-500 flex flex-wrap gap-4 border-b">
        {getContactEntries(p).map((c) => <span key={c.type}>{c.value}</span>)}
      </div>
      <div className="p-8">
        <Sections resume={resume} style={style} variant="default" />
      </div>
    </div>
  );
};

/* ─── Main left + narrow light right column ─── */
export const NarrowRightLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div className="flex min-h-[297mm]" style={{ fontSize: '11px', background: style.bg }}>
      <main className="flex-[7] p-7">
        <h1 className="text-2xl font-bold mb-1" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
        <p className="text-gray-600 mb-4">{p.jobTitle}</p>
        {resume.summary && (
          <p className="text-[11px] text-gray-600 mb-5 leading-relaxed">{resume.summary}</p>
        )}
        <Sections
          resume={{
            ...resumeWithoutSkills(resume),
            summary: '',
            sectionOrder: (resume.sectionOrder || []).filter((k) => !['summary', 'skills', 'certifications'].includes(k)),
          }}
          style={style}
          variant="default"
        />
      </main>
      <aside className="flex-[3] shrink-0 p-4 border-l border-gray-200/60" style={{ background: getThemedFrameBg(style) }}>
        {p.photo && (
          <img src={p.photo} alt="" className="w-full aspect-square object-cover rounded-lg mb-4 shadow" />
        )}
        <p className="text-[10px] font-bold uppercase mb-2" style={{ color: style.primary }}>Contact</p>
        {getContactEntries(p).map((c) => (
          <div key={c.type} className="text-[10px] text-gray-600 mb-1.5">{c.value}</div>
        ))}
        {resume.skills?.filter((s) => s.name)?.length > 0 && (
          <div className="mt-5">
            <p className="text-[10px] font-bold uppercase mb-2" style={{ color: style.primary }}>Skills</p>
            <SkillBars skills={resume.skills} style={style} />
          </div>
        )}
        {resume.certifications?.length > 0 && (
          <div className="mt-5">
            <p className="text-[10px] font-bold uppercase mb-2" style={{ color: style.primary }}>Certs</p>
            {resume.certifications.map((c, i) => (
              <div key={i} className="text-[10px] text-gray-600 mb-1">{c.name}</div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
};

/* ─── Infographic: header + timeline + sidebar stats ─── */
export const InfographicLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div style={{ background: style.bg, fontSize: '11px' }}>
      <div className="flex">
        <div className="flex-1 p-6" style={{ background: style.primary, color: '#fff' }}>
          <h1 className="text-2xl font-bold">{p.fullName || 'Your Name'}</h1>
          <p className="opacity-90">{p.jobTitle}</p>
        </div>
        {p.photo && (
          <img src={p.photo} alt="" className="w-28 h-full object-cover" />
        )}
      </div>
      <div className="flex">
        <div className="flex-[2] p-6">
          {resume.summary && <p className="text-[11px] text-gray-600 mb-4">{resume.summary}</p>}
          <TimelineExperience resume={resume} style={style} />
          <Sections
            resume={{ ...resume, experience: [], summary: '' }}
            style={style}
            variant="underline-light"
            exclude={['experience', 'summary', 'skills']}
          />
        </div>
        <div className="flex-1 p-4 border-l" style={{ background: `${style.primary}06` }}>
          <p className="text-[10px] font-bold uppercase mb-3" style={{ color: style.primary }}>Skills</p>
          <SkillBars skills={resume.skills || []} style={style} />
          {resume.education?.length > 0 && (
            <div className="mt-6">
              <p className="text-[10px] font-bold uppercase mb-2" style={{ color: style.primary }}>Education</p>
              {resume.education.map((e, i) => (
                <div key={i} className="text-[10px] mb-2">
                  <div className="font-semibold">{e.degree}</div>
                  <div className="text-gray-500">{e.institution}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Top bar header ─── */
export const TopbarLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  const contacts = getContacts(p);
  return (
    <div className="min-h-[297mm] flex flex-col" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div
        className="px-6 py-3 flex flex-wrap justify-between items-center gap-2 text-white text-[10px]"
        style={{ background: style.primary }}
      >
        <span className="font-bold text-sm">{p.fullName || 'Your Name'}</span>
        <span className="opacity-90">{contacts.join(' · ')}</span>
      </div>
      <div className="px-6 py-2 border-b" style={{ borderColor: style.secondary }}>
        <p className="text-sm font-medium" style={{ color: style.secondary }}>{p.jobTitle || 'Job Title'}</p>
      </div>
      <div className="flex-1 px-6 py-5">
        <Sections resume={resume} style={style} variant={variant} />
      </div>
    </div>
  );
};

/* ─── Top bar + footer ─── */
export const TopbarFooterLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  const contacts = getContacts(p);
  return (
    <div className="min-h-[297mm] flex flex-col" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="px-6 py-3 text-white text-[10px]" style={{ background: style.primary }}>
        <div className="flex justify-between flex-wrap gap-2">
          <span className="font-bold text-sm">{p.fullName || 'Your Name'}</span>
          <span>{p.jobTitle}</span>
        </div>
      </div>
      <div className="flex-1 px-6 py-5">
        <Sections resume={resume} style={style} variant={variant} />
      </div>
      <div className="px-6 py-3 text-[9px] text-white text-center" style={{ background: style.secondary }}>
        {contacts.join(' · ')}
      </div>
    </div>
  );
};

/* ─── Header band ─── */
export const HeaderBandLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="px-8 py-10 text-white" style={{ background: style.primary }}>
        <h1 className="text-3xl font-bold">{p.fullName || 'Your Name'}</h1>
        <p className="text-lg opacity-90 mt-1">{p.jobTitle}</p>
        <div className="flex flex-wrap gap-3 mt-3 text-[10px] opacity-80">
          {getContactEntries(p).map((c) => (
            <span key={c.type}>{c.value}</span>
          ))}
        </div>
      </div>
      <div className="px-8 py-6">
        <Sections resume={resume} style={style} variant={variant} />
      </div>
    </div>
  );
};

/* ─── Footer bar ─── */
export const FooterBarLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div className="min-h-[297mm] flex flex-col" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="px-8 pt-8 pb-4 border-b-2" style={{ borderColor: style.primary }}>
        <h1 className="text-2xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
        <p className="text-gray-600">{p.jobTitle}</p>
      </div>
      <div className="flex-1 px-8 py-5">
        <Sections resume={resume} style={style} variant={variant} />
      </div>
      <div
        className="px-8 py-4 flex justify-between text-[10px] text-white"
        style={{ background: style.primary }}
      >
        {getContactEntries(p).map((c) => (
          <span key={c.type}>{c.value}</span>
        ))}
      </div>
    </div>
  );
};

/* ─── Double header ─── */
export const DoubleHeaderLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="px-8 py-4 text-white" style={{ background: style.primary }}>
        <h1 className="text-2xl font-bold">{p.fullName || 'Your Name'}</h1>
      </div>
      <div className="px-8 py-2 text-white text-sm" style={{ background: style.secondary }}>
        {p.jobTitle} · {getContacts(p).slice(0, 2).join(' · ')}
      </div>
      <div className="px-8 py-6">
        <Sections resume={resume} style={style} variant={variant} />
      </div>
    </div>
  );
};

/* ─── Centered hero ─── */
export const CenteredHeroLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div className="p-8 text-center" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      {p.photo && (
        <img src={p.photo} alt="" className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-white shadow" />
      )}
      <h1 className="text-3xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
      <p className="text-gray-600 mt-1 mb-2">{p.jobTitle}</p>
      <div className="text-[10px] text-gray-500 flex flex-wrap justify-center gap-2 mb-6">
        {getContactEntries(p).map((c) => (
          <span key={c.type}>{c.value}</span>
        ))}
      </div>
      <div className="text-left border-t pt-6" style={{ borderColor: style.primary }}>
        <Sections resume={resume} style={style} variant={variant === 'default' ? 'elegant' : variant} />
      </div>
    </div>
  );
};

/* ─── Frame border ─── */
export const FrameBorderLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div className="p-6 min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="p-6 h-full border-2" style={{ borderColor: style.primary }}>
        <h1 className="text-xl font-bold text-center mb-1" style={{ color: style.primary }}>{p.fullName}</h1>
        <p className="text-center text-xs text-gray-600 mb-4">{p.jobTitle}</p>
        <Sections resume={resume} style={style} variant={variant} />
      </div>
    </div>
  );
};

/* ─── Ribbon left ─── */
export const RibbonLeftLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div className="flex min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="w-3 shrink-0" style={{ background: style.primary }} />
      <div className="w-2 shrink-0" style={{ background: style.secondary }} />
      <div className="flex-1 p-7">
        <h1 className="text-2xl font-bold" style={{ color: style.primary }}>{p.fullName}</h1>
        <p className="text-sm text-gray-600 mb-4">{p.jobTitle}</p>
        <Sections resume={resume} style={style} variant={variant} />
      </div>
    </div>
  );
};

/* ─── Rule between sections ─── */
export const RuleSectionsLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div className="p-8" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="pb-4 mb-2">
        <h1 className="text-2xl font-bold" style={{ color: style.primary }}>{p.fullName}</h1>
        <p className="text-gray-600">{p.jobTitle}</p>
        <p className="text-[10px] text-gray-500 mt-1">{getContacts(p).join(' · ')}</p>
      </div>
      <hr className="border-t-2 mb-4" style={{ borderColor: style.primary }} />
      <Sections resume={resume} style={style} variant="rule-accent" />
    </div>
  );
};

/* ─── Contact strip top ─── */
export const ContactStripLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="px-6 py-2 flex justify-between text-[10px] border-b-2" style={{ borderColor: style.primary }}>
        <span className="font-bold" style={{ color: style.primary }}>{p.fullName}</span>
        <span className="text-gray-600">{getContacts(p).join(' | ')}</span>
      </div>
      <div className="px-6 py-3 border-b" style={getThemedMutedBandStyle(style)}>
        <p className="font-semibold text-sm">{p.jobTitle}</p>
      </div>
      <div className="px-6 py-5">
        <Sections resume={resume} style={style} variant={variant} />
      </div>
    </div>
  );
};

/* ─── Sidebar with footer block ─── */
export const SidebarFooterLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  const contacts = getContactEntries(p);
  const skills = resume.skills || [];
  return (
    <div className="flex min-h-[297mm]" style={{ fontSize: '11px', fontFamily: style.font }}>
      <aside className="w-[34%] shrink-0 flex flex-col text-white" style={{ background: style.primary }}>
        <div className="p-5 flex-1">
          {p.photo && <img src={p.photo} alt="" className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-white/30" />}
          <h1 className="text-xl font-bold">{p.fullName || 'Your Name'}</h1>
          <p className="text-sm opacity-90 mt-1 pb-4 border-b border-white/20">{p.jobTitle}</p>
          <p className="text-[10px] uppercase tracking-wider opacity-60 mt-4 mb-2">Contact</p>
          {contacts.map((c) => (
            <div key={c.type} className="text-[10px] mb-1 opacity-95">{c.value}</div>
          ))}
          {skills.length > 0 && (
            <div className="mt-6">
              <p className="text-[10px] uppercase tracking-wider opacity-60 mb-2">Skills</p>
              <SkillBars skills={skills} style={style} light />
            </div>
          )}
        </div>
        <div className="p-3 text-[9px] text-center opacity-80" style={{ background: style.secondary }}>
          {p.fullName} — Resume
        </div>
      </aside>
      <main className="flex-1 p-6" style={{ background: style.bg }}>
        <Sections resume={resumeWithoutSkills(resume)} style={style} variant={variant} />
      </main>
    </div>
  );
};

/* ─── Asymmetric columns ─── */
export const AsymmetricLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="px-6 py-5 border-b" style={{ borderColor: style.primary }}>
        <h1 className="text-2xl font-bold" style={{ color: style.primary }}>{p.fullName}</h1>
        <p className="text-gray-600">{p.jobTitle}</p>
      </div>
      <div className="flex">
        <div className="w-[68%] p-5 border-r border-gray-100">
          <Sections
            resume={{ ...resume, skills: [], education: [] }}
            style={style}
            variant="default"
            exclude={['skills', 'education']}
          />
        </div>
        <div className="w-[32%] p-4" style={{ background: `${style.primary}08` }}>
          <Sections
            resume={{ ...resume, experience: [], projects: [], summary: '' }}
            style={style}
            variant="pill"
            exclude={['experience', 'projects', 'summary', 'personal']}
          />
        </div>
      </div>
    </div>
  );
};

/* ─── Compact pro ─── */
export const CompactProLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div className="px-5 py-4" style={{ background: style.bg, fontSize: '10px', fontFamily: style.font }}>
      <div className="flex justify-between items-baseline border-b pb-2 mb-3" style={{ borderColor: style.primary }}>
        <h1 className="text-lg font-bold" style={{ color: style.primary }}>{p.fullName}</h1>
        <span className="text-[9px] text-gray-500">{getContacts(p).join(' · ')}</span>
      </div>
      <p className="text-xs font-medium text-gray-700 mb-3">{p.jobTitle}</p>
      <Sections resume={resume} style={style} variant={variant} />
    </div>
  );
};

/* ─── Classic header (single column) ─── */
export const SplitHalfLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  const contacts = getContactEntries(p);
  return (
    <div className="flex min-h-[297mm]" style={{ fontSize: '11px', fontFamily: style.font }}>
      <aside className="w-[42%] shrink-0 flex flex-col justify-between text-white p-7" style={{ background: style.primary }}>
        <div>
          {p.photo && (
            <img src={p.photo} alt="" className="w-28 h-28 rounded-full object-cover border-4 border-white/30 mb-6 mx-auto" />
          )}
          <h1 className="text-2xl font-bold leading-tight text-center">{p.fullName || 'Your Name'}</h1>
          <p className="text-sm opacity-90 mt-2 text-center pb-5 border-b border-white/25">{p.jobTitle || 'Job Title'}</p>
          <p className="text-[10px] uppercase tracking-widest opacity-60 mt-5 mb-2">Contact</p>
          {contacts.map((c) => (
            <div key={c.type} className="text-[10px] mb-1.5 opacity-95">{c.value}</div>
          ))}
        </div>
        {resume.skills?.filter((s) => s.name)?.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/20">
            <p className="text-[10px] uppercase tracking-widest opacity-60 mb-2">Core skills</p>
            <SkillBars skills={resume.skills} style={style} light />
          </div>
        )}
      </aside>
      <main className="flex-1 p-7" style={{ background: style.bg }}>
        {resume.summary && (
          <p className="text-[11px] text-gray-600 mb-5 leading-relaxed italic border-l-4 pl-4" style={{ borderColor: style.secondary }}>
            {resume.summary}
          </p>
        )}
        <Sections
          resume={{ ...resumeWithoutSkills(resume), summary: '' }}
          style={style}
          variant={variant}
        />
      </main>
    </div>
  );
};

export const NewspaperLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  const skills = resume.skills?.filter((s) => s.name) || [];
  const edu = resume.education || [];
  const certs = resume.certifications || [];
  return (
    <div className="p-6 min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="border-b-4 pb-3 mb-4" style={{ borderColor: style.primary }}>
        <h1 className="text-4xl font-black uppercase tracking-tight" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
        <p className="text-sm font-medium mt-1 text-gray-600">{p.jobTitle} · {getContacts(p).join(' · ')}</p>
      </div>
      {resume.summary && (
        <p className="text-[11px] text-gray-700 mb-5 columns-2 gap-6 leading-relaxed">{resume.summary}</p>
      )}
      <Sections
        resume={{ ...resume, summary: '', skills: [], education: [], certifications: [] }}
        style={style}
        variant="pill"
      />
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t-2" style={{ borderColor: style.primary }}>
        <div>
          <p className="text-[10px] font-bold uppercase mb-2" style={{ color: style.primary }}>Skills</p>
          {skills.map((s, i) => <div key={i} className="text-[10px] text-gray-600 mb-0.5">{s.name}</div>)}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase mb-2" style={{ color: style.primary }}>Education</p>
          {edu.map((e, i) => (
            <div key={i} className="text-[10px] mb-1">
              <div className="font-semibold">{e.degree}</div>
              <div className="text-gray-500">{e.institution}</div>
            </div>
          ))}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase mb-2" style={{ color: style.primary }}>Certifications</p>
          {certs.map((c, i) => <div key={i} className="text-[10px] text-gray-600 mb-0.5">{c.name}</div>)}
        </div>
      </div>
    </div>
  );
};

export const SwissLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div className="p-8 min-h-[297mm]" style={{ background: style.bg, fontSize: '10px', fontFamily: style.font }}>
      <div className="grid grid-cols-12 gap-4 border-b-2 pb-4 mb-5" style={{ borderColor: style.primary }}>
        <div className="col-span-8">
          <h1 className="text-3xl font-light tracking-tight uppercase" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
        </div>
        <div className="col-span-4 text-right text-[9px] text-gray-500 self-end">
          {getContactEntries(p).map((c) => <div key={c.type}>{c.value}</div>)}
        </div>
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.3em] mb-6 text-gray-600">{p.jobTitle}</p>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 border-r pr-6" style={{ borderColor: `${style.primary}30` }}>
          <Sections resume={{ ...resume, skills: [] }} style={style} variant="minimal" exclude={['skills']} />
        </div>
        <div className="col-span-4">
          {resume.skills?.filter((s) => s.name)?.length > 0 && (
            <>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: style.primary }}>Skills</p>
              {resume.skills.filter((s) => s.name).map((s, i) => (
                <div key={i} className="text-[10px] mb-2 pb-2 border-b border-gray-200">{s.name}</div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const ExecutiveDarkLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div className="min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="relative px-8 pt-10 pb-16 text-white" style={{ background: style.primary }}>
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold">{p.fullName || 'Your Name'}</h1>
            <p className="text-lg opacity-90 mt-1">{p.jobTitle || 'Job Title'}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-[10px] opacity-75">
              {getContactEntries(p).map((c) => <span key={c.type}>{c.value}</span>)}
            </div>
          </div>
          {p.photo && (
            <img src={p.photo} alt="" className="w-24 h-24 rounded-lg object-cover border-2 border-white/30 shrink-0" />
          )}
        </div>
      </div>
      <div className="px-8 -mt-8 relative z-10">
        <div className="rounded-xl p-6 shadow-lg" style={{ background: style.bg, border: `1px solid ${style.primary}20` }}>
          <Sections resume={resume} style={style} variant={variant} />
        </div>
      </div>
    </div>
  );
};

export const HorizontalSidebarLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  const contacts = getContactEntries(p);
  return (
    <div className="min-h-[297mm] flex flex-col" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="flex border-b-4" style={{ borderColor: style.primary }}>
        {p.photo && (
          <img src={p.photo} alt="" className="w-32 h-32 object-cover shrink-0" />
        )}
        <div className="flex-1 p-5 text-white flex flex-col justify-center" style={{ background: style.primary }}>
          <h1 className="text-2xl font-bold">{p.fullName || 'Your Name'}</h1>
          <p className="text-sm opacity-90">{p.jobTitle}</p>
        </div>
        <div className="w-[30%] shrink-0 p-4 flex flex-col justify-center" style={{ background: getThemedFrameBg(style) }}>
          {contacts.map((c) => (
            <div key={c.type} className="text-[9px] text-gray-600 mb-1">{c.value}</div>
          ))}
        </div>
      </div>
      <div className="flex-1 p-6">
        <Sections resume={resumeWithoutSkills(resume)} style={style} variant={variant} />
      </div>
    </div>
  );
};

export const PolaroidLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div className="p-8 min-h-[297mm]" style={{ background: getThemedFrameBg(style), fontSize: '11px', fontFamily: style.font }}>
      <div className="text-center mb-8">
        <div
          className="inline-block p-3 pb-8 bg-white shadow-xl rotate-[-2deg] mb-4"
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
        >
          {p.photo ? (
            <img src={p.photo} alt="" className="w-36 h-36 object-cover" />
          ) : (
            <div className="w-36 h-36 bg-gray-200" />
          )}
          <p className="text-[10px] text-gray-600 mt-3 font-medium">{p.fullName || 'Your Name'}</p>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
        <p className="text-gray-600">{p.jobTitle}</p>
        <p className="text-[10px] text-gray-500 mt-2">{getContacts(p).join(' · ')}</p>
      </div>
      <div className="rounded-xl p-6" style={{ background: style.bg }}>
        <Sections resume={resume} style={style} variant={variant} />
      </div>
    </div>
  );
};

export const MarginColumnLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div className="flex min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <aside className="w-[22%] shrink-0 p-4 border-r-2 flex flex-col" style={{ borderColor: style.primary }}>
        <h1
          className="text-lg font-bold leading-tight uppercase tracking-wide origin-top-left"
          style={{ color: style.primary, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          {p.fullName || 'Your Name'}
        </h1>
        <p className="text-[9px] text-gray-500 mt-auto pt-6">{getContacts(p).join(' · ')}</p>
      </aside>
      <main className="flex-1 p-6">
        <p className="text-sm font-semibold mb-4 pb-2 border-b" style={{ color: style.secondary, borderColor: `${style.primary}40` }}>
          {p.jobTitle || 'Job Title'}
        </p>
        <Sections resume={resume} style={style} variant={variant} />
      </main>
    </div>
  );
};

export const MosaicHeaderLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  const tiles = [
    { label: 'Role', value: p.jobTitle || 'Job Title' },
    { label: 'Email', value: p.email || '—' },
    { label: 'Phone', value: p.phone || '—' },
    { label: 'Location', value: p.location || '—' },
  ];
  return (
    <div style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="p-6 text-white" style={{ background: style.primary }}>
        <h1 className="text-2xl font-bold">{p.fullName || 'Your Name'}</h1>
      </div>
      <div className="grid grid-cols-2">
        {tiles.map((t, i) => (
          <div
            key={t.label}
            className="p-3 text-[10px]"
            style={{ background: i % 2 === 0 ? `${style.secondary}18` : `${style.primary}10` }}
          >
            <span className="font-bold uppercase text-[9px] block mb-0.5" style={{ color: style.primary }}>{t.label}</span>
            <span className="text-gray-700">{t.value}</span>
          </div>
        ))}
      </div>
      <div className="p-6">
        <Sections resume={resume} style={style} variant={variant} />
      </div>
    </div>
  );
};

export const AcademicLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div className="p-10 min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-normal" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
        <p className="text-sm text-gray-600 mt-1">{p.jobTitle}</p>
        <p className="text-[10px] text-gray-500 mt-2">{getContacts(p).join(' · ')}</p>
      </div>
      <hr className="border-t mb-5" style={{ borderColor: style.primary }} />
      <Sections resume={resume} style={style} variant="rule-accent" />
    </div>
  );
};

export const RetroLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div className="p-5 min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="p-6 border-4 border-double h-full" style={{ borderColor: style.primary }}>
        <div className="text-center pb-4 mb-4 border-b-2" style={{ borderColor: style.secondary }}>
          <h1 className="text-2xl font-bold tracking-wide" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
          <p className="text-sm italic text-gray-600 mt-1">{p.jobTitle}</p>
          <p className="text-[10px] text-gray-500 mt-2">{getContacts(p).join(' · ')}</p>
        </div>
        <Sections resume={resume} style={style} variant={variant === 'default' ? 'elegant' : variant} />
      </div>
    </div>
  );
};

export const WaveHeaderLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div
        className="relative px-8 pt-8 pb-14 text-white overflow-hidden"
        style={{ background: style.primary }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 h-8"
          style={{
            background: style.bg,
            borderTopLeftRadius: '50% 100%',
            borderTopRightRadius: '50% 100%',
          }}
        />
        <h1 className="text-2xl font-bold relative z-10">{p.fullName || 'Your Name'}</h1>
        <p className="text-sm opacity-90 relative z-10">{p.jobTitle}</p>
        <p className="text-[10px] opacity-75 mt-2 relative z-10">{getContacts(p).join(' · ')}</p>
      </div>
      <div className="px-8 py-6 -mt-4">
        <Sections resume={resume} style={style} variant={variant} />
      </div>
    </div>
  );
};

export const StackedBandsLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  const order = (resume.sectionOrder || ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'])
    .filter((k) => k !== 'personal');
  return (
    <div className="min-h-[297mm]" style={{ fontSize: '11px', fontFamily: style.font }}>
      <div className="px-8 py-6 text-white text-center" style={{ background: style.primary }}>
        <h1 className="text-2xl font-bold">{p.fullName || 'Your Name'}</h1>
        <p className="opacity-90">{p.jobTitle}</p>
      </div>
      {order.map((key, i) => (
        <div
          key={key}
          className="px-8 py-4"
          style={{ background: i % 2 === 0 ? style.bg : getThemedMutedBandStyle(style).backgroundColor }}
        >
          <Sections resume={{ ...resume, sectionOrder: [key] }} style={style} variant={i % 2 === 0 ? 'pill' : 'default'} />
        </div>
      ))}
      <div className="px-8 py-2 text-[9px] text-center text-gray-500 border-t">{getContacts(p).join(' · ')}</div>
    </div>
  );
};

const SECTION_LABELS = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
};

export const QuoteHeroLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div className="min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="px-8 pt-8 pb-4">
        <h1 className="text-3xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
        <p className="text-gray-600 mt-1">{p.jobTitle}</p>
        <p className="text-[10px] text-gray-500 mt-2">{getContacts(p).join(' · ')}</p>
      </div>
      {resume.summary && (
        <div className="mx-8 my-4 p-6 rounded-xl text-white italic text-[12px] leading-relaxed" style={{ background: style.primary }}>
          &ldquo;{resume.summary}&rdquo;
        </div>
      )}
      <div className="px-8 py-4">
        <Sections resume={{ ...resume, summary: '' }} style={style} variant={variant} />
      </div>
    </div>
  );
};

export const ZigzagLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  const order = (resume.sectionOrder || ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'])
    .filter((k) => k !== 'personal');
  return (
    <div className="min-h-[297mm]" style={{ fontSize: '11px', fontFamily: style.font }}>
      <div className="px-8 py-6 text-center border-b-2" style={{ borderColor: style.primary, background: style.bg }}>
        <h1 className="text-2xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
        <p className="text-gray-600">{p.jobTitle}</p>
      </div>
      {order.map((key, i) => (
        <div
          key={key}
          className={`py-4 ${i % 2 === 0 ? 'pl-8 pr-16' : 'pl-16 pr-8'}`}
          style={{ background: i % 2 === 0 ? style.bg : getThemedMutedBandStyle(style).backgroundColor }}
        >
          <Sections resume={{ ...resume, sectionOrder: [key] }} style={style} variant={i % 2 === 0 ? 'default' : 'pill'} />
        </div>
      ))}
    </div>
  );
};

export const NumberedSectionsLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  const order = (resume.sectionOrder || ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'])
    .filter((k) => k !== 'personal');
  return (
    <div className="p-8 min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="mb-6 pb-4 border-b" style={{ borderColor: style.primary }}>
        <h1 className="text-2xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
        <p className="text-gray-600">{p.jobTitle} · {getContacts(p).join(' · ')}</p>
      </div>
      {order.map((key, i) => (
        <div key={key} className="flex gap-4 mb-5">
          <span className="text-2xl font-black opacity-20 shrink-0 w-8" style={{ color: style.primary }}>
            {String(i + 1).padStart(2, '0')}
          </span>
          <div className="flex-1">
            <Sections resume={{ ...resume, sectionOrder: [key] }} style={style} variant="rule-accent" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SidebarBottomLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  const contacts = getContactEntries(p);
  return (
    <div className="min-h-[297mm] flex flex-col" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
        <p className="text-gray-600 mb-4">{p.jobTitle}</p>
        <Sections resume={resumeWithoutSkills(resume)} style={style} variant={variant} />
      </div>
      <div className="flex text-white shrink-0" style={{ background: style.primary }}>
        {p.photo && <img src={p.photo} alt="" className="w-24 h-24 object-cover shrink-0" />}
        <div className="flex-1 p-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]">
          {contacts.map((c) => <span key={c.type}>{c.value}</span>)}
        </div>
        {resume.skills?.filter((s) => s.name)?.length > 0 && (
          <div className="p-4 border-l border-white/20 min-w-[28%]">
            <p className="text-[9px] uppercase opacity-70 mb-1">Skills</p>
            {resume.skills.filter((s) => s.name).slice(0, 6).map((s, i) => (
              <span key={i} className="inline-block text-[9px] mr-2 opacity-95">{s.name}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const CircleBadgesLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  const skills = resume.skills?.filter((s) => s.name) || [];
  return (
    <div className="p-8 min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
        <p className="text-gray-600">{p.jobTitle}</p>
        <p className="text-[10px] text-gray-500 mt-1">{getContacts(p).join(' · ')}</p>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-6 pb-4 border-b" style={{ borderColor: `${style.primary}30` }}>
          {skills.map((s, i) => (
            <span
              key={i}
              className="w-14 h-14 rounded-full flex items-center justify-center text-[8px] font-bold text-center text-white leading-tight p-1"
              style={{ background: i % 2 === 0 ? style.primary : style.secondary }}
            >
              {s.name}
            </span>
          ))}
        </div>
      )}
      <Sections resume={{ ...resume, skills: [] }} style={style} variant={variant} exclude={['skills']} />
    </div>
  );
};

export const LegalFormalLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div className="p-10 min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="text-center uppercase tracking-[0.25em] mb-8">
        <h1 className="text-xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
        <p className="text-[10px] text-gray-600 mt-2 tracking-widest">{p.jobTitle}</p>
        <p className="text-[9px] text-gray-500 mt-3 normal-case tracking-normal">{getContacts(p).join(' · ')}</p>
      </div>
      <div className="border-t border-b py-6 my-4" style={{ borderColor: style.primary }}>
        <Sections resume={resume} style={style} variant="rule-accent" />
      </div>
    </div>
  );
};

export const PortfolioGridLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  const projects = resume.projects || [];
  return (
    <div className="p-6 min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="flex justify-between items-start mb-5 pb-3 border-b-2" style={{ borderColor: style.primary }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
          <p className="text-gray-600">{p.jobTitle}</p>
        </div>
        <p className="text-[9px] text-gray-500 text-right max-w-[40%]">{getContacts(p).join(' · ')}</p>
      </div>
      {resume.summary && <p className="text-[11px] text-gray-600 mb-5">{resume.summary}</p>}
      {projects.length > 0 && (
        <div className="mb-6">
          <SectionTitle style={style} variant="pill">Projects</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {projects.map((proj, i) => (
              <div key={i} className="p-3 rounded-lg border" style={getThemedCardStyles(style, true)}>
                <div className="font-bold text-xs">{proj.name}</div>
                <p className="text-[9px] mt-1" style={{ color: style.secondary }}>{proj.technologies}</p>
                <p className="text-[9px] text-gray-600 mt-1">{proj.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <Sections
        resume={{ ...resume, summary: '', projects: [] }}
        style={style}
        variant="underline-light"
        exclude={['summary', 'projects']}
      />
    </div>
  );
};

export const DiagonalSplitLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div className="relative min-h-[297mm] overflow-hidden" style={{ fontSize: '11px', fontFamily: style.font }}>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${style.primary} 0%, ${style.primary} 48%, ${style.bg} 48%, ${style.bg} 100%)`,
        }}
      />
      <div className="relative z-10 p-8">
        <div className="text-white mb-8 max-w-[45%]">
          <h1 className="text-2xl font-bold">{p.fullName || 'Your Name'}</h1>
          <p className="text-sm opacity-90 mt-1">{p.jobTitle}</p>
          <div className="text-[10px] opacity-80 mt-3 space-y-0.5">
            {getContactEntries(p).map((c) => <div key={c.type}>{c.value}</div>)}
          </div>
        </div>
        <div className="ml-auto max-w-[52%] rounded-lg p-5 shadow-md" style={{ background: style.bg }}>
          <Sections resume={resumeWithoutSkills(resume)} style={style} variant={variant} />
        </div>
      </div>
    </div>
  );
};

export const CircularHeaderLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div className="min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="relative pt-16 pb-8 px-8 text-center overflow-hidden">
        <div
          className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-15"
          style={{ background: style.primary }}
        />
        {p.photo && (
          <img src={p.photo} alt="" className="relative z-10 w-20 h-20 rounded-full object-cover mx-auto mb-3 border-4 border-white shadow" />
        )}
        <h1 className="relative z-10 text-2xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
        <p className="relative z-10 text-gray-600">{p.jobTitle}</p>
        <p className="relative z-10 text-[10px] text-gray-500 mt-2">{getContacts(p).join(' · ')}</p>
      </div>
      <div className="px-8 pb-8">
        <Sections resume={resume} style={style} variant={variant} />
      </div>
    </div>
  );
};

export const TabSectionsLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  const order = (resume.sectionOrder || ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'])
    .filter((k) => k !== 'personal');
  return (
    <div className="p-6 min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
        <p className="text-sm text-gray-600">{p.jobTitle} · {getContacts(p).join(' · ')}</p>
      </div>
      {order.map((key) => (
        <div key={key} className="mb-4">
          <div
            className="inline-block text-[10px] font-bold uppercase px-3 py-1 rounded-t-lg text-white"
            style={{ background: style.primary }}
          >
            {SECTION_LABELS[key] || key}
          </div>
          <div className="p-4 rounded-b-lg rounded-tr-lg border" style={{ ...getThemedCardStyles(style), borderTopLeftRadius: 0 }}>
            <Sections resume={{ ...resume, sectionOrder: [key] }} style={style} variant="default" hideTitles />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ColumnTrioLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div className="p-6 min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="text-center border-b-2 pb-4 mb-5" style={{ borderColor: style.primary }}>
        <h1 className="text-2xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
        <p className="text-gray-600">{p.jobTitle}</p>
        <p className="text-[10px] text-gray-500 mt-1">{getContacts(p).join(' · ')}</p>
      </div>
      {resume.summary && (
        <p className="text-[11px] text-gray-600 mb-5 text-center max-w-lg mx-auto italic">{resume.summary}</p>
      )}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="p-3 rounded-lg border" style={getThemedCardStyles(style)}>
          <Sections resume={{ ...resume, sectionOrder: ['experience'] }} style={style} variant="pill" />
        </div>
        <div className="p-3 rounded-lg border" style={getThemedCardStyles(style)}>
          <Sections resume={{ ...resume, sectionOrder: ['education'] }} style={style} variant="pill" />
        </div>
        <div className="p-3 rounded-lg border" style={getThemedCardStyles(style)}>
          <Sections resume={{ ...resume, sectionOrder: ['skills'] }} style={style} variant="pill" />
        </div>
      </div>
      <Sections
        resume={{ ...resume, summary: '', experience: [], education: [], skills: [] }}
        style={style}
        variant="default"
        exclude={['summary', 'experience', 'education', 'skills']}
      />
    </div>
  );
};

export const HexPhotoLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div className="p-8 min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="flex gap-6 items-center mb-6 pb-4 border-b" style={{ borderColor: style.primary }}>
        {p.photo && (
          <div
            className="w-24 h-24 shrink-0 overflow-hidden"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
          >
            <img src={p.photo} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
          <p className="text-gray-600">{p.jobTitle}</p>
          <p className="text-[10px] text-gray-500 mt-1">{getContacts(p).join(' · ')}</p>
        </div>
      </div>
      <Sections resume={resume} style={style} variant={variant} />
    </div>
  );
};

export const SidebarDuoLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div className="flex min-h-[297mm]" style={{ fontSize: '11px', fontFamily: style.font }}>
      <div className="w-2 shrink-0" style={{ background: style.secondary }} />
      <aside className="w-[28%] shrink-0 p-5 text-white" style={{ background: style.primary }}>
        {p.photo && (
          <img src={p.photo} alt="" className="w-full aspect-square object-cover rounded mb-4" />
        )}
        <h1 className="text-lg font-bold">{p.fullName || 'Your Name'}</h1>
        <p className="text-sm opacity-90 mt-1 mb-4">{p.jobTitle}</p>
        {getContactEntries(p).map((c) => (
          <div key={c.type} className="text-[10px] mb-1 opacity-95">{c.value}</div>
        ))}
      </aside>
      <div className="w-1.5 shrink-0" style={{ background: style.primary }} />
      <main className="flex-1 p-6" style={{ background: style.bg }}>
        <Sections resume={resumeWithoutSkills(resume)} style={style} variant={variant} />
      </main>
    </div>
  );
};

export const NeonTerminalLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  const darkBg = '#0f172a';
  const accent = style.primary;
  const termStyle = { ...style, primary: accent, bg: darkBg, sectionVariant: 'minimal' };
  return (
    <div className="p-6 min-h-[297mm] font-mono" style={{ background: darkBg, fontSize: '10px', color: '#94a3b8' }}>
      <div className="mb-4 pb-3 border-b" style={{ borderColor: `${accent}40` }}>
        <p style={{ color: accent }}>{'> whoami'}</p>
        <h1 className="text-lg font-bold text-white mt-1">{p.fullName || 'Your Name'}</h1>
        <p className="text-xs" style={{ color: accent }}>{'// '}{p.jobTitle || 'Job Title'}</p>
        <p className="text-[9px] mt-2 opacity-70">{getContacts(p).join(' | ')}</p>
      </div>
      <div style={{ color: '#cbd5e1' }}>
        <Sections resume={resume} style={termStyle} variant="minimal" />
      </div>
    </div>
  );
};

export const ClassicLayout = ({ resume, style, variant = 'default' }) => {
  const p = resume.personal || {};
  const contacts = getContactEntries(p);

  return (
    <div className="p-8" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="border-b-4 pb-4 mb-5" style={{ borderColor: style.primary }}>
        {p.photo && (
          <img src={p.photo} alt="" className="w-16 h-16 rounded-full object-cover mb-3 float-right ml-4" />
        )}
        <h1 className="text-2xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
        <p style={{ color: style.secondary }} className="text-sm font-medium">{p.jobTitle || 'Job Title'}</p>
        <div className="flex flex-wrap gap-3 mt-2 text-gray-500 text-[10px]">
          {contacts.map((c) => <span key={c.type}>{c.value}</span>)}
        </div>
      </div>
      <Sections resume={resume} style={style} variant={variant} />
    </div>
  );
};

import { renderRegionalLayout, REGIONAL_LAYOUT_MAP } from './RegionalResumeLayouts';

export const renderLayout = (layout, props) => {
  const { resume, style, variant } = props;
  if (REGIONAL_LAYOUT_MAP[layout]) {
    return renderRegionalLayout(layout, props);
  }
  switch (layout) {
    case 'sidebar':
      return <SidebarLeftLayout {...props} />;
    case 'sidebar-wide':
      return <SidebarLeftLayout {...props} wide />;
    case 'sidebar-right':
      return <SidebarRightLayout {...props} />;
    case 'sidebar-accent':
      return <SidebarAccentLayout {...props} />;
    case 'dual-column':
      return <DualColumnLayout {...props} />;
    case 'timeline':
      return <TimelineLayout {...props} />;
    case 'cards':
      return <CardsLayout {...props} />;
    case 'split-top':
      return <SplitTopLayout {...props} />;
    case 'metro':
      return <MetroLayout {...props} />;
    case 'banner-photo':
      return <BannerPhotoLayout {...props} />;
    case 'header-photo-split':
      return <HeaderPhotoSplitLayout {...props} />;
    case 'boxed-sections':
      return <BoxedSectionsLayout {...props} />;
    case 'magazine':
      return <MagazineLayout {...props} />;
    case 'stripe':
      return <StripeLayout {...props} />;
    case 'diagonal-header':
      return <DiagonalHeaderLayout {...props} />;
    case 'narrow-right':
      return <NarrowRightLayout {...props} />;
    case 'infographic':
      return <InfographicLayout {...props} />;
    case 'minimal':
      return (
        <div className="p-8 text-center" style={{ background: style.bg, fontSize: '11px' }}>
          <h1 className="text-3xl font-light text-gray-900">{resume.personal?.fullName || 'Your Name'}</h1>
          <p className="text-gray-500 mt-1">{resume.personal?.jobTitle}</p>
          <div className="mt-8 text-left">
            <Sections resume={resume} style={style} variant="minimal" />
          </div>
        </div>
      );
    case 'modern-header':
      return (
        <div style={{ background: style.bg, fontSize: '11px' }}>
          <div className="p-8 text-white" style={{ background: style.primary }}>
            <h1 className="text-2xl font-bold">{resume.personal?.fullName || 'Your Name'}</h1>
            <p className="opacity-90">{resume.personal?.jobTitle}</p>
          </div>
          <div className="p-8"><Sections resume={resume} style={style} variant={variant} /></div>
        </div>
      );
    case 'bold':
      return (
        <div style={{ background: style.bg, fontSize: '11px' }}>
          <div className="p-8 text-white" style={{ background: style.primary }}>
            <h1 className="text-3xl font-black">{resume.personal?.fullName || 'Your Name'}</h1>
            <p className="text-lg opacity-90">{resume.personal?.jobTitle}</p>
          </div>
          <div className="p-8"><Sections resume={resume} style={style} variant={variant} /></div>
        </div>
      );
    case 'elegant':
      return (
        <div className="p-8" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
          <div className="text-center border-b border-gray-200 pb-4 mb-6">
            <h1 className="text-3xl" style={{ color: style.primary }}>{resume.personal?.fullName || 'Your Name'}</h1>
            <p className="italic text-gray-600 mt-1">{resume.personal?.jobTitle}</p>
          </div>
          <Sections resume={resume} style={style} variant="elegant" />
        </div>
      );
    case 'corporate':
      return (
        <div className="p-8" style={{ background: style.bg, fontSize: '11px' }}>
          <div className="flex justify-between border-b-2 border-gray-900 pb-3 mb-5">
            <div>
              <h1 className="text-xl font-bold">{resume.personal?.fullName || 'Your Name'}</h1>
              <p className="text-sm text-gray-600">{resume.personal?.jobTitle}</p>
            </div>
            <div className="text-[10px] text-gray-500 text-right">
              {getContactEntries(resume.personal).map((c) => <div key={c.type}>{c.value}</div>)}
            </div>
          </div>
          <Sections resume={resume} style={style} variant="default" />
        </div>
      );
    case 'tech':
      return (
        <div className="p-8 font-mono" style={{ background: style.bg, fontSize: '11px' }}>
          <h1 className="text-xl font-bold mb-1" style={{ color: style.primary }}>{'>'} {resume.personal?.fullName || 'Your Name'}</h1>
          <p className="text-gray-500 text-xs mb-4">// {resume.personal?.jobTitle}</p>
          <Sections resume={resume} style={style} variant="minimal" />
        </div>
      );
    case 'accent':
      return (
        <div className="p-8 flex gap-4" style={{ background: style.bg, fontSize: '11px' }}>
          <div className="w-1.5 rounded-full shrink-0" style={{ background: style.primary }} />
          <div className="flex-1">
            <Sections resume={resume} style={style} variant="default" />
          </div>
        </div>
      );
    case 'topbar':
      return <TopbarLayout {...props} />;
    case 'topbar-footer':
      return <TopbarFooterLayout {...props} />;
    case 'header-band':
      return <HeaderBandLayout {...props} />;
    case 'footer-bar':
      return <FooterBarLayout {...props} />;
    case 'double-header':
      return <DoubleHeaderLayout {...props} />;
    case 'centered-hero':
      return <CenteredHeroLayout {...props} />;
    case 'frame-border':
      return <FrameBorderLayout {...props} />;
    case 'ribbon-left':
      return <RibbonLeftLayout {...props} />;
    case 'rule-sections':
      return <RuleSectionsLayout {...props} />;
    case 'contact-strip':
      return <ContactStripLayout {...props} />;
    case 'sidebar-footer':
      return <SidebarFooterLayout {...props} />;
    case 'asymmetric':
      return <AsymmetricLayout {...props} />;
    case 'compact-pro':
      return <CompactProLayout {...props} />;
    case 'split-half':
      return <SplitHalfLayout {...props} />;
    case 'newspaper':
      return <NewspaperLayout {...props} />;
    case 'swiss':
      return <SwissLayout {...props} />;
    case 'executive-dark':
      return <ExecutiveDarkLayout {...props} />;
    case 'horizontal-sidebar':
      return <HorizontalSidebarLayout {...props} />;
    case 'polaroid':
      return <PolaroidLayout {...props} />;
    case 'margin-column':
      return <MarginColumnLayout {...props} />;
    case 'mosaic-header':
      return <MosaicHeaderLayout {...props} />;
    case 'academic':
      return <AcademicLayout {...props} />;
    case 'retro':
      return <RetroLayout {...props} />;
    case 'wave-header':
      return <WaveHeaderLayout {...props} />;
    case 'stacked-bands':
      return <StackedBandsLayout {...props} />;
    case 'quote-hero':
      return <QuoteHeroLayout {...props} />;
    case 'zigzag':
      return <ZigzagLayout {...props} />;
    case 'numbered-sections':
      return <NumberedSectionsLayout {...props} />;
    case 'sidebar-bottom':
      return <SidebarBottomLayout {...props} />;
    case 'circle-badges':
      return <CircleBadgesLayout {...props} />;
    case 'legal-formal':
      return <LegalFormalLayout {...props} />;
    case 'portfolio-grid':
      return <PortfolioGridLayout {...props} />;
    case 'diagonal-split':
      return <DiagonalSplitLayout {...props} />;
    case 'circular-header':
      return <CircularHeaderLayout {...props} />;
    case 'tab-sections':
      return <TabSectionsLayout {...props} />;
    case 'column-trio':
      return <ColumnTrioLayout {...props} />;
    case 'hex-photo':
      return <HexPhotoLayout {...props} />;
    case 'sidebar-duo':
      return <SidebarDuoLayout {...props} />;
    case 'neon-terminal':
      return <NeonTerminalLayout {...props} />;
    default:
      return <ClassicLayout resume={resume} style={style} variant={variant} />;
  }
};

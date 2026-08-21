import { Sections, SkillBars, getContacts, getContactEntries, resumeWithoutSkills } from './resumeSections';

const RegionalHeader = ({ style, p, showPhoto, docTitle, centered }) => (
  <div className={`mb-5 pb-3 border-b-2 ${centered ? 'text-center' : ''}`} style={{ borderColor: style.primary }}>
    {docTitle && (
      <p className="text-[9px] font-bold tracking-[0.35em] text-gray-400 mb-2">{docTitle}</p>
    )}
    <div className={centered ? '' : 'flex gap-4 items-start'}>
      {showPhoto && p.photo && (
        <img
          src={p.photo}
          alt=""
          className={`${centered ? 'mx-auto mb-3' : 'shrink-0'} w-20 h-20 object-cover border-2`}
          style={{ borderColor: style.primary }}
        />
      )}
      <div className={centered ? '' : 'flex-1'}>
        <h1 className="text-2xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
        <p className="text-sm text-gray-600 mt-0.5">{p.jobTitle || 'Job Title'}</p>
        <p className="text-[10px] text-gray-500 mt-2">{getContacts(p).join(' · ')}</p>
      </div>
    </div>
  </div>
);

/** US — no photo, ATS-friendly, tight single column */
export const USResumeLayout = ({ resume, style, variant }) => {
  const p = resume.personal || {};
  return (
    <div className="p-8 min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <RegionalHeader style={style} p={p} showPhoto={false} docTitle={style.sectionLabels?.docTitle} />
      <Sections resume={resume} style={style} variant={variant || 'default'} />
    </div>
  );
};

/** UK — formal CV, profile-led */
export const UKCVLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div className="p-8 min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <RegionalHeader style={style} p={p} showPhoto={false} docTitle={style.sectionLabels?.docTitle} />
      <Sections resume={resume} style={style} variant="rule-accent" />
    </div>
  );
};

/** EU — Europass-inspired two column */
export const EUCVLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div className="min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="px-6 py-4 text-white flex gap-4 items-center" style={{ background: style.primary }}>
        {p.photo && <img src={p.photo} alt="" className="w-16 h-16 rounded object-cover border-2 border-white/40 shrink-0" />}
        <div>
          <h1 className="text-xl font-bold">{p.fullName || 'Your Name'}</h1>
          <p className="text-sm opacity-90">{p.jobTitle}</p>
        </div>
      </div>
      <div className="flex">
        <aside className="w-[32%] shrink-0 p-4 border-r text-[10px]" style={{ borderColor: `${style.primary}30`, background: `${style.primary}08` }}>
          <p className="font-bold uppercase mb-2" style={{ color: style.primary }}>Contact</p>
          {getContactEntries(p).map((c) => <div key={c.type} className="mb-1 text-gray-600">{c.value}</div>)}
          {resume.skills?.filter((s) => s.name)?.length > 0 && (
            <div className="mt-4">
              <p className="font-bold uppercase mb-2" style={{ color: style.primary }}>{style.sectionLabels?.skills || 'Skills'}</p>
              <SkillBars skills={resume.skills} style={style} />
            </div>
          )}
        </aside>
        <main className="flex-1 p-4">
          <Sections resume={resumeWithoutSkills(resume)} style={style} variant="underline-light" />
        </main>
      </div>
    </div>
  );
};

/** Germany — photo left, structured blocks */
export const DECVLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div className="flex min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <aside className="w-[30%] shrink-0 p-5 border-r-2" style={{ borderColor: style.primary }}>
        {p.photo && <img src={p.photo} alt="" className="w-full aspect-[3/4] object-cover mb-4" />}
        <p className="text-[9px] font-bold tracking-widest text-gray-400 mb-2">{style.sectionLabels?.docTitle}</p>
        <h1 className="text-lg font-bold leading-tight" style={{ color: style.primary }}>{p.fullName}</h1>
        <p className="text-xs text-gray-600 mt-1 mb-4">{p.jobTitle}</p>
        {getContactEntries(p).map((c) => <div key={c.type} className="text-[10px] text-gray-600 mb-1">{c.value}</div>)}
      </aside>
      <main className="flex-1 p-6">
        <Sections resume={resume} style={style} variant="rule-accent" />
      </main>
    </div>
  );
};

/** France — elegant centered with photo */
export const FRCVLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div className="p-8 min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: 'Playfair Display, Georgia, serif' }}>
      <RegionalHeader style={style} p={p} showPhoto centered docTitle={style.sectionLabels?.docTitle} />
      <Sections resume={resume} style={style} variant="elegant" />
    </div>
  );
};

/** Pakistan / Bangladesh — formal photo, education emphasis */
export const PKCVLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div className="min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="flex border-b-4" style={{ borderColor: style.primary }}>
        {p.photo && <img src={p.photo} alt="" className="w-28 h-32 object-cover shrink-0" />}
        <div className="flex-1 p-5">
          <p className="text-[9px] font-bold tracking-widest text-gray-400">{style.sectionLabels?.docTitle}</p>
          <h1 className="text-2xl font-bold mt-1" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
          <p className="text-gray-700 font-medium">{p.jobTitle}</p>
          <p className="text-[10px] text-gray-500 mt-2">{getContacts(p).join(' · ')}</p>
        </div>
      </div>
      <div className="p-6">
        <Sections resume={resume} style={style} variant="rule-accent" />
      </div>
    </div>
  );
};

/** Saudi — conservative formal, photo + sidebar contacts */
export const SACVLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div className="flex min-h-[297mm]" style={{ fontSize: '11px', fontFamily: style.font }}>
      <aside className="w-[32%] shrink-0 p-5 text-white" style={{ background: style.primary }}>
        {p.photo && <img src={p.photo} alt="" className="w-24 h-28 object-cover mx-auto mb-4 border-2 border-white/30" />}
        <h1 className="text-lg font-bold text-center">{p.fullName || 'Your Name'}</h1>
        <p className="text-sm text-center opacity-90 mt-1 mb-4 pb-3 border-b border-white/20">{p.jobTitle}</p>
        <p className="text-[9px] uppercase tracking-wider opacity-60 mb-2">Contact</p>
        {getContactEntries(p).map((c) => <div key={c.type} className="text-[10px] mb-1 opacity-95">{c.value}</div>)}
      </aside>
      <main className="flex-1 p-6" style={{ background: style.bg }}>
        <p className="text-[9px] font-bold tracking-widest text-gray-400 mb-3">{style.sectionLabels?.docTitle}</p>
        <Sections resume={resumeWithoutSkills(resume)} style={style} variant="default" />
      </main>
    </div>
  );
};

/** UAE / Gulf — modern professional with gold-accent feel via secondary */
export const AECVLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div className="min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="px-6 py-5 flex gap-5 items-center border-b-4" style={{ borderColor: style.secondary }}>
        {p.photo && <img src={p.photo} alt="" className="w-20 h-20 rounded-full object-cover border-4 shrink-0" style={{ borderColor: style.primary }} />}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
          <p className="text-gray-600">{p.jobTitle}</p>
          <p className="text-[10px] mt-1" style={{ color: style.secondary }}>{getContacts(p).join(' · ')}</p>
        </div>
      </div>
      <div className="p-6">
        <Sections resume={resume} style={style} variant="rule-accent" />
      </div>
    </div>
  );
};

/** India — objective-led, photo top-right */
export const INCVLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div className="p-7 min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="relative pb-4 mb-4 border-b-2" style={{ borderColor: style.primary }}>
        {p.photo && <img src={p.photo} alt="" className="absolute top-0 right-0 w-20 h-24 object-cover border" style={{ borderColor: style.primary }} />}
        <h1 className="text-2xl font-bold pr-24" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
        <p className="text-gray-600">{p.jobTitle}</p>
        <p className="text-[10px] text-gray-500 mt-2">{getContacts(p).join(' · ')}</p>
      </div>
      <Sections resume={resume} style={style} variant="default" />
    </div>
  );
};

/** Canada — bilingual-friendly clean resume */
export const CACVLayout = ({ resume, style }) => USResumeLayout({ resume, style, variant: 'default' });

/** Australia — skills-forward CV */
export const AUCVLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  const skills = resume.skills?.filter((s) => s.name) || [];
  return (
    <div className="p-8 min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <RegionalHeader style={style} p={p} showPhoto={false} docTitle={style.sectionLabels?.docTitle} />
      {skills.length > 0 && (
        <div className="mb-5 p-3 rounded-lg border" style={{ borderColor: `${style.primary}30`, background: `${style.primary}08` }}>
          <p className="text-[10px] font-bold uppercase mb-2" style={{ color: style.primary }}>{style.sectionLabels?.skills || 'Skills'}</p>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s, i) => (
              <span key={i} className="px-2 py-0.5 rounded text-[10px] text-white" style={{ background: style.primary }}>{s.name}</span>
            ))}
          </div>
        </div>
      )}
      <Sections resume={{ ...resume, skills: [] }} style={style} variant="underline-light" exclude={['skills']} />
    </div>
  );
};

/** Japan / Korea — formal structured */
export const JPCVLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div className="p-8 min-h-[297mm]" style={{ background: style.bg, fontSize: '10px', fontFamily: style.font }}>
      <table className="w-full mb-4 border-collapse text-left">
        <tbody>
          <tr>
            {p.photo && (
              <td className="w-24 align-top pr-4">
                <img src={p.photo} alt="" className="w-20 h-24 object-cover border" style={{ borderColor: style.primary }} />
              </td>
            )}
            <td className="align-top">
              <p className="text-[9px] text-gray-400 tracking-widest">{style.sectionLabels?.docTitle}</p>
              <h1 className="text-xl font-bold mt-1" style={{ color: style.primary }}>{p.fullName}</h1>
              <p className="text-gray-600">{p.jobTitle}</p>
            </td>
          </tr>
        </tbody>
      </table>
      <p className="text-[10px] text-gray-500 mb-4 pb-2 border-b">{getContacts(p).join(' · ')}</p>
      <Sections resume={resume} style={style} variant="minimal" />
    </div>
  );
};

/** Nigeria / Africa professional */
export const NGCVLayout = ({ resume, style }) => PKCVLayout({ resume, style });

/** Brazil / Latin America */
export const BRCVLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div className="min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="px-6 py-5 text-white" style={{ background: `linear-gradient(135deg, ${style.primary}, ${style.secondary})` }}>
        <div className="flex gap-4 items-center">
          {p.photo && <img src={p.photo} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white/40" />}
          <div>
            <h1 className="text-xl font-bold">{p.fullName || 'Your Name'}</h1>
            <p className="opacity-90">{p.jobTitle}</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <Sections resume={resume} style={style} variant="pill" />
      </div>
    </div>
  );
};

/** South Africa */
export const ZACVLayout = ({ resume, style }) => UKCVLayout({ resume, style });

/** Malaysia / SE Asia */
export const MYCVLayout = ({ resume, style }) => INCVLayout({ resume, style });

/** Singapore — clean corporate */
export const SGCVLayout = ({ resume, style }) => {
  const p = resume.personal || {};
  return (
    <div className="p-8 min-h-[297mm]" style={{ background: style.bg, fontSize: '11px', fontFamily: style.font }}>
      <div className="flex justify-between items-start border-b pb-4 mb-5" style={{ borderColor: style.primary }}>
        <div>
          <h1 className="text-xl font-bold" style={{ color: style.primary }}>{p.fullName || 'Your Name'}</h1>
          <p className="text-gray-600">{p.jobTitle}</p>
        </div>
        {p.photo && <img src={p.photo} alt="" className="w-16 h-16 rounded object-cover" />}
      </div>
      <p className="text-[10px] text-gray-500 mb-4">{getContacts(p).join(' · ')}</p>
      <Sections resume={resume} style={style} variant="default" />
    </div>
  );
};

/** Egypt */
export const EGCVLayout = ({ resume, style }) => SACVLayout({ resume, style });

/** Turkey */
export const TRCVLayout = ({ resume, style }) => EUCVLayout({ resume, style });

export const REGIONAL_LAYOUT_MAP = {
  'us-resume': USResumeLayout,
  'uk-cv': UKCVLayout,
  'eu-cv': EUCVLayout,
  'de-cv': DECVLayout,
  'fr-cv': FRCVLayout,
  'pk-cv': PKCVLayout,
  'sa-cv': SACVLayout,
  'ae-cv': AECVLayout,
  'in-cv': INCVLayout,
  'ca-cv': CACVLayout,
  'au-cv': AUCVLayout,
  'jp-cv': JPCVLayout,
  'ng-cv': NGCVLayout,
  'br-cv': BRCVLayout,
  'za-cv': ZACVLayout,
  'my-cv': MYCVLayout,
  'sg-cv': SGCVLayout,
  'eg-cv': EGCVLayout,
  'tr-cv': TRCVLayout,
};

export function renderRegionalLayout(layout, props) {
  const Component = REGIONAL_LAYOUT_MAP[layout];
  return Component ? <Component {...props} /> : null;
}

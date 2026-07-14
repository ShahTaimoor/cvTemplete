import { getLayoutForSlug } from '../config/templatePresets.js';

const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const formatDate = (start, end, current) => {
  const s = start || '';
  const e = current ? 'Present' : end || '';
  if (!s && !e) return '';
  return `${s}${s && e ? ' – ' : ''}${e}`;
};

const sectionTitle = (title, theme) =>
  `<h2 style="color:${theme.primaryColor};border-bottom:2px solid ${theme.primaryColor};padding-bottom:4px;margin:16px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">${escapeHtml(title)}</h2>`;

const baseStyles = (theme, layout) => {
  const flexLayouts = [
    'sidebar', 'sidebar-wide', 'sidebar-right', 'sidebar-accent', 'narrow-right',
    'dual-column', 'split-top', 'metro', 'infographic',
  ];
  const sidebar = flexLayouts.includes(layout);
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: '${theme.fontFamily || 'Inter'}', 'Segoe UI', sans-serif;
      background: ${theme.backgroundColor};
      color: #1f2937;
      font-size: 11px;
      line-height: 1.45;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: ${theme.backgroundColor};
      display: ${sidebar ? 'flex' : 'block'};
    }
    .sidebar {
      width: 34%;
      background: ${theme.primaryColor};
      color: #fff;
      padding: 24px 16px;
    }
    .sidebar.wide { width: 38%; }
    .sidebar.right { order: 2; background: ${theme.secondaryColor}; }
    .sidebar.light { background: #f8fafc; color: #334155; border-right: 1px solid #e2e8f0; }
    .sidebar.light .name { color: ${theme.primaryColor}; }
    .accent-stripe { width: 8px; background: ${theme.primaryColor}; flex-shrink: 0; }
    .main { flex: 1; padding: 24px 28px; }
    .header-band { background: ${theme.primaryColor}; color: #fff; padding: 20px 28px; display: flex; justify-content: space-between; align-items: center; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px 28px; }
    .col-right { border-left: 1px solid #e5e7eb; padding-left: 20px; }
    .split-top { display: grid; grid-template-columns: 1fr 1fr; min-height: 120px; }
    .split-left { background: ${theme.primaryColor}; color: #fff; padding: 28px; }
    .split-right { background: ${theme.secondaryColor}; color: #fff; padding: 28px; }
    .metro-top { display: grid; grid-template-columns: 2fr 1fr; }
    .metro-main { background: ${theme.primaryColor}; color: #fff; padding: 24px; }
    .metro-side { background: ${theme.secondaryColor}; padding: 24px; display: flex; align-items: center; justify-content: center; }
    .card-wrap { background: #f3f4f6; padding: 20px; min-height: 297mm; }
    .card-header { background: linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor}); color: #fff; padding: 20px; border-radius: 12px; margin-bottom: 16px; }
    .card-body { background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .timeline { border-left: 2px solid ${theme.primaryColor}40; padding-left: 16px; margin-left: 4px; }
    .timeline-dot { width: 10px; height: 10px; border-radius: 50%; background: #fff; border: 2px solid ${theme.primaryColor}; margin-left: -21px; margin-bottom: 4px; }
    .skill-bar { height: 6px; background: rgba(255,255,255,0.25); border-radius: 4px; margin-top: 4px; }
    .skill-fill { height: 100%; background: #fff; border-radius: 4px; }
    .header-classic { border-bottom: 3px solid ${theme.primaryColor}; padding-bottom: 12px; margin-bottom: 12px; }
    .name { font-size: 26px; font-weight: 700; color: ${theme.primaryColor}; }
    .job { font-size: 13px; color: ${theme.secondaryColor}; margin-top: 4px; }
    .contact { font-size: 10px; color: #6b7280; margin-top: 8px; display: flex; flex-wrap: wrap; gap: 12px; }
    .item { margin-bottom: 10px; }
    .item-title { font-weight: 600; font-size: 12px; }
    .item-sub { color: ${theme.secondaryColor}; font-size: 10px; }
    .item-desc { margin-top: 4px; color: #4b5563; white-space: pre-wrap; }
    .skills { display: flex; flex-wrap: wrap; gap: 6px; }
    .skill-tag {
      background: ${theme.primaryColor}18;
      color: ${theme.primaryColor};
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
    }
    .photo { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 12px; }
    ul.bullets { padding-left: 16px; margin-top: 4px; }
  `;
};

const renderPersonalClassic = (resume, theme) => {
  const p = resume.personal || {};
  const contacts = [p.email, p.phone, p.location, p.website, p.linkedin].filter(Boolean);
  return `
    <div class="header-classic">
      ${p.photo ? `<img class="photo" src="${escapeHtml(p.photo)}" alt="" />` : ''}
      <div class="name">${escapeHtml(p.fullName)}</div>
      <div class="job">${escapeHtml(p.jobTitle)}</div>
      <div class="contact">${contacts.map((c) => `<span>${escapeHtml(c)}</span>`).join('')}</div>
    </div>
  `;
};

const renderPersonalSidebar = (resume) => {
  const p = resume.personal || {};
  const contacts = [p.email, p.phone, p.location, p.website, p.linkedin].filter(Boolean);
  return `
    ${p.photo ? `<img class="photo" src="${escapeHtml(p.photo)}" alt="" />` : ''}
    <div class="name" style="color:#fff;font-size:20px;">${escapeHtml(p.fullName)}</div>
    <div class="job" style="color:#ffffffcc;font-size:11px;margin:6px 0 16px;">${escapeHtml(p.jobTitle)}</div>
    ${contacts.map((c) => `<div style="font-size:10px;margin-bottom:6px;opacity:0.9;">${escapeHtml(c)}</div>`).join('')}
  `;
};

const renderExperience = (items, theme) => {
  if (!items?.length) return '';
  return (
    sectionTitle('Experience', theme) +
    items
      .map(
        (e) => `
      <div class="item">
        <div class="item-title">${escapeHtml(e.position)} — ${escapeHtml(e.company)}</div>
        <div class="item-sub">${escapeHtml(e.location)} · ${formatDate(e.startDate, e.endDate, e.current)}</div>
        <div class="item-desc">${escapeHtml(e.description)}</div>
      </div>`
      )
      .join('')
  );
};

const renderEducation = (items, theme) => {
  if (!items?.length) return '';
  return (
    sectionTitle('Education', theme) +
    items
      .map(
        (e) => `
      <div class="item">
        <div class="item-title">${escapeHtml(e.degree)} ${e.field ? `in ${escapeHtml(e.field)}` : ''}</div>
        <div class="item-sub">${escapeHtml(e.institution)} · ${formatDate(e.startDate, e.endDate)}</div>
        <div class="item-desc">${escapeHtml(e.description)}</div>
      </div>`
      )
      .join('')
  );
};

const renderSkills = (items, theme) => {
  if (!items?.length) return '';
  return (
    sectionTitle('Skills', theme) +
    `<div class="skills">${items
      .filter((s) => s.name)
      .map((s) => `<span class="skill-tag">${escapeHtml(s.name)}</span>`)
      .join('')}</div>`
  );
};

const renderProjects = (items, theme) => {
  if (!items?.length) return '';
  return (
    sectionTitle('Projects', theme) +
    items
      .map(
        (p) => `
      <div class="item">
        <div class="item-title">${escapeHtml(p.name)}${p.url ? ` — ${escapeHtml(p.url)}` : ''}</div>
        <div class="item-sub">${escapeHtml(p.technologies)}</div>
        <div class="item-desc">${escapeHtml(p.description)}</div>
      </div>`
      )
      .join('')
  );
};

const renderCerts = (items, theme) => {
  if (!items?.length) return '';
  return (
    sectionTitle('Certifications', theme) +
    items
      .map(
        (c) => `
      <div class="item">
        <div class="item-title">${escapeHtml(c.name)}</div>
        <div class="item-sub">${escapeHtml(c.issuer)} · ${escapeHtml(c.date)}</div>
      </div>`
      )
      .join('')
  );
};

const renderSummary = (summary, theme) => {
  if (!summary) return '';
  return sectionTitle('Summary', theme) + `<p class="item-desc">${escapeHtml(summary)}</p>`;
};

const renderSkillsSidebar = (skills) => {
  if (!skills?.length) return '';
  return `<p style="font-size:10px;text-transform:uppercase;opacity:0.7;margin:16px 0 8px;">Skills</p>
    ${skills.filter((s) => s.name).map((s, i) => `
      <div style="font-size:10px;margin-bottom:8px;">${escapeHtml(s.name)}
        <div class="skill-bar"><div class="skill-fill" style="width:${60 + (i % 4) * 10}%"></div></div>
      </div>`).join('')}`;
};

const renderMainSections = (resume, theme, exclude = []) => {
  const order = resume.sectionOrder || [
    'summary', 'experience', 'education', 'skills', 'projects', 'certifications',
  ];
  const renderers = {
    summary: () => renderSummary(resume.summary, theme),
    experience: () => renderExperience(resume.experience, theme),
    education: () => renderEducation(resume.education, theme),
    skills: () => renderSkills(resume.skills, theme),
    projects: () => renderProjects(resume.projects, theme),
    certifications: () => renderCerts(resume.certifications, theme),
  };
  return order
    .filter((k) => k !== 'personal' && !exclude.includes(k))
    .map((k) => renderers[k]?.() || '')
    .join('');
};

const buildSidebarLeft = (resume, theme, wide) => {
  const p = resume.personal || {};
  const photo = p.photo
    ? `<img class="photo" src="${escapeHtml(p.photo)}" alt="" style="${wide ? 'width:100%;height:140px;border-radius:0;margin:0 0 12px;' : ''}" />`
    : '';
  return `
    <div class="page">
      <div class="sidebar ${wide ? 'wide' : ''}">
        ${photo}
        <div class="name">${escapeHtml(p.fullName)}</div>
        <div class="job">${escapeHtml(p.jobTitle)}</div>
        ${[p.email, p.phone, p.location].filter(Boolean).map((c) => `<div style="font-size:10px;margin-bottom:6px;opacity:0.9;">${escapeHtml(c)}</div>`).join('')}
        ${renderSkillsSidebar(resume.skills)}
      </div>
      <div class="main">${renderMainSections(resume, theme, ['skills'])}</div>
    </div>`;
};

const buildSidebarRight = (resume, theme) => {
  const p = resume.personal || {};
  const summary = resume.summary
    ? `<p style="font-size:11px;color:#4b5563;border-left:4px solid ${theme.primaryColor};padding-left:12px;margin:12px 0;">${escapeHtml(resume.summary)}</p>`
    : '';
  const edu = (resume.education || [])
    .map(
      (e) => `<div style="font-size:10px;margin-bottom:8px;color:#fff;"><strong>${escapeHtml(e.degree)}</strong><br/>${escapeHtml(e.institution)}</div>`
    )
    .join('');
  return `
    <div class="page">
      <div class="main">
        <div class="name" style="color:${theme.primaryColor};font-size:28px;">${escapeHtml(p.fullName)}</div>
        <div class="job">${escapeHtml(p.jobTitle)}</div>
        ${summary}
        ${renderMainSections({ ...resume, summary: '' }, theme, ['skills', 'education', 'summary'])}
      </div>
      <div class="sidebar right">
        ${p.photo ? `<img class="photo" src="${escapeHtml(p.photo)}" alt="" style="width:100%;border-radius:8px;" />` : ''}
        <p style="font-size:10px;text-transform:uppercase;opacity:0.7;margin:12px 0 6px;">Contact</p>
        ${[p.email, p.phone, p.location, p.website].filter(Boolean).map((c) => `<div style="font-size:10px;margin-bottom:6px;">${escapeHtml(c)}</div>`).join('')}
        ${renderSkillsSidebar(resume.skills)}
        ${edu ? `<p style="font-size:10px;text-transform:uppercase;opacity:0.7;margin:16px 0 6px;">Education</p>${edu}` : ''}
      </div>
    </div>`;
};

export const buildResumeHtml = (resume, template) => {
  const theme = {
    primaryColor: resume.theme?.primaryColor || '#2563eb',
    secondaryColor: resume.theme?.secondaryColor || '#1e40af',
    backgroundColor: resume.theme?.backgroundColor || '#ffffff',
    fontFamily: resume.theme?.fontFamily || 'Inter',
  };
  const slug = resume.templateSlug || template?.slug || 'classic-blue';
  const layout = getLayoutForSlug(slug) || template?.layout || 'classic';

  let bodyContent;
  if (layout === 'sidebar' || layout === 'sidebar-wide') {
    bodyContent = buildSidebarLeft(resume, theme, layout === 'sidebar-wide');
  } else if (layout === 'sidebar-right') {
    bodyContent = buildSidebarRight(resume, theme);
  } else if (layout === 'sidebar-accent') {
    const p = resume.personal || {};
    bodyContent = `
      <div class="page">
        <div class="accent-stripe"></div>
        <div class="sidebar light">
          <div style="background:${theme.primaryColor};color:#fff;padding:12px;border-radius:8px;margin-bottom:12px;">
            <div class="name">${escapeHtml(p.fullName)}</div>
            <div class="job">${escapeHtml(p.jobTitle)}</div>
          </div>
          ${[p.email, p.phone].filter(Boolean).map((c) => `<div style="font-size:10px;margin-bottom:4px;">${escapeHtml(c)}</div>`).join('')}
        </div>
        <div class="main">${renderMainSections(resume, theme, ['skills'])}</div>
      </div>`;
  } else if (layout === 'dual-column') {
    const p = resume.personal || {};
    bodyContent = `
      <div class="page" style="display:block;">
        <div class="header-band">
          <div><div class="name" style="color:#fff;font-size:22px;">${escapeHtml(p.fullName)}</div>
          <div class="job" style="color:#ffffffcc;">${escapeHtml(p.jobTitle)}</div></div>
          <div style="font-size:10px;text-align:right;opacity:0.9;">${[p.email, p.phone].filter(Boolean).map(escapeHtml).join('<br/>')}</div>
        </div>
        ${resume.summary ? `<div style="padding:12px 28px;background:#f9fafb;font-style:italic;font-size:11px;">${escapeHtml(resume.summary)}</div>` : ''}
        <div class="cols">
          <div>${renderExperience(resume.experience, theme)}${renderProjects(resume.projects, theme)}</div>
          <div class="col-right">${renderEducation(resume.education, theme)}${renderSkills(resume.skills, theme)}${renderCerts(resume.certifications, theme)}</div>
        </div>
      </div>`;
  } else if (layout === 'split-top') {
    const p = resume.personal || {};
    bodyContent = `
      <div class="page" style="display:block;">
        <div class="split-top">
          <div class="split-left"><div style="font-size:26px;font-weight:800;">${escapeHtml(p.fullName)}</div><div style="font-size:14px;margin-top:8px;">${escapeHtml(p.jobTitle)}</div></div>
          <div class="split-right">${[p.email, p.phone, p.location].filter(Boolean).map((c) => `<div style="font-size:11px;margin-bottom:6px;">${escapeHtml(c)}</div>`).join('')}</div>
        </div>
        <div style="padding:24px 28px;">${renderMainSections(resume, theme)}</div>
      </div>`;
  } else if (layout === 'metro') {
    const p = resume.personal || {};
    bodyContent = `
      <div class="page" style="display:block;">
        <div class="metro-top">
          <div class="metro-main"><div style="font-size:22px;font-weight:700;">${escapeHtml(p.fullName)}</div><div>${escapeHtml(p.jobTitle)}</div></div>
          <div class="metro-side">${p.photo ? `<img class="photo" src="${escapeHtml(p.photo)}" alt="" />` : escapeHtml(p.email || '')}</div>
        </div>
        <div style="padding:24px 28px;">${renderMainSections(resume, theme)}</div>
      </div>`;
  } else if (layout === 'cards') {
    const p = resume.personal || {};
    bodyContent = `
      <div class="card-wrap">
        <div class="card-header"><div style="font-size:22px;font-weight:700;">${escapeHtml(p.fullName)}</div><div>${escapeHtml(p.jobTitle)}</div></div>
        <div class="card-body">${renderMainSections(resume, theme)}</div>
      </div>`;
  } else if (layout === 'timeline') {
    const p = resume.personal || {};
    const timeline = (resume.experience || [])
      .map(
        (e) => `<div class="item" style="margin-bottom:14px;"><div class="timeline-dot"></div>
        <div class="item-title">${escapeHtml(e.position)}</div>
        <div class="item-sub" style="color:${theme.primaryColor}">${escapeHtml(e.company)}</div>
        <div class="item-desc">${escapeHtml(e.description)}</div></div>`
      )
      .join('');
    bodyContent = `
      <div class="page" style="padding:24px 28px;display:block;">
        <div class="name">${escapeHtml(p.fullName)}</div><div class="job">${escapeHtml(p.jobTitle)}</div>
        ${renderSummary(resume.summary, theme)}
        <h2 style="color:${theme.primaryColor};font-size:12px;margin:16px 0 8px;">EXPERIENCE</h2>
        <div class="timeline">${timeline}</div>
        ${renderMainSections({ ...resume, experience: [] }, theme, ['experience', 'summary'])}
      </div>`;
  } else if (layout === 'banner-photo') {
    const p = resume.personal || {};
    bodyContent = `
      <div class="page" style="display:block;">
        <div style="background:linear-gradient(135deg,${theme.primaryColor},${theme.secondaryColor});color:#fff;padding:32px 28px;min-height:120px;">
          <div style="font-size:26px;font-weight:700;">${escapeHtml(p.fullName)}</div>
          <div style="font-size:14px;opacity:0.9;">${escapeHtml(p.jobTitle)}</div>
        </div>
        <div style="padding:24px 28px;">${renderMainSections(resume, theme)}</div>
      </div>`;
  } else if (layout === 'header-photo-split') {
    const p = resume.personal || {};
    bodyContent = `
      <div class="page" style="display:block;">
        <div style="display:flex;border-bottom:4px solid ${theme.primaryColor};">
          <div style="width:35%;">${p.photo ? `<img src="${escapeHtml(p.photo)}" style="width:100%;height:160px;object-fit:cover;" />` : `<div style="height:160px;background:${theme.primaryColor}"></div>`}</div>
          <div style="flex:1;padding:20px;"><div class="name">${escapeHtml(p.fullName)}</div><div class="job">${escapeHtml(p.jobTitle)}</div></div>
        </div>
        <div style="padding:24px 28px;">${renderMainSections(resume, theme)}</div>
      </div>`;
  } else if (layout === 'magazine') {
    const p = resume.personal || {};
    bodyContent = `
      <div class="page" style="padding:24px 28px;display:block;">
        <div style="display:flex;border-bottom:1px solid #e5e7eb;padding-bottom:16px;margin-bottom:16px;">
          <div style="flex:3;"><div style="font-size:32px;font-weight:800;color:${theme.primaryColor};">${escapeHtml(p.fullName)}</div><div>${escapeHtml(p.jobTitle)}</div></div>
          <div style="flex:2;border-left:2px solid ${theme.primaryColor};padding-left:12px;font-size:10px;color:#6b7280;">${[p.email,p.phone].filter(Boolean).map(escapeHtml).join('<br/>')}</div>
        </div>
        ${renderMainSections(resume, theme)}
      </div>`;
  } else if (layout === 'narrow-right') {
    const p = resume.personal || {};
    bodyContent = `
      <div class="page">
        <div class="main" style="flex:7;">${renderPersonalClassic(resume, theme)}${renderMainSections(resume, theme, ['skills','certifications'])}</div>
        <div class="sidebar light" style="flex:3;background:#f9fafb;">
          <p style="font-size:10px;font-weight:700;color:${theme.primaryColor};">CONTACT</p>
          ${[p.email,p.phone,p.location].filter(Boolean).map((c)=>`<div style="font-size:10px;margin-bottom:4px;">${escapeHtml(c)}</div>`).join('')}
          ${renderSkillsSidebar(resume.skills)}
        </div>
      </div>`;
  } else if (layout === 'infographic') {
    const p = resume.personal || {};
    bodyContent = `
      <div class="page" style="display:block;">
        <div style="background:${theme.primaryColor};color:#fff;padding:20px 28px;"><div style="font-size:22px;font-weight:700;">${escapeHtml(p.fullName)}</div><div>${escapeHtml(p.jobTitle)}</div></div>
        <div style="display:flex;">
          <div style="flex:2;padding:24px;">${renderExperience(resume.experience, theme)}${renderMainSections({...resume,experience:[]}, theme, ['experience','skills'])}</div>
          <div style="flex:1;padding:16px;border-left:1px solid #e5e7eb;background:${theme.primaryColor}08;">${renderSkills(resume.skills, theme)}${renderEducation(resume.education, theme)}</div>
        </div>
      </div>`;
  } else if (layout === 'diagonal-header') {
    const p = resume.personal || {};
    bodyContent = `
      <div class="page" style="display:block;">
        <div style="background:linear-gradient(120deg,${theme.primaryColor} 55%,${theme.secondaryColor} 55%);color:#fff;padding:28px;min-height:100px;">
          <div style="font-size:24px;font-weight:700;">${escapeHtml(p.fullName)}</div><div>${escapeHtml(p.jobTitle)}</div>
        </div>
        <div style="padding:24px 28px;">${renderMainSections(resume, theme)}</div>
      </div>`;
  } else if (layout === 'stripe') {
    const p = resume.personal || {};
    bodyContent = `
      <div class="page" style="display:block;">
        <div style="background:${theme.primaryColor};color:#fff;padding:24px 28px;"><div style="font-size:26px;font-weight:700;">${escapeHtml(p.fullName)}</div></div>
        <div style="padding:20px 28px;background:${theme.backgroundColor};">${renderMainSections(resume, theme)}</div>
      </div>`;
  } else if (layout === 'boxed-sections') {
    const p = resume.personal || {};
    bodyContent = `
      <div class="card-wrap">
        <div class="card-body" style="border-top:4px solid ${theme.primaryColor};margin-bottom:12px;"><div class="name">${escapeHtml(p.fullName)}</div><div class="job">${escapeHtml(p.jobTitle)}</div></div>
        <div class="card-body">${renderMainSections(resume, theme)}</div>
      </div>`;
  } else {
    bodyContent = `
      <div class="page" style="padding:24px 28px;display:block;">
        ${renderPersonalClassic(resume, theme)}
        ${renderMainSections(resume, theme)}
      </div>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
  <style>${baseStyles(theme, layout)}</style>
</head>
<body>${bodyContent}</body>
</html>`;
};

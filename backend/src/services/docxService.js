import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';

const heading = (text, level = HeadingLevel.HEADING_2) =>
  new Paragraph({ text, heading: level, spacing: { after: 120 } });

const para = (text, bold = false) =>
  new Paragraph({
    children: [new TextRun({ text: text || '', bold })],
    spacing: { after: 100 },
  });

export const buildResumeDocx = async (resume) => {
  const p = resume.personal || {};
  const children = [
    new Paragraph({
      children: [
        new TextRun({ text: p.fullName || 'Resume', bold: true, size: 32 }),
      ],
      spacing: { after: 80 },
    }),
    para(p.jobTitle || ''),
    para([p.email, p.phone, p.location].filter(Boolean).join(' · ')),
  ];

  if (resume.summary) {
    children.push(heading('Summary'));
    children.push(para(resume.summary));
  }

  if (resume.experience?.length) {
    children.push(heading('Experience'));
    resume.experience.forEach((e) => {
      children.push(para(`${e.position} — ${e.company}`, true));
      children.push(para(`${e.startDate || ''} – ${e.current ? 'Present' : e.endDate || ''}`));
      if (e.description) children.push(para(e.description));
    });
  }

  if (resume.education?.length) {
    children.push(heading('Education'));
    resume.education.forEach((e) => {
      children.push(para(`${e.degree}${e.field ? ` in ${e.field}` : ''} — ${e.institution}`, true));
    });
  }

  if (resume.skills?.filter((s) => s.name)?.length) {
    children.push(heading('Skills'));
    children.push(
      para(resume.skills.filter((s) => s.name).map((s) => s.name).join(', '))
    );
  }

  if (resume.projects?.length) {
    children.push(heading('Projects'));
    resume.projects.forEach((pr) => {
      children.push(para(pr.name, true));
      if (pr.description) children.push(para(pr.description));
    });
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
};

export const buildCoverLetterDocx = async (letter) => {
  const p = letter.personal || {};
  const children = [
    para(p.fullName || '', true),
    para([p.email, p.phone, p.location].filter(Boolean).join(' · ')),
    para(''),
    para(letter.date || ''),
    para(''),
    para(letter.recipientName || ''),
    para(letter.recipientTitle || ''),
    para(letter.companyName || ''),
    para(letter.companyAddress || ''),
    para(''),
    para(letter.salutation || 'Dear Hiring Manager,'),
    para(''),
    ...(letter.body || '').split('\n').map((line) => para(line)),
    para(''),
    para(letter.closing || 'Sincerely,'),
    para(p.fullName || ''),
  ];

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
};

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  ShadingType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlignTable,
  ImageRun,
} from 'docx';

const DEFAULT_PRIMARY = '2563EB';
const DEFAULT_SECONDARY = '1E40AF';
const DEFAULT_BG = 'FFFFFF';
const DEFAULT_FONT = 'Inter';
const BODY_GRAY = '4B5563';

// docx wants a bare 6-digit hex (no '#'); fall back to the app's default theme color if malformed/missing.
const hexColor = (hex, fallback) => {
  const clean = String(hex || '').replace('#', '').toUpperCase();
  return /^[0-9A-F]{6}$/.test(clean) ? clean : fallback;
};

const clampByte = (n) => Math.max(0, Math.min(255, Math.round(n)));

// Mix a theme color toward white to approximate the app's tinted card/badge
// backgrounds (CSS uses e.g. `${primary}15` over a white page) — docx shading
// needs a solid hex, not an alpha channel.
const mixWithWhite = (hex, ratio) => {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const mix = (c) => clampByte(c * ratio + 255 * (1 - ratio)).toString(16).padStart(2, '0');
  return `${mix(r)}${mix(g)}${mix(b)}`.toUpperCase();
};

const detectImageType = (buffer) => {
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.length >= 3 && buffer.toString('ascii', 0, 3) === 'GIF') return 'gif';
  if (buffer.length >= 2 && buffer.toString('ascii', 0, 2) === 'BM') return 'bmp';
  return null;
};

// Fetches the (Cloudinary-hosted, or any) photo URL server-side so it can be embedded
// via ImageRun. Never throws — a missing/unreachable/unsupported photo just means no
// photo in the export, not a failed export.
const fetchPhotoImage = async (url) => {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const type = detectImageType(buffer);
    if (!type) return null;
    return { data: buffer, type };
  } catch {
    return null;
  }
};

const para = (text, bold = false) =>
  new Paragraph({
    children: [new TextRun({ text: text || '', bold })],
    spacing: { after: 100 },
  });

const noBorders = {
  top: { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE },
  right: { style: BorderStyle.NONE },
  insideHorizontal: { style: BorderStyle.NONE },
  insideVertical: { style: BorderStyle.NONE },
};

/**
 * Builds a single-column, theme-colored DOCX from resume data.
 * Intentionally does not replicate per-template column/sidebar/box layouts
 * (sidebar, two-column, boxed, etc.) — that's a separate, larger effort.
 */
export const buildResumeDocx = async (resume) => {
  const p = resume.personal || {};
  const theme = resume.theme || {};
  const primary = hexColor(theme.primaryColor, DEFAULT_PRIMARY);
  const secondary = hexColor(theme.secondaryColor, DEFAULT_SECONDARY);
  const background = hexColor(theme.backgroundColor, DEFAULT_BG);
  const font = theme.fontFamily || DEFAULT_FONT;

  const themedHeading = (text) =>
    new Paragraph({
      spacing: { before: 280, after: 120 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, space: 4, color: primary },
      },
      children: [
        new TextRun({ text: text.toUpperCase(), bold: true, color: primary, font, size: 22 }),
      ],
    });

  const themedPara = (text, opts = {}) =>
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: text || '', font, size: 20, ...opts })],
    });

  // Approximates the app's tinted "boxed card" sections (Projects/Certifications) —
  // a single-cell table standing in for a bordered, filled <div>, since docx tables
  // are the only way to get a background fill + border around block content.
  const cardFill = mixWithWhite(primary, 0.08);
  const cardBorder = mixWithWhite(primary, 0.25);
  const card = (paragraphs) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: cardBorder },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: cardBorder },
        left: { style: BorderStyle.SINGLE, size: 4, color: cardBorder },
        right: { style: BorderStyle.SINGLE, size: 4, color: cardBorder },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { type: ShadingType.CLEAR, fill: cardFill, color: 'auto' },
              margins: { top: 120, bottom: 120, left: 150, right: 150 },
              children: paragraphs,
            }),
          ],
        }),
      ],
    });
  const cardSpacer = () => new Paragraph({ spacing: { after: 120 }, children: [] });

  // Approximates the app's skill "pill" badges using inline run-level shading + a
  // character border — the closest docx equivalent of a small rounded, filled tag,
  // and unlike a table it wraps naturally with the surrounding text.
  const badgeFill = mixWithWhite(primary, 0.12);
  const badgeBorder = mixWithWhite(primary, 0.4);
  const badgeRun = (text) =>
    new TextRun({
      text: `  ${text}  `,
      font,
      size: 18,
      color: primary,
      shading: { type: ShadingType.CLEAR, fill: badgeFill, color: 'auto' },
      border: { style: BorderStyle.SINGLE, size: 2, color: badgeBorder, space: 1 },
    });

  const headerParagraphs = [
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: p.fullName || 'Resume', bold: true, color: primary, font, size: 40 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: p.jobTitle || '', color: secondary, font, size: 24 })],
    }),
    themedPara([p.email, p.phone, p.location].filter(Boolean).join(' · '), { color: BODY_GRAY, size: 18 }),
  ];

  // Profile photo: positioned top-right next to the name/contact block, similar to
  // the on-screen preview. docx has no shape masking, so this is a plain rectangular
  // image rather than a true circular crop (see PR/summary notes).
  const photo = await fetchPhotoImage(p.photo);
  const children = [];
  if (photo) {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorders,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 78, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlignTable.CENTER,
                children: headerParagraphs,
              }),
              new TableCell({
                width: { size: 22, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlignTable.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        type: photo.type,
                        data: photo.data,
                        transformation: { width: 90, height: 90 },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
    children.push(new Paragraph({ spacing: { after: 60 }, children: [] }));
  } else {
    children.push(...headerParagraphs);
  }

  if (resume.summary) {
    children.push(themedHeading('Summary'));
    children.push(themedPara(resume.summary));
  }

  if (resume.experience?.length) {
    children.push(themedHeading('Experience'));
    resume.experience.forEach((e) => {
      children.push(themedPara(`${e.position} — ${e.company}`, { bold: true }));
      children.push(
        themedPara(`${e.startDate || ''} – ${e.current ? 'Present' : e.endDate || ''}`, {
          color: BODY_GRAY,
          size: 18,
        })
      );
      if (e.description) children.push(themedPara(e.description));
    });
  }

  if (resume.education?.length) {
    children.push(themedHeading('Education'));
    resume.education.forEach((e) => {
      children.push(themedPara(`${e.degree}${e.field ? ` in ${e.field}` : ''} — ${e.institution}`, { bold: true }));
    });
  }

  if (resume.skills?.filter((s) => s.name)?.length) {
    children.push(themedHeading('Skills'));
    const names = resume.skills.filter((s) => s.name);
    const runs = [];
    names.forEach((s, i) => {
      if (i > 0) runs.push(new TextRun({ text: '  ', size: 18 }));
      runs.push(badgeRun(s.name));
    });
    children.push(new Paragraph({ spacing: { after: 100 }, children: runs }));
  }

  if (resume.projects?.length) {
    children.push(themedHeading('Projects'));
    resume.projects.forEach((pr) => {
      const cardParagraphs = [themedPara(pr.name, { bold: true })];
      if (pr.technologies) cardParagraphs.push(themedPara(pr.technologies, { color: secondary, size: 18 }));
      if (pr.description) cardParagraphs.push(themedPara(pr.description));
      children.push(card(cardParagraphs));
      children.push(cardSpacer());
    });
  }

  if (resume.certifications?.length) {
    children.push(themedHeading('Certifications'));
    resume.certifications.forEach((c) => {
      const label = [c.issuer, c.date].filter(Boolean).join(' · ');
      children.push(
        card([
          new Paragraph({
            children: [
              new TextRun({ text: c.name || '', bold: true, font, size: 20 }),
              ...(label ? [new TextRun({ text: `  —  ${label}`, font, size: 18, color: BODY_GRAY })] : []),
            ],
          }),
        ])
      );
      children.push(cardSpacer());
    });
  }

  const doc = new Document({
    // Word only renders this in Web Layout view and hides it from print/PDF by
    // default (Options > Display > "Print background colors and images" must be
    // enabled) — a Word limitation, not something this export can force on.
    background: { color: background },
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

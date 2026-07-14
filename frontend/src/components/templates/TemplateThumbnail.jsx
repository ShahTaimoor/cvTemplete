import { getTemplatePreset } from '../../config/templates';

export default function TemplateThumbnail({ slug, className = '' }) {
  const { layout, primary, secondary, bg } = getTemplatePreset(slug);

  const bar = (w, h = 3, color = primary) => (
    <div style={{ width: w, height: h, background: color, borderRadius: 1, marginBottom: 2 }} />
  );

  const sidebarLeft = (wide) => (
    <div className="flex h-full">
      <div className={`${wide ? 'w-[38%]' : 'w-[32%]'} shrink-0 p-1`} style={{ background: primary }}>
        <div className={`${wide ? 'w-full h-5' : 'w-4 h-4 rounded-full'} bg-white/25 mx-auto mb-1`} />
        {bar('75%', 2, 'rgba(255,255,255,0.8)')}
        {bar('55%', 2, 'rgba(255,255,255,0.5)')}
        {bar('65%', 1.5, 'rgba(255,255,255,0.4)')}
      </div>
      <div className="flex-1 p-1" style={{ background: bg }}>
        {bar('80%')}
        {bar('95%', 2, secondary)}
        {bar('70%', 2, '#d1d5db')}
        {bar('60%', 2, '#e5e7eb')}
      </div>
    </div>
  );

  const sidebarRight = () => (
    <div className="flex h-full">
      <div className="flex-1 p-1" style={{ background: bg }}>
        {bar('70%', 4, primary)}
        {bar('90%', 2, '#d1d5db')}
        {bar('75%', 2, '#e5e7eb')}
      </div>
      <div className="w-[30%] shrink-0 p-1" style={{ background: secondary }}>
        <div className="w-full h-6 bg-white/20 rounded mb-1" />
        {bar('80%', 2, 'rgba(255,255,255,0.7)')}
        {bar('60%', 2, 'rgba(255,255,255,0.5)')}
      </div>
    </div>
  );

  const renderLayout = () => {
    switch (layout) {
      case 'sidebar':
        return sidebarLeft(false);
      case 'sidebar-wide':
        return sidebarLeft(true);
      case 'sidebar-right':
        return sidebarRight();
      case 'sidebar-accent':
        return (
          <div className="flex h-full">
            <div className="w-0.5 shrink-0" style={{ background: primary }} />
            <div className="w-[28%] shrink-0 p-1 bg-gray-100">
              <div className="p-1 rounded mb-1" style={{ background: primary }}>{bar('90%', 2, '#fff')}</div>
              {bar('70%', 2, '#9ca3af')}
            </div>
            <div className="flex-1 p-1" style={{ background: bg }}>{bar('85%')}{bar('60%')}</div>
          </div>
        );
      case 'dual-column':
        return (
          <div className="h-full flex flex-col" style={{ background: bg }}>
            <div className="h-[22%] p-1" style={{ background: primary }}>{bar('50%', 3, '#fff')}</div>
            <div className="flex flex-1 gap-0.5 p-1">
              <div className="flex-1">{bar('80%')}{bar('60%', 2, '#d1d5db')}</div>
              <div className="flex-1 border-l border-gray-200 pl-1">{bar('70%')}{bar('50%', 2, secondary)}</div>
            </div>
          </div>
        );
      case 'timeline':
        return (
          <div className="h-full p-1.5" style={{ background: bg }}>
            {bar('55%', 4, primary)}
            <div className="flex gap-1 mt-1">
              <div className="w-0.5 ml-1" style={{ background: `${primary}50` }} />
              <div className="flex-1">{bar('85%')}{bar('70%', 2, '#d1d5db')}</div>
            </div>
          </div>
        );
      case 'cards':
        return (
          <div className="h-full p-1 bg-gray-200">
            <div className="rounded p-1 mb-1" style={{ background: `linear-gradient(135deg,${primary},${secondary})` }}>
              {bar('60%', 3, '#fff')}
            </div>
            <div className="rounded p-1 bg-white">{bar('90%')}{bar('70%', 2, '#e5e7eb')}</div>
          </div>
        );
      case 'split-top':
        return (
          <div className="h-full flex flex-col">
            <div className="flex h-[35%]">
              <div className="flex-1 p-1" style={{ background: primary }}>{bar('70%', 3, '#fff')}</div>
              <div className="flex-1 p-1" style={{ background: secondary }}>{bar('50%', 2, '#fff')}</div>
            </div>
            <div className="flex-1 p-1" style={{ background: bg }}>{bar('85%')}{bar('60%')}</div>
          </div>
        );
      case 'metro':
        return (
          <div className="h-full flex flex-col" style={{ background: bg }}>
            <div className="flex h-[30%]">
              <div className="flex-[2] p-1" style={{ background: primary }}>{bar('55%', 3, '#fff')}</div>
              <div className="flex-1 p-1" style={{ background: secondary }} />
            </div>
            <div className="flex-1 p-1">{bar('80%')}{bar('65%', 2, primary)}</div>
          </div>
        );
      case 'banner-photo':
        return (
          <div className="h-full flex flex-col" style={{ background: bg }}>
            <div className="h-[38%] p-1 flex flex-col justify-end" style={{ background: `linear-gradient(135deg,${primary},${secondary})` }}>
              {bar('60%', 3, '#fff')}
              {bar('40%', 2, 'rgba(255,255,255,0.7)')}
            </div>
            <div className="flex-1 p-1">{bar('85%')}{bar('70%', 2, '#d1d5db')}</div>
          </div>
        );
      case 'header-photo-split':
        return (
          <div className="h-full flex flex-col" style={{ background: bg }}>
            <div className="flex h-[35%] border-b-2" style={{ borderColor: primary }}>
              <div className="w-[35%]" style={{ background: primary }} />
              <div className="flex-1 p-1">{bar('65%', 3, primary)}{bar('45%', 2, secondary)}</div>
            </div>
            <div className="flex-1 p-1">{bar('90%')}{bar('60%', 2, '#e5e7eb')}</div>
          </div>
        );
      case 'boxed-sections':
        return (
          <div className="h-full p-1 bg-slate-200 space-y-1">
            <div className="rounded p-1 bg-white border-t-2" style={{ borderColor: primary }}>{bar('50%', 3, primary)}</div>
            <div className="rounded p-1 bg-white">{bar('80%')}</div>
            <div className="rounded p-1 bg-white">{bar('70%', 2, '#d1d5db')}</div>
          </div>
        );
      case 'magazine':
        return (
          <div className="h-full p-1.5" style={{ background: bg }}>
            <div className="flex gap-1 mb-1">
              <div className="flex-[3]">{bar('90%', 5, primary)}</div>
              <div className="flex-1 border-l pl-1" style={{ borderColor: primary }}>{bar('70%', 2, '#9ca3af')}</div>
            </div>
            {bar('85%')}{bar('55%', 2, secondary)}
          </div>
        );
      case 'stripe':
        return (
          <div className="h-full flex flex-col">
            <div className="h-[25%] p-1" style={{ background: primary }}>{bar('55%', 3, '#fff')}</div>
            <div className="flex-1 p-1" style={{ background: bg }}>{bar('80%')}</div>
            <div className="flex-1 p-1" style={{ background: `${primary}15` }}>{bar('75%')}</div>
          </div>
        );
      case 'diagonal-header':
        return (
          <div className="h-full flex flex-col" style={{ background: bg }}>
            <div className="h-[32%] p-1" style={{ background: `linear-gradient(120deg,${primary} 60%,${secondary} 60%)` }}>
              {bar('55%', 3, '#fff')}
            </div>
            <div className="flex-1 p-1">{bar('85%')}{bar('65%', 2, '#d1d5db')}</div>
          </div>
        );
      case 'narrow-right':
        return (
          <div className="flex h-full">
            <div className="flex-[7] p-1" style={{ background: bg }}>{bar('70%', 4, primary)}{bar('85%', 2, '#d1d5db')}</div>
            <div className="flex-[3] p-1 bg-gray-100 border-l border-gray-200">{bar('60%', 2, primary)}{bar('50%', 2, '#d1d5db')}</div>
          </div>
        );
      case 'infographic':
        return (
          <div className="h-full flex flex-col" style={{ background: bg }}>
            <div className="h-[22%] p-1 flex" style={{ background: primary }}>{bar('50%', 3, '#fff')}</div>
            <div className="flex flex-1">
              <div className="flex-[2] p-1 border-r border-gray-100">{bar('80%')}{bar('60%', 2, '#d1d5db')}</div>
              <div className="flex-1 p-1">{bar('70%', 2, primary)}{bar('50%', 2, secondary)}</div>
            </div>
          </div>
        );
      case 'minimal':
        return (
          <div className="h-full p-2 flex flex-col items-center" style={{ background: bg }}>
            {bar('45%', 4, primary)}
            <div className="w-full mt-2 space-y-1">{bar('100%', 2, '#e5e7eb')}{bar('80%', 2, '#e5e7eb')}</div>
          </div>
        );
      case 'modern-header':
      case 'bold':
      case 'header-band':
      case 'double-header':
        return (
          <div className="h-full flex flex-col" style={{ background: bg }}>
            <div className="h-[28%] p-1" style={{ background: primary }}>{bar('55%', 3, '#fff')}</div>
            <div className="flex-1 p-1">{bar('65%')}{bar('80%', 2, secondary)}</div>
          </div>
        );
      case 'topbar':
      case 'contact-strip':
        return (
          <div className="h-full flex flex-col" style={{ background: bg }}>
            <div className="h-[12%] p-1" style={{ background: primary }}>{bar('70%', 2, '#fff')}</div>
            <div className="flex-1 p-1">{bar('85%')}{bar('60%', 2, '#d1d5db')}</div>
          </div>
        );
      case 'topbar-footer':
      case 'footer-bar':
        return (
          <div className="h-full flex flex-col" style={{ background: bg }}>
            <div className="h-[14%] p-1" style={{ background: primary }}>{bar('50%', 2, '#fff')}</div>
            <div className="flex-1 p-1">{bar('80%')}</div>
            <div className="h-[12%] p-1" style={{ background: secondary }}>{bar('60%', 2, '#fff')}</div>
          </div>
        );
      case 'centered-hero':
        return (
          <div className="h-full p-2 flex flex-col items-center" style={{ background: bg }}>
            <div className="w-5 h-5 rounded-full mb-1" style={{ background: primary }} />
            {bar('50%', 3, primary)}
            <div className="w-full mt-1">{bar('90%', 2, '#e5e7eb')}</div>
          </div>
        );
      case 'frame-border':
        return (
          <div className="h-full p-1" style={{ background: bg }}>
            <div className="h-full border-2 p-1" style={{ borderColor: primary }}>{bar('55%', 3, primary)}{bar('75%', 2, '#d1d5db')}</div>
          </div>
        );
      case 'ribbon-left':
        return (
          <div className="flex h-full">
            <div className="w-1 shrink-0" style={{ background: primary }} />
            <div className="w-0.5 shrink-0" style={{ background: secondary }} />
            <div className="flex-1 p-1">{bar('70%', 3, primary)}{bar('80%', 2, '#d1d5db')}</div>
          </div>
        );
      case 'rule-sections':
      case 'compact-pro':
        return (
          <div className="h-full p-1.5" style={{ background: bg }}>
            {bar('50%', 3, primary)}
            <div className="border-t my-1" style={{ borderColor: primary }} />
            {bar('85%')}{bar('70%', 2, '#d1d5db')}
          </div>
        );
      case 'sidebar-footer':
        return sidebarLeft(false);
      case 'asymmetric':
        return (
          <div className="flex h-full">
            <div className="w-[65%] p-1" style={{ background: bg }}>{bar('75%')}{bar('60%', 2, '#d1d5db')}</div>
            <div className="w-[35%] p-1" style={{ background: `${primary}18` }}>{bar('55%', 2, primary)}</div>
          </div>
        );
      case 'split-half':
        return (
          <div className="flex h-full">
            <div className="w-[42%] p-1" style={{ background: primary }}>{bar('50%', 3, '#fff')}{bar('40%', 2, '#ffffff88')}</div>
            <div className="w-[58%] p-1" style={{ background: bg }}>{bar('80%')}{bar('65%', 2, '#d1d5db')}</div>
          </div>
        );
      case 'newspaper':
        return (
          <div className="h-full p-1" style={{ background: bg }}>
            {bar('55%', 3, primary)}
            <div className="grid grid-cols-3 gap-0.5 mt-1">{bar('30%', 2, secondary)}{bar('30%', 2, secondary)}{bar('30%', 2, secondary)}</div>
          </div>
        );
      case 'swiss':
        return (
          <div className="h-full flex" style={{ background: bg }}>
            <div className="flex-[2] p-1 border-r" style={{ borderColor: `${primary}40` }}>{bar('70%')}{bar('55%', 2, '#d1d5db')}</div>
            <div className="flex-1 p-1">{bar('45%', 3, primary)}</div>
          </div>
        );
      case 'executive-dark':
        return (
          <div className="h-full" style={{ background: bg }}>
            <div className="h-[35%] p-1" style={{ background: primary }}>{bar('50%', 2, '#fff')}</div>
            <div className="p-1 mx-1 -mt-2 rounded bg-white shadow-sm">{bar('75%')}{bar('50%', 2, '#d1d5db')}</div>
          </div>
        );
      case 'horizontal-sidebar':
        return (
          <div className="h-full flex flex-col" style={{ background: bg }}>
            <div className="h-[28%] flex"><div className="w-[30%]" style={{ background: primary }} /><div className="flex-1 p-1" style={{ background: `${primary}cc` }}>{bar('40%', 2, '#fff')}</div></div>
            <div className="flex-1 p-1">{bar('80%')}</div>
          </div>
        );
      case 'polaroid':
        return (
          <div className="h-full p-1 text-center" style={{ background: `${primary}12` }}>
            <div className="inline-block w-[40%] bg-white p-0.5 mb-1 shadow">{bar('100%', 4, '#e5e7eb')}</div>
            {bar('50%', 2, primary)}
            {bar('70%', 2, '#d1d5db')}
          </div>
        );
      case 'margin-column':
        return (
          <div className="flex h-full">
            <div className="w-[18%] border-r" style={{ borderColor: primary, background: bg }} />
            <div className="flex-1 p-1">{bar('75%')}{bar('60%', 2, '#d1d5db')}</div>
          </div>
        );
      case 'mosaic-header':
        return (
          <div className="h-full" style={{ background: bg }}>
            <div className="h-[22%] p-1" style={{ background: primary }}>{bar('55%', 2, '#fff')}</div>
            <div className="grid grid-cols-2 h-[18%]">{bar('100%', 1, `${secondary}44`)}{bar('100%', 1, `${primary}22`)}</div>
            <div className="p-1">{bar('75%')}</div>
          </div>
        );
      case 'academic':
      case 'retro':
        return (
          <div className="h-full p-1.5 border-2" style={{ background: bg, borderColor: primary }}>
            {bar('45%', 3, primary)}
            <div className="border-t my-1" style={{ borderColor: primary }} />
            {bar('80%')}{bar('60%', 2, '#d1d5db')}
          </div>
        );
      case 'wave-header':
        return (
          <div className="h-full" style={{ background: bg }}>
            <div className="h-[30%] p-1 rounded-b-[50%]" style={{ background: primary }}>{bar('50%', 2, '#fff')}</div>
            <div className="p-1">{bar('75%')}{bar('55%', 2, '#d1d5db')}</div>
          </div>
        );
      case 'stacked-bands':
        return (
          <div className="h-full flex flex-col">
            <div className="h-[18%] p-1" style={{ background: primary }}>{bar('45%', 2, '#fff')}</div>
            <div className="flex-1 p-1" style={{ background: bg }}>{bar('70%')}</div>
            <div className="h-[15%] p-1" style={{ background: `${primary}15` }}>{bar('50%', 2, primary)}</div>
          </div>
        );
      case 'quote-hero':
        return (
          <div className="h-full p-1" style={{ background: bg }}>
            {bar('45%', 2, primary)}
            <div className="rounded p-1 my-1" style={{ background: primary }}>{bar('70%', 2, '#fff')}</div>
            {bar('60%', 2, '#d1d5db')}
          </div>
        );
      case 'zigzag':
        return (
          <div className="h-full flex flex-col">
            <div className="h-[15%] p-1" style={{ background: bg }}>{bar('40%', 2, primary)}</div>
            <div className="flex-1 p-1 pl-2" style={{ background: `${primary}12` }}>{bar('65%')}</div>
            <div className="h-[20%] p-1 pr-2" style={{ background: bg }}>{bar('55%', 2, '#d1d5db')}</div>
          </div>
        );
      case 'numbered-sections':
        return (
          <div className="h-full p-1 flex gap-1" style={{ background: bg }}>
            <div className="w-3 shrink-0">{bar('100%', 4, `${primary}44`)}</div>
            <div className="flex-1">{bar('75%')}{bar('55%', 2, '#d1d5db')}</div>
          </div>
        );
      case 'sidebar-bottom':
        return (
          <div className="h-full flex flex-col" style={{ background: bg }}>
            <div className="flex-1 p-1">{bar('70%')}{bar('50%', 2, '#d1d5db')}</div>
            <div className="h-[22%] p-1" style={{ background: primary }}>{bar('80%', 2, '#fff')}</div>
          </div>
        );
      case 'circle-badges':
        return (
          <div className="h-full p-1 text-center" style={{ background: bg }}>
            {bar('40%', 2, primary)}
            <div className="flex justify-center gap-0.5 my-1">
              {[1, 2, 3, 4].map((n) => <div key={n} className="w-3 h-3 rounded-full" style={{ background: n % 2 ? primary : secondary }} />)}
            </div>
            {bar('65%', 2, '#d1d5db')}
          </div>
        );
      case 'legal-formal':
        return (
          <div className="h-full p-1.5 border-y" style={{ background: bg, borderColor: primary }}>
            {bar('35%', 2, primary)}
            <div className="my-1 border-t border-b py-1" style={{ borderColor: primary }}>{bar('70%')}</div>
          </div>
        );
      case 'portfolio-grid':
        return (
          <div className="h-full p-1" style={{ background: bg }}>
            {bar('45%', 2, primary)}
            <div className="grid grid-cols-2 gap-0.5 my-1">{bar('100%', 2, `${primary}22`)}{bar('100%', 2, `${primary}22`)}</div>
            {bar('55%', 2, '#d1d5db')}
          </div>
        );
      case 'diagonal-split':
        return (
          <div className="h-full relative overflow-hidden">
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary} 48%, ${bg} 48%)` }} />
            <div className="relative p-1 pt-2">{bar('35%', 2, '#fff')}</div>
            <div className="relative p-1 ml-auto w-[55%] mt-2 bg-white rounded shadow-sm">{bar('60%', 2, '#d1d5db')}</div>
          </div>
        );
      case 'circular-header':
        return (
          <div className="h-full p-1 text-center" style={{ background: bg }}>
            <div className="w-8 h-8 rounded-full mx-auto mb-1 opacity-30" style={{ background: primary }} />
            {bar('45%', 2, primary)}
            {bar('65%', 2, '#d1d5db')}
          </div>
        );
      case 'tab-sections':
        return (
          <div className="h-full p-1" style={{ background: bg }}>
            {bar('40%', 2, primary)}
            <div className="mt-1"><div className="inline-block px-1 rounded-t text-[4px] text-white" style={{ background: primary }}>TAB</div><div className="p-1 border rounded-b rounded-tr" style={{ borderColor: primary }}>{bar('50%')}</div></div>
          </div>
        );
      case 'column-trio':
        return (
          <div className="h-full p-1" style={{ background: bg }}>
            {bar('40%', 2, primary)}
            <div className="grid grid-cols-3 gap-0.5 mt-1">{bar('100%', 2, `${primary}18`)}{bar('100%', 2, `${primary}18`)}{bar('100%', 2, `${primary}18`)}</div>
          </div>
        );
      case 'hex-photo':
        return (
          <div className="h-full p-1 flex gap-1 items-center" style={{ background: bg }}>
            <div className="w-6 h-6 shrink-0" style={{ background: primary, clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
            <div className="flex-1">{bar('55%', 2, primary)}{bar('45%', 2, '#d1d5db')}</div>
          </div>
        );
      case 'sidebar-duo':
        return (
          <div className="flex h-full">
            <div className="w-0.5" style={{ background: secondary }} />
            <div className="w-[30%] p-1" style={{ background: primary }}>{bar('50%', 3, '#fff')}</div>
            <div className="w-0.5" style={{ background: primary }} />
            <div className="flex-1 p-1" style={{ background: bg }}>{bar('70%')}</div>
          </div>
        );
      case 'neon-terminal':
        return (
          <div className="h-full p-1 font-mono" style={{ background: '#0f172a' }}>
            {bar('40%', 2, primary)}
            {bar('55%', 2, '#64748b')}
          </div>
        );
      case 'us-resume':
      case 'ca-cv':
        return (
          <div className="h-full p-1.5" style={{ background: bg }}>
            {bar('50%', 2, primary)}
            {bar('85%')}{bar('70%', 2, '#d1d5db')}{bar('55%', 2, '#e5e7eb')}
          </div>
        );
      case 'uk-cv':
      case 'za-cv':
        return (
          <div className="h-full p-1.5" style={{ background: bg }}>
            {bar('35%', 2, primary)}
            <div className="border-t my-1" style={{ borderColor: primary }} />
            {bar('80%')}{bar('60%', 2, '#d1d5db')}
          </div>
        );
      case 'eu-cv':
      case 'tr-cv':
        return sidebarRight();
      case 'de-cv':
      case 'pk-cv':
      case 'ng-cv':
        return sidebarLeft(false);
      case 'fr-cv':
        return (
          <div className="h-full p-1.5 text-center" style={{ background: bg }}>
            <div className="w-5 h-5 rounded-full mx-auto mb-1" style={{ background: `${primary}33` }} />
            {bar('45%', 2, primary)}
            {bar('70%', 2, '#d1d5db')}
          </div>
        );
      case 'sa-cv':
      case 'eg-cv':
        return sidebarLeft(false);
      case 'ae-cv':
        return (
          <div className="h-full p-1" style={{ background: bg }}>
            <div className="flex gap-1 items-center mb-1 pb-1 border-b" style={{ borderColor: secondary }}>
              <div className="w-4 h-4 rounded-full shrink-0" style={{ background: primary }} />
              {bar('50%', 2, primary)}
            </div>
            {bar('75%', 2, '#d1d5db')}
          </div>
        );
      case 'in-cv':
      case 'my-cv':
        return (
          <div className="h-full p-1 relative" style={{ background: bg }}>
            <div className="absolute top-1 right-1 w-4 h-5" style={{ background: primary }} />
            {bar('55%', 2, primary)}
            {bar('70%', 2, '#d1d5db')}
          </div>
        );
      case 'au-cv':
        return (
          <div className="h-full p-1" style={{ background: bg }}>
            {bar('45%', 2, primary)}
            <div className="flex gap-0.5 my-1">{bar('20%', 2, primary)}{bar('20%', 2, primary)}{bar('20%', 2, secondary)}</div>
            {bar('65%', 2, '#d1d5db')}
          </div>
        );
      case 'jp-cv':
        return (
          <div className="h-full p-1 flex gap-1" style={{ background: bg }}>
            <div className="w-5 h-6 shrink-0 border" style={{ borderColor: primary }} />
            <div className="flex-1">{bar('50%', 2, primary)}{bar('60%', 2, '#d1d5db')}</div>
          </div>
        );
      case 'br-cv':
        return (
          <div className="h-full" style={{ background: bg }}>
            <div className="h-[25%] p-1" style={{ background: `linear-gradient(135deg,${primary},${secondary})` }}>{bar('50%', 2, '#fff')}</div>
            <div className="p-1">{bar('70%')}</div>
          </div>
        );
      case 'sg-cv':
        return (
          <div className="h-full p-1" style={{ background: bg }}>
            <div className="flex justify-between mb-1">{bar('45%', 2, primary)}<div className="w-4 h-4 rounded" style={{ background: `${primary}44` }} /></div>
            {bar('70%', 2, '#d1d5db')}
          </div>
        );
      default:
        return (
          <div className="h-full p-1.5" style={{ background: bg }}>
            <div className="border-b-2 pb-1 mb-1" style={{ borderColor: primary }}>
              {bar('60%', 4, primary)}
              {bar('40%', 2, secondary)}
            </div>
            {bar('85%')}
            {bar('55%', 2, '#d1d5db')}
          </div>
        );
    }
  };

  return (
    <div
      className={`rounded-md overflow-hidden border border-white/10 ${className}`}
      style={{ aspectRatio: '210/297', minHeight: 72 }}
    >
      {renderLayout()}
    </div>
  );
}

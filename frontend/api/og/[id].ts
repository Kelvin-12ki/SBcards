export const config = { runtime: 'edge' };

const THEMES: Record<string, { bg: string; accent: string; text: string; textSec: string }> = {
  classic: { bg: '#FFFFFF', accent: '#D4A853', text: '#1B2A4A', textSec: '#5A6B8A' },
  'bold-wave': { bg: '#1A1A2E', accent: '#E63946', text: '#FFFFFF', textSec: '#B0BEC5' },
  corporate: { bg: '#2D3436', accent: '#0984E3', text: '#FFFFFF', textSec: '#B0BEC5' },
  creative: { bg: '#000000', accent: '#F39C12', text: '#FFFFFF', textSec: '#B0BEC5' },
  neon: { bg: '#0D1B2A', accent: '#FF6EC7', text: '#FFFFFF', textSec: '#8E8E93' },
};

export default async function handler(req: Request) {
  const { ImageResponse } = await import('@vercel/og');
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();

  if (!id || id === 'default') {
    return new ImageResponse(
      buildHtml({ name: 'NEXAS', role: 'Digital Business Cards', company: '', accent: '#D4A853', bg: '#0A0A0B', text: '#D4A853', textSec: '#8E8E93', initials: 'SB' }),
      { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } },
    );
  }

  let card: any;
  try {
    const res = await fetch(`https://sbcards.onrender.com/cards/public/${id}`);
    if (!res.ok) throw new Error('not found');
    card = await res.json();
  } catch {
    return new ImageResponse(
      buildHtml({ name: 'NEXAS', role: 'Digital Business Cards', company: '', accent: '#D4A853', bg: '#0A0A0B', text: '#D4A853', textSec: '#8E8E93', initials: 'SB' }),
      { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } },
    );
  }

  const name = card.fullName || 'NEXAS User';
  const role = card.role || card.headline || '';
  const company = card.company || '';
  const theme = THEMES[card.theme] || THEMES.classic;
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarUrl = card.avatarUrl && !card.avatarUrl.startsWith('data:') ? card.avatarUrl : '';

  return new ImageResponse(
    buildHtml({ name, role, company, accent: theme.accent, bg: theme.bg, text: theme.text, textSec: theme.textSec, initials, avatarUrl }),
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400' } },
  );
}

function buildHtml(opts: { name: string; role: string; company: string; accent: string; bg: string; text: string; textSec: string; initials: string; avatarUrl?: string }) {
  const avatar = opts.avatarUrl
    ? `<img src="${opts.avatarUrl}" width="160" height="160" style="border-radius:80px;border:4px solid ${opts.accent};object-fit:cover;" />`
    : `<div style="width:160px;height:160px;border-radius:80px;background:${opts.accent};display:flex;align-items:center;justify-content:center;"><span style="font-size:56px;font-weight:700;color:${opts.bg};">${opts.initials}</span></div>`;

  return `<!DOCTYPE html><html><body><div style="width:1200px;height:630px;background:${opts.bg};display:flex;flex-direction:column;padding:60px;position:relative;font-family:system-ui,sans-serif;overflow:hidden;">
<div style="position:absolute;top:0;left:0;right:0;height:6px;background:${opts.accent};"></div>
<div style="display:flex;align-items:center;gap:40px;flex:1;">
${avatar}
<div style="display:flex;flex-direction:column;gap:12px;">
<div style="font-size:64px;font-weight:700;color:${opts.text};line-height:1.1;">${opts.name}</div>
${opts.role ? `<div style="font-size:28px;color:${opts.textSec};font-weight:500;">${opts.role}</div>` : ''}
${opts.company ? `<div style="font-size:24px;color:${opts.textSec};">${opts.company}</div>` : ''}
</div>
</div>
<div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;">
<span style="font-size:20px;color:${opts.textSec};">NEXAS</span>
<span style="font-size:16px;color:${opts.textSec};">sbcards.vercel.app</span>
</div></div></body></html>`;
}

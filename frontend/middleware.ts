const CRAWLERS = [
  'facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'WhatsApp',
  'slackbot', 'TelegramBot', 'Discordbot', 'Pinterest', 'Embedly',
  'vkShare', 'redditbot', 'Applebot', 'Googlebot',
];

function isCrawler(ua: string | null): boolean {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return CRAWLERS.some((c) => lower.includes(c.toLowerCase()));
}

export const config = {
  matcher: '/card/:path*',
};

export default async function middleware(request: Request) {
  const { pathname } = new URL(request.url);
  const ua = request.headers.get('User-Agent');

  if (!isCrawler(ua)) {
    // Non-crawlers: let the SPA handle it
    return new Response(null, { status: 302, headers: { Location: pathname } });
  }

  const id = pathname.split('/card/')[1]?.split('/')[0]?.split('?')[0];
  if (!id) {
    return new Response(null, { status: 302, headers: { Location: '/' } });
  }

  let card: any = null;
  try {
    const res = await fetch(`https://sbcards.onrender.com/cards/public/${id}`);
    if (res.ok) card = await res.json();
  } catch {
    // fallback to generic
  }

  const name = card?.fullName || 'NEXAS User';
  const role = card?.role || card?.headline || '';
  const company = card?.company || '';
  const desc = role && company ? `${role} at ${company} — View their digital business card on NEXAS` : 'Digital business card on NEXAS';
  const ogImg = `https://sbcards.vercel.app/api/og/${id}`;
  const pageUrl = `https://sbcards.vercel.app/card/${id}`;

  const html = `<!DOCTYPE html><html><head>
<meta charset="utf-8"><title>${name} | NEXAS</title>
<meta property="og:title" content="${name} | NEXAS" />
<meta property="og:description" content="${desc}" />
<meta property="og:image" content="${ogImg}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${pageUrl}" />
<meta property="og:type" content="profile" />
<meta property="og:site_name" content="NEXAS" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${name} | NEXAS" />
<meta name="twitter:description" content="${desc}" />
<meta name="twitter:image" content="${ogImg}" />
<meta http-equiv="refresh" content="0;url=${pageUrl}" />
</head><body><p>Redirecting to <a href="${pageUrl}">${name}'s SBCard</a>...</p></body></html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

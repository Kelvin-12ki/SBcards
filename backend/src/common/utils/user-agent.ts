export interface ParsedUserAgent {
  os?: string;
  browser?: string;
  platform?: 'desktop' | 'mobile' | 'tablet';
}

/**
 * Coarse User-Agent classification for the security dashboard.
 *
 * Deliberately only four buckets per axis — enough to answer "did this login
 * come from a new OS/browser", which is the only question the dashboard asks.
 * Order matters: Edge/Opera/Chrome all also ship a `Safari/` token, so the
 * more specific browsers have to be tested first.
 */
export function parseUserAgent(userAgent?: string): ParsedUserAgent {
  if (!userAgent) return {};
  const ua = userAgent.toLowerCase();

  let os: string | undefined;
  if (/windows/.test(ua)) os = 'Windows';
  else if (/android/.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod|\bios\b/.test(ua)) os = 'iOS';
  else if (/mac os x|macintosh/.test(ua)) os = 'macOS';
  else if (/\bcros\b/.test(ua)) os = 'ChromeOS';
  else if (/linux/.test(ua)) os = 'Linux';

  let browser: string | undefined;
  if (/\bedg[\/e]/.test(ua)) browser = 'Edge';
  else if (/opr\/|opera/.test(ua)) browser = 'Opera';
  else if (/samsungbrowser/.test(ua)) browser = 'Samsung Internet';
  else if (/firefox\/|fxios/.test(ua)) browser = 'Firefox';
  else if (/chrome\/|crios\/|chromium\//.test(ua)) browser = 'Chrome';
  else if (/safari\//.test(ua)) browser = 'Safari';
  else if (/curl\/|wget\/|postman|okhttp|python-requests|node(?:\.js)?\//.test(ua))
    browser = 'Script';

  let platform: ParsedUserAgent['platform'];
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(ua)) platform = 'tablet';
  else if (/mobile|android|iphone|ipod/.test(ua)) platform = 'mobile';
  else if (os) platform = 'desktop';

  return { os, browser, platform };
}

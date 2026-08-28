/**
 * Where the marketing site hands off to the actual NEXAS web app.
 *
 * The app is a separate Vite project (`SBcards/frontend`) that runs on port 3007
 * in development. Override for other environments with a `VITE_APP_URL` entry in
 * `.env.local` — e.g. `VITE_APP_URL=https://app.nexas.app`.
 */
const DEFAULT_APP_URL = 'http://localhost:3007';

export const APP_URL: string = (
import.meta.env?.VITE_APP_URL as string | undefined ??
DEFAULT_APP_URL).
replace(/\/$/, '');

/** Build an absolute URL into the app. */
export function appUrl(path: string): string {
  return `${APP_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Real routes, taken from the app's router. Keeping them in one place means a
 * route rename is a single edit here rather than a hunt through the sections.
 */
export const appRoutes = {
  register: appUrl('/register'),
  login: appUrl('/login'),
  dashboard: appUrl('/dashboard'),
  createCard: appUrl('/cards/new'),
  myCards: appUrl('/my-cards'),
  wallet: appUrl('/wallet'),
  scan: appUrl('/scan'),
  qr: appUrl('/qr'),
  connections: appUrl('/connections'),
  events: appUrl('/events'),
  profileSetup: appUrl('/profile/setup')
};

/**
 * Attributes for any link that leaves the marketing site for the app. Opens in a
 * new tab so a half-read landing page isn't lost.
 */
export const appLinkProps = {
  target: '_blank',
  rel: 'noopener noreferrer'
} as const;

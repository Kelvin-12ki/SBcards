import React, { useEffect, useState } from 'react';
import { Landing } from './pages/Landing';
import { LegalPage, type LegalDoc } from './pages/LegalPage';
import { ThemeProvider } from './theme/ThemeProvider';

interface AppProps {
  /** Hero composition: card visual beside the copy, or a single centered column. */
  heroLayout?: 'split' | 'centered';
  /** Include the pricing section on the page. */
  showPricing?: boolean;
}

type Route = LegalDoc | 'home';

/** Resolve the route from the hash. Returns `'STAY'` for in-page anchor jumps. */
function routeFromHash(hash: string): Route | 'STAY' {
  const raw = hash.replace(/^#/, '');
  // Only treat hashes under `/` as routes (`#/privacy`, `#/terms`, `#/`).
  if (raw.startsWith('/')) {
    const path = raw.slice(1).toLowerCase();
    if (path === 'privacy') return 'privacy';
    if (path === 'terms') return 'terms';
    return 'home'; // e.g. `#/` or an unknown route -> landing
  }
  return 'STAY'; // in-page anchor (e.g. `#terms-1`): keep current view
}

export function App({ heroLayout = 'split', showPricing = true }: AppProps) {
  const [route, setRoute] = useState<Route>(() => {
    const initial = routeFromHash(window.location.hash);
    return initial === 'STAY' ? 'home' : initial;
  });
  const doc = route === 'privacy' || route === 'terms' ? route : null;

  useEffect(() => {
    const onHashChange = () => {
      const next = routeFromHash(window.location.hash);
      // Ignore in-page anchors; only re-render when the route actually changed.
      if (next !== 'STAY') setRoute(next);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Scroll to the top whenever a legal page is opened (or we return to the landing).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [doc]);

  return (
    <ThemeProvider>
      {doc ? (
        <LegalPage doc={doc} />
      ) : (
        <Landing heroLayout={heroLayout} showPricing={showPricing} />
      )}
    </ThemeProvider>);

}
/**
 * Media Query Hook
 *
 * React hook for responsive design that listens to media query changes.
 */

import { useState, useEffect } from 'react';

/**
 * Hook that returns true if the media query matches
 * @param query - CSS media query string
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // SSR safety check
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);

    // Set initial match
    setMatches(mediaQuery.matches);

    // Listener callback
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Attach listener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup listener
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

import { useState, useEffect } from 'react';

// Breakpoints (mobile-first)
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440
};

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

export function useResponsive() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setWidth(w);

      if (w < breakpoints.tablet) {
        setBreakpoint('mobile');
      } else if (w < breakpoints.desktop) {
        setBreakpoint('tablet');
      } else if (w < breakpoints.wide) {
        setBreakpoint('desktop');
      } else {
        setBreakpoint('wide');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    breakpoint,
    width,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop' || breakpoint === 'wide',
    isWide: breakpoint === 'wide'
  };
}

// Responsive value helper
export function responsive<T>(values: { mobile: T; tablet?: T; desktop?: T; wide?: T }, breakpoint: Breakpoint): T {
  if (breakpoint === 'wide' && values.wide) return values.wide;
  if (breakpoint === 'desktop' && values.desktop) return values.desktop;
  if (breakpoint === 'tablet' && values.tablet) return values.tablet;
  if (breakpoint === 'desktop' && values.tablet) return values.tablet;
  if (breakpoint === 'wide' && values.tablet) return values.tablet;
  return values.mobile;
}

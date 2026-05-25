import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useResponsive() {
  const { width } = useWindowDimensions();

  const breakpoint: Breakpoint =
    width >= 1024 ? 'desktop' : width >= 640 ? 'tablet' : 'mobile';

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isDesktop = breakpoint === 'desktop';
  const isWeb = width >= 640;

  /** Largeur max du contenu centré */
  const contentMaxWidth = isDesktop ? 480 : isTablet ? 440 : undefined;

  /** Padding horizontal selon la taille */
  const hPad = isDesktop ? 0 : isTablet ? 32 : 20;

  return { width, breakpoint, isMobile, isTablet, isDesktop, isWeb, contentMaxWidth, hPad };
}

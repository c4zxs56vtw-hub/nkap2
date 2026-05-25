import type { Href } from 'expo-router';

type RouterLike = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: Href) => void;
};

/** Évite l'erreur GO_BACK sur le web quand la pile de navigation est vide. */
export function safeGoBack(router: RouterLike, fallback: Href = '/dashboard') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}

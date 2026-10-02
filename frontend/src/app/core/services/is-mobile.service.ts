import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class IsMobileService {
  private mediaQuery?: MediaQueryList;
  readonly isMobile = signal<boolean>(false);

  constructor() {
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      this.mediaQuery = window.matchMedia('(max-width: 767.98px)');
      this.isMobile.set(this.mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => {
        this.isMobile.set(e.matches);
      };

      if (this.mediaQuery.addEventListener) {
        this.mediaQuery.addEventListener('change', listener);
      } else {
        // Fallback for older browsers
        (this.mediaQuery as any).addListener(listener);
      }
    }
  }
}

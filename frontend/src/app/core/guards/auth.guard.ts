import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Fast path: user already in memory (e.g., after login or if already initialized)
  if (authService.getCurrentUser()) return true;

  const loginRoute = state.url.startsWith('/admin') ? '/admin/login' : '/auth/login';

  // No token at all — not authenticated
  if (!authService.hasToken()) {
    router.navigate([loginRoute], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Token exists but user not yet loaded (page refresh) — wait for /auth/me to complete
  return authService.waitForInit().pipe(
    map(() => {
      if (authService.getCurrentUser()) return true;
      // /auth/me failed (bad/expired token)
      router.navigate([loginRoute], { queryParams: { returnUrl: state.url } });
      return false;
    })
  );
};

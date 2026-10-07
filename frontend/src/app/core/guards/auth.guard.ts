import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.waitForInit().pipe(
    map(() => {
      const user = authService.getCurrentUser();
      const hasToken = authService.hasToken();

      if (user) return true;

      const loginRoute = state.url.startsWith('/admin') ? '/admin/login' : '/auth/login';

      if (!hasToken) {
        router.navigate([loginRoute], { queryParams: { returnUrl: state.url } });
        return false;
      }

      return true;
    })
  );
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../../shared/models/user.model';
import { map } from 'rxjs/operators';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.waitForInit().pipe(
      map(() => {
        const fetchedUser = authService.getCurrentUser();
        const hasToken = authService.hasToken();

        if (fetchedUser) {
          if (allowedRoles.includes(fetchedUser.role)) {
            return true;
          }
          router.navigate(['/role-selection']);
          return false;
        }

        const loginRoute = state.url.startsWith('/admin') ? '/admin/login' : '/auth/login';

        if (!hasToken) {
          router.navigate([loginRoute]);
          return false;
        }

        if (state.url.startsWith('/admin')) {
          router.navigate(['/admin/login']);
        } else {
          router.navigate(['/role-selection']);
        }
        return false;
      })
    );
  };
};

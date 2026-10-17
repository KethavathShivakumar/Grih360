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
          // User is authenticated under a different role - navigate them to their legitimate workspace
          const targetDashboard =
            fetchedUser.role === 'OWNER'
              ? '/owner/dashboard'
              : fetchedUser.role === 'PROFESSIONAL'
              ? '/professional/dashboard'
              : fetchedUser.role === 'ADMIN'
              ? '/admin/dashboard'
              : '/tenant/dashboard';
          router.navigate([targetDashboard], { replaceUrl: true });
          return false;
        }

        const loginRoute = state.url.startsWith('/admin') ? '/admin/login' : '/auth/login';

        // Unauthenticated user - strictly navigate to Login screen
        router.navigate([loginRoute], { replaceUrl: true });
        return false;
      })
    );
  };
};

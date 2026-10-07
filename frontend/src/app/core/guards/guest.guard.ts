import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';
import { UserRole } from '../../shared/models/user.model';

export const getDashboardForRole = (role?: UserRole): string => {
  switch (role) {
    case 'OWNER':
      return '/owner/dashboard';
    case 'PROFESSIONAL':
      return '/professional/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    case 'TENANT':
    default:
      return '/tenant/dashboard';
  }
};

/**
  Guest Guard: Prevents authenticated users from seeing public/auth routes
  (e.g., /, /role-selection, /auth/login, /auth/register).
  If a user session exists, redirects immediately to their role's dashboard.
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.waitForInit().pipe(
    map(() => {
      const user = authService.getCurrentUser();
      if (user) {
        const dashboard = getDashboardForRole(user.role);
        router.navigate([dashboard]);
        return false;
      }
      return true;
    })
  );
};

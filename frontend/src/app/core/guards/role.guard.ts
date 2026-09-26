import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../../shared/models/user.model';
import { map } from 'rxjs/operators';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Fast path: user already in memory
    const user = authService.getCurrentUser();
    if (user) {
      if (allowedRoles.includes(user.role)) return true;
      router.navigate(['/role-selection']);
      return false;
    }

    const loginRoute = state.url.startsWith('/admin') ? '/admin/login' : '/auth/login';

    // No token — unauthenticated
    if (!authService.hasToken()) {
      router.navigate([loginRoute]);
      return false;
    }

    // Token exists but user not yet loaded (page refresh) — wait for /auth/me
    return authService.waitForInit().pipe(
      map(() => {
        const fetchedUser = authService.getCurrentUser();
        if (fetchedUser && allowedRoles.includes(fetchedUser.role)) return true;
        // User not authenticated or wrong role
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

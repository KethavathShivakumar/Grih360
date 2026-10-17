import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError, EMPTY } from 'rxjs';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  const authService = inject(AuthService);
  const token = storageService.getToken();

  // Skip Content-Type for FormData (file uploads)
  const isFormData = req.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const authReq = req.clone({ setHeaders: headers });

  return next(authReq).pipe(
    catchError((err: any) => {
      // 1. If user is intentionally logging out, suppress all pending errors cleanly
      if (authService.isExplicitlyLoggingOut) {
        return EMPTY;
      }

      // 2. Intercept 401 Unauthorized for silent token refresh
      if (err instanceof HttpErrorResponse && err.status === 401) {
        const isAuthEndpoint =
          req.url.includes('/auth/login') ||
          req.url.includes('/auth/refresh') ||
          req.url.includes('/auth/logout');

        // Do not attempt refresh on auth endpoints themselves
        if (!isAuthEndpoint && storageService.getRefreshToken()) {
          return authService.refreshSession().pipe(
            switchMap((refreshed) => {
              if (refreshed) {
                const newToken = storageService.getToken();
                const retriedHeaders = { ...headers };
                if (newToken) {
                  retriedHeaders['Authorization'] = `Bearer ${newToken}`;
                }
                const retriedReq = req.clone({ setHeaders: retriedHeaders });
                return next(retriedReq);
              }
              // If refresh explicitly failed, propagate error
              return throwError(() => err);
            }),
            catchError((refreshErr) => throwError(() => refreshErr))
          );
        }
      }

      return throwError(() => err);
    })
  );
};

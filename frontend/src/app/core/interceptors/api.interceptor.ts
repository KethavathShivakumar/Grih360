import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, isDevMode } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { isRawOrTechnicalError, GENERIC_ERROR_MESSAGE } from '../utils/error-sanitizer.util';
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
          req.url.includes('/auth/verify-login-otp') ||
          req.url.includes('/auth/resend-login-otp') ||
          req.url.includes('/auth/google') ||
          req.url.includes('/auth/otp/send') ||
          req.url.includes('/auth/otp/verify') ||
          req.url.includes('/auth/register') ||
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

      // 3. Log technical error details ONLY in development mode
      if (isDevMode()) {
        console.error('[API Error Details]', {
          method: req.method,
          url: req.urlWithParams,
          status: err?.status,
          statusText: err?.statusText,
          error: err?.error,
        });
      }

      // 4. Sanitize raw technical errors (e.g., 404 "Resource not found: /api/...", 5xx, HTML traces)
      if (isRawOrTechnicalError(err)) {
        let sanitizedBody: any = {
          success: false,
          message: GENERIC_ERROR_MESSAGE,
        };
        if (err?.error && typeof err.error === 'object') {
          sanitizedBody = {
            ...err.error,
            success: false,
            message: GENERIC_ERROR_MESSAGE,
          };
        }
        const sanitizedErr = new HttpErrorResponse({
          error: sanitizedBody,
          headers: err?.headers,
          status: err?.status || 500,
          statusText: err?.statusText || 'Error',
          url: err?.url || req.url,
        });
        return throwError(() => sanitizedErr);
      }

      return throwError(() => err);
    })
  );
};

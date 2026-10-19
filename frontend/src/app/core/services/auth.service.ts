import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, of, filter, take, switchMap, from, map } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { User, UserRole } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  // Tracks whether the initial auth check (from stored token) has completed
  private initializationSubject = new BehaviorSubject<boolean>(false);
  public isInitialized$: Observable<boolean> = this.initializationSubject.asObservable();

  private isRefreshing = false;
  private isLoggingOut = false;
  private sessionInitPromise: Promise<void> | null = null;

  constructor(
    private apiService: ApiService,
    private storageService: StorageService,
    private router: Router
  ) {}

  public get isExplicitlyLoggingOut(): boolean {
    return this.isLoggingOut;
  }

  public initSessionPromise(): Promise<void> {
    if (!this.sessionInitPromise) {
      const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          console.warn('[Auth Service] initSession timed out after 5000ms; completing session initialization');
          this.initializationSubject.next(true);
          resolve();
        }, 5000);
      });

      this.sessionInitPromise = Promise.race([this.initSession(), timeoutPromise]);
    }
    return this.sessionInitPromise;
  }

  private async initSession(): Promise<void> {
    try {
      await this.storageService.initNativeStorage();
      const token = this.storageService.getToken();
      const cachedUser = this.storageService.getUser();

      // OPTIMISTIC RESTORE: If token AND stored user exist in Preferences/Storage,
      // restore state immediately without blocking UI on network call
      if (token && cachedUser) {
        this.currentUserSubject.next(cachedUser);
        this.initializationSubject.next(true);

        // Validate session asynchronously in background
        this.validateSessionInBackground();
      } else if (token) {
        // Token exists but no cached user details: fetch user synchronously before ready
        await this.fetchCurrentUserPromise();
      } else {
        this.initializationSubject.next(true);
      }
    } catch (err) {
      console.error('[Auth Service] initSession error:', err);
    } finally {
      this.initializationSubject.next(true);
    }
  }

  private validateSessionInBackground(): void {
    this.apiService.get<{ success: boolean; data: { user: User } }>('/auth/me').pipe(
      catchError((err: any) => {
        if (err?.status === 401) {
          return this.refreshSession().pipe(
            switchMap((refreshSuccess) => {
              if (refreshSuccess) {
                return this.apiService.get<{ success: boolean; data: { user: User } }>('/auth/me').pipe(
                  catchError(() => of(null))
                );
              }
              return of(null);
            })
          );
        }
        // Network error (status 0), timeout, or 5xx: DO NOT logout. Keep optimistic user session!
        return of(null);
      })
    ).subscribe((res) => {
      if (res && res.success && res.data?.user) {
        this.currentUserSubject.next(res.data.user);
        this.storageService.setUser(res.data.user);
      }
    });
  }

  private fetchCurrentUserPromise(): Promise<void> {
    return new Promise((resolve) => {
      this.apiService.get<{ success: boolean; data: { user: User } }>('/auth/me').pipe(
        catchError((err: any) => {
          if (err?.status === 401) {
            return this.refreshSession().pipe(
              switchMap((refreshSuccess) => {
                if (refreshSuccess) {
                  return this.apiService.get<{ success: boolean; data: { user: User } }>('/auth/me').pipe(
                    catchError(() => of(null))
                  );
                }
                return of(null);
              })
            );
          }
          return of(null);
        })
      ).subscribe((res) => {
        if (res && res.success && res.data?.user) {
          this.currentUserSubject.next(res.data.user);
          this.storageService.setUser(res.data.user);
        } else if (!this.currentUserSubject.value) {
          const cachedUser = this.storageService.getUser();
          if (cachedUser) {
            this.currentUserSubject.next(cachedUser);
          }
        }
        this.initializationSubject.next(true);
        resolve();
      });
    });
  }

  public fetchCurrentUser(): void {
    this.fetchCurrentUserPromise();
  }

  public updateCurrentUser(partial: Partial<User>): void {
    const current = this.currentUserSubject.value;
    if (current) {
      const updated = { ...current, ...partial };
      this.currentUserSubject.next(updated);
      this.storageService.setUser(updated);
    }
  }

  /**
   * Attempt to refresh expired access token using stored refresh token.
   * Clears session ONLY if the refresh endpoint explicitly rejects (401/403).
   */
  public refreshSession(): Observable<boolean> {
    const refreshToken = this.storageService.getRefreshToken();
    if (!refreshToken || this.isRefreshing) {
      return of(false);
    }

    this.isRefreshing = true;
    return this.apiService.post<any>('/auth/refresh', { refreshToken }).pipe(
      switchMap((res) => {
        if (res?.success && res?.data?.tokens?.accessToken) {
          const tokenPromises: Promise<any>[] = [
            this.storageService.setToken(res.data.tokens.accessToken)
          ];
          if (res.data.tokens.refreshToken) {
            tokenPromises.push(this.storageService.setRefreshToken(res.data.tokens.refreshToken));
          }
          if (res.data.user) {
            tokenPromises.push(this.storageService.setUser(res.data.user));
            this.currentUserSubject.next(res.data.user);
          }
          return from(Promise.all(tokenPromises)).pipe(map(() => true));
        }
        return of(false);
      }),
      catchError((err: any) => {
        if (err?.status === 401 || err?.status === 403) {
          this.storageService.clearSession();
          this.currentUserSubject.next(null);
        }
        return of(false);
      }),
      tap(() => {
        this.isRefreshing = false;
      })
    );
  }

  private async saveTokensAndUser(tokens: { accessToken: string; refreshToken?: string }, user?: User): Promise<void> {
    if (tokens?.accessToken) {
      await this.storageService.setToken(tokens.accessToken);
    }
    if (tokens?.refreshToken) {
      await this.storageService.setRefreshToken(tokens.refreshToken);
    }
    if (user) {
      await this.storageService.setUser(user);
      this.currentUserSubject.next(user);
    }
    this.initializationSubject.next(true);
  }

  public register(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
  }): Observable<any> {
    return this.apiService.post<any>('/auth/register', userData).pipe(
      switchMap(async (res) => {
        if (res.success && res.data?.tokens?.accessToken && !res.requiresEmailOtp) {
          await this.saveTokensAndUser(res.data.tokens, res.data.user);
        }
        return res;
      })
    );
  }

  public login(identifier: string, password: string, role?: string): Observable<any> {
    return this.apiService.post<any>('/auth/login', { identifier, password, role }).pipe(
      switchMap(async (res) => {
        if (res.success && res.data?.tokens?.accessToken) {
          await this.saveTokensAndUser(res.data.tokens, res.data.user);
        }
        return res;
      })
    );
  }

  public loginWithGoogle(idToken: string, role?: string, phone?: string): Observable<any> {
    return this.apiService.post<any>('/auth/google', { idToken, role, phone }).pipe(
      switchMap(async (res) => {
        if (res.success && res.data?.tokens?.accessToken) {
          await this.saveTokensAndUser(res.data.tokens, res.data.user);
        }
        return res;
      })
    );
  }

  public adminLogin(identifier: string, password: string): Observable<any> {
    return this.apiService.post<any>('/auth/login', { identifier, password, directToken: true }).pipe(
      switchMap(async (res) => {
        if (res.success && res.data?.tokens?.accessToken) {
          await this.saveTokensAndUser(res.data.tokens, res.data.user);
        }
        return res;
      })
    );
  }

  public sendForgotPasswordOtp(email: string): Observable<any> {
    return this.apiService.post<any>('/auth/forgot-password/send-otp', { email });
  }

  public resetPasswordWithOtp(email: string, otp: string, newPassword: string): Observable<any> {
    return this.apiService.post<any>('/auth/forgot-password/reset', { email, otp, newPassword });
  }

  public async logout(): Promise<void> {
    this.isLoggingOut = true;
    console.log('[Auth Debug] Explicit logout triggered by user');
    const refreshToken = this.storageService.getRefreshToken();
    try {
      this.apiService.post('/auth/logout', { refreshToken }).subscribe({
        error: () => {},
      });
    } catch (_) {}

    await this.storageService.clearSession();
    this.currentUserSubject.next(null);
    this.clearActiveChallenge();
    this.initializationSubject.next(true);
    this.sessionInitPromise = Promise.resolve();

    try {
      this.router.navigate(['/auth/login'], { replaceUrl: true });
    } catch (_) {}

    setTimeout(() => {
      this.isLoggingOut = false;
    }, 1500);
  }

  public getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  public currentUserSignal(): User | null {
    return this.getCurrentUser();
  }

  public hasRole(requiredRoles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return requiredRoles.includes(user.role);
  }

  public hasToken(): boolean {
    return !!this.storageService.getToken();
  }

  public sendOtp(identifier: string): Observable<any> {
    return this.apiService.post<any>('/auth/otp/send', { identifier });
  }

  public verifyOtp(identifier: string, otp: string): Observable<any> {
    return this.apiService.post<any>('/auth/otp/verify', { identifier, otp }).pipe(
      switchMap(async (res) => {
        if (res.success && res.data?.tokens?.accessToken) {
          await this.saveTokensAndUser(res.data.tokens, res.data.user);
        }
        return res;
      })
    );
  }

  private activeChallenge: {
    challengeId: string;
    maskedEmail: string;
    selectedRole?: string;
  } | null = null;

  public setActiveChallenge(challenge: {
    challengeId: string;
    maskedEmail: string;
    selectedRole?: string;
  } | null): void {
    this.activeChallenge = challenge;
    try {
      if (challenge) {
        sessionStorage.setItem('grih360_active_challenge', JSON.stringify(challenge));
      } else {
        sessionStorage.removeItem('grih360_active_challenge');
      }
    } catch (e) {}
  }

  public getActiveChallenge(): {
    challengeId: string;
    maskedEmail: string;
    selectedRole?: string;
  } | null {
    if (!this.activeChallenge) {
      try {
        const raw = sessionStorage.getItem('grih360_active_challenge');
        if (raw) {
          this.activeChallenge = JSON.parse(raw);
        }
      } catch (e) {}
    }
    return this.activeChallenge;
  }

  public clearActiveChallenge(): void {
    this.activeChallenge = null;
    try {
      sessionStorage.removeItem('grih360_active_challenge');
    } catch (e) {}
  }

  public verifyLoginOtp(challengeId: string, otp: string): Observable<any> {
    return this.apiService.post<any>('/auth/verify-login-otp', { challengeId, otp }).pipe(
      switchMap(async (res) => {
        if (res.success && res.data?.tokens?.accessToken) {
          await this.saveTokensAndUser(res.data.tokens, res.data.user);
          this.clearActiveChallenge();
        }
        return res;
      })
    );
  }

  public resendLoginOtp(challengeId: string): Observable<any> {
    return this.apiService.post<any>('/auth/resend-login-otp', { challengeId });
  }

  public requestLoginOtp(identifier: string): Observable<any> {
    return this.apiService.post<any>('/auth/login-otp/send', { identifier });
  }

  public verifyLoginOtpDirect(identifier: string, otp: string, role?: string): Observable<any> {
    return this.apiService.post<any>('/auth/login-otp/verify', { identifier, otp, role }).pipe(
      switchMap(async (res) => {
        if (res.success && res.data?.tokens?.accessToken) {
          await this.saveTokensAndUser(res.data.tokens, res.data.user);
        }
        return res;
      })
    );
  }

  public requestRegistrationOtp(userData: {
    email: string;
    name?: string;
    phone?: string;
    role?: string;
  }): Observable<any> {
    return this.apiService.post<any>('/auth/register/send-otp', userData);
  }

  public verifyRegistrationOtpAndCreate(data: {
    email: string;
    otp: string;
    password: string;
    confirmPassword: string;
    name: string;
    phone: string;
    role: string;
  }): Observable<any> {
    return this.apiService.post<any>('/auth/register/verify-and-create', data).pipe(
      switchMap(async (res) => {
        if (res.success && res.data?.tokens?.accessToken) {
          await this.saveTokensAndUser(res.data.tokens, res.data.user);
        }
        return res;
      })
    );
  }

  public setGoogleInitialPassword(data: {
    onboardingToken: string;
    otp: string;
    password: string;
    confirmPassword: string;
  }): Observable<any> {
    return this.apiService.post<any>('/auth/google/set-initial-password', data).pipe(
      switchMap(async (res) => {
        if (res.success && res.data?.tokens?.accessToken) {
          await this.saveTokensAndUser(res.data.tokens, res.data.user);
        }
        return res;
      })
    );
  }

  public resendGoogleOnboardingOtp(onboardingToken: string): Observable<any> {
    return this.apiService.post<any>('/auth/google/resend-otp', { onboardingToken });
  }

  public waitForInit(): Observable<boolean> {
    return this.isInitialized$.pipe(
      filter((init) => init === true),
      take(1)
    );
  }
}

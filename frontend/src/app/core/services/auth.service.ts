import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of, filter, take, switchMap } from 'rxjs';
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

  constructor(
    private apiService: ApiService,
    private storageService: StorageService
  ) {
    this.initSession();
  }

  private async initSession(): Promise<void> {
    await this.storageService.initNativeStorage();
    const token = this.storageService.getToken();
    if (token) {
      this.fetchCurrentUser();
    } else {
      this.initializationSubject.next(true);
    }
  }

  public fetchCurrentUser(): void {
    this.apiService.get<{ success: boolean; data: { user: User } }>('/auth/me').pipe(
      catchError((err: any) => {
        // Status 401: Access token expired. Attempt token refresh before deciding session fate.
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
        // For network errors (status 0), timeouts, or 5xx: DO NOT clear session or logout.
        return of(null);
      })
    ).subscribe((res) => {
      if (res && res.success && res.data?.user) {
        this.currentUserSubject.next(res.data.user);
      }
      this.initializationSubject.next(true);
    });
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
      tap((res) => {
        if (res?.success && res?.data?.tokens?.accessToken) {
          this.storageService.setToken(res.data.tokens.accessToken);
          if (res.data.tokens.refreshToken) {
            this.storageService.setRefreshToken(res.data.tokens.refreshToken);
          }
          if (res.data.user) {
            this.currentUserSubject.next(res.data.user);
          }
        }
      }),
      switchMap((res) => of(!!(res?.success && res?.data?.tokens?.accessToken))),
      catchError((err: any) => {
        // Clear session ONLY when refresh token is explicitly rejected (401 or 403)
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

  private saveTokensAndUser(tokens: { accessToken: string; refreshToken?: string }, user?: User): void {
    if (tokens?.accessToken) {
      this.storageService.setToken(tokens.accessToken);
    }
    if (tokens?.refreshToken) {
      this.storageService.setRefreshToken(tokens.refreshToken);
    }
    if (user) {
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
      tap((res) => {
        if (res.success && res.data?.tokens?.accessToken && !res.requiresEmailOtp) {
          this.saveTokensAndUser(res.data.tokens, res.data.user);
        }
      })
    );
  }

  public login(identifier: string, password: string): Observable<any> {
    return this.apiService.post<any>('/auth/login', { identifier, password }).pipe(
      tap((res) => {
        if (res.success && res.data?.tokens?.accessToken) {
          this.saveTokensAndUser(res.data.tokens, res.data.user);
        }
      })
    );
  }

  public adminLogin(identifier: string, password: string): Observable<any> {
    return this.apiService.post<any>('/auth/login', { identifier, password, directToken: true }).pipe(
      tap((res) => {
        if (res.success && res.data?.tokens?.accessToken) {
          this.saveTokensAndUser(res.data.tokens, res.data.user);
        }
      })
    );
  }

  public logout(): void {
    this.apiService.post('/auth/logout', {}).subscribe({
      error: () => {},
    });
    this.storageService.clearSession();
    this.currentUserSubject.next(null);
    this.initializationSubject.next(false);
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
      tap((res) => {
        if (res.success && res.data?.tokens?.accessToken) {
          this.saveTokensAndUser(res.data.tokens, res.data.user);
        }
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
  }

  public getActiveChallenge(): {
    challengeId: string;
    maskedEmail: string;
    selectedRole?: string;
  } | null {
    return this.activeChallenge;
  }

  public clearActiveChallenge(): void {
    this.activeChallenge = null;
  }

  public verifyLoginOtp(challengeId: string, otp: string): Observable<any> {
    return this.apiService.post<any>('/auth/verify-login-otp', { challengeId, otp }).pipe(
      tap((res) => {
        if (res.success && res.data?.tokens?.accessToken) {
          this.saveTokensAndUser(res.data.tokens, res.data.user);
          this.clearActiveChallenge();
        }
      })
    );
  }

  public resendLoginOtp(challengeId: string): Observable<any> {
    return this.apiService.post<any>('/auth/resend-login-otp', { challengeId });
  }

  public waitForInit(): Observable<boolean> {
    return this.isInitialized$.pipe(
      filter(init => init === true),
      take(1)
    );
  }
}

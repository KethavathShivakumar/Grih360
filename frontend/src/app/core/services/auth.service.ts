import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of, filter, take } from 'rxjs';
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

  constructor(
    private apiService: ApiService,
    private storageService: StorageService
  ) {
    const token = this.storageService.getToken();
    if (token) {
      this.fetchCurrentUser();
    } else {
      // No token — immediately mark as initialized (nothing to fetch)
      this.initializationSubject.next(true);
    }
  }

  public fetchCurrentUser(): void {
    this.apiService.get<{ success: boolean; data: { user: User } }>('/auth/me').pipe(
      catchError(() => {
        this.storageService.clearSession();
        this.currentUserSubject.next(null);
        return of(null);
      })
    ).subscribe((res) => {
      if (res && res.success && res.data?.user) {
        this.currentUserSubject.next(res.data.user);
      }
      // Mark initialization complete after fetch attempt (success or failure)
      this.initializationSubject.next(true);
    });
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
        if (res.success && res.data?.tokens?.accessToken) {
          this.storageService.setToken(res.data.tokens.accessToken);
          this.currentUserSubject.next(res.data.user);
          this.initializationSubject.next(true);
        }
      })
    );
  }

  public login(identifier: string, password: string): Observable<any> {
    return this.apiService.post<any>('/auth/login', { identifier, password }).pipe(
      tap((res) => {
        if (res.success && res.data?.tokens?.accessToken) {
          this.storageService.setToken(res.data.tokens.accessToken);
          this.currentUserSubject.next(res.data.user);
          this.initializationSubject.next(true);
        }
      })
    );
  }

  public logout(): void {
    this.apiService.post('/auth/logout', {}).subscribe();
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

  /** True if a valid JWT token exists in storage (user may still be loading) */
  public hasToken(): boolean {
    return !!this.storageService.getToken();
  }

  /** Send OTP to registered email or mobile number */
  public sendOtp(identifier: string): Observable<any> {
    return this.apiService.post<any>('/auth/otp/send', { identifier });
  }

  /** Verify OTP and log in */
  public verifyOtp(identifier: string, otp: string): Observable<any> {
    return this.apiService.post<any>('/auth/otp/verify', { identifier, otp }).pipe(
      tap((res) => {
        if (res.success && res.data?.tokens?.accessToken) {
          this.storageService.setToken(res.data.tokens.accessToken);
          this.currentUserSubject.next(res.data.user);
          this.initializationSubject.next(true);
        }
      })
    );
  }

  /** Active challenge state kept in memory (strictly never in localStorage or sessionStorage) */
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

  /** Step B: Verify Login OTP and establish authenticated session */
  public verifyLoginOtp(challengeId: string, otp: string): Observable<any> {
    return this.apiService.post<any>('/auth/verify-login-otp', { challengeId, otp }).pipe(
      tap((res) => {
        if (res.success && res.data?.tokens?.accessToken) {
          this.storageService.setToken(res.data.tokens.accessToken);
          this.currentUserSubject.next(res.data.user);
          this.initializationSubject.next(true);
          this.clearActiveChallenge();
        }
      })
    );
  }

  /** Step C: Resend Login OTP enforcing 60s cooldown */
  public resendLoginOtp(challengeId: string): Observable<any> {
    return this.apiService.post<any>('/auth/resend-login-otp', { challengeId });
  }

  /** Wait for the initialization (initial /auth/me fetch) to complete */
  public waitForInit(): Observable<boolean> {
    return this.isInitialized$.pipe(
      filter(init => init === true),
      take(1)
    );
  }
}

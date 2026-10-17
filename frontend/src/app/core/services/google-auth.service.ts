import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject, from } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

declare const google: any;

export interface GoogleProfileRequirement {
  idToken: string;
  email: string;
  name: string;
  profileImage?: string;
  suggestedRole: string;
}

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private scriptLoaded = false;
  private scriptLoadingPromise: Promise<void> | null = null;

  public profileRequired$ = new Subject<GoogleProfileRequirement>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  public isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  public getClientId(): string {
    return (environment as any).googleClientId || '';
  }

  public isAvailable(): boolean {
    return Boolean(this.getClientId());
  }

  /**
   * Loads Google Identity Services client script dynamically
   */
  public loadGsiScript(): Promise<void> {
    if (this.scriptLoaded && typeof google !== 'undefined' && google?.accounts?.id) {
      return Promise.resolve();
    }
    if (this.scriptLoadingPromise) {
      return this.scriptLoadingPromise;
    }

    this.scriptLoadingPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      const existingScript = document.getElementById('google-gsi-client');
      if (existingScript) {
        this.scriptLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      script.onerror = (err) => {
        this.scriptLoadingPromise = null;
        reject(err);
      };
      document.head.appendChild(script);
    });

    return this.scriptLoadingPromise;
  }

  /**
   * Initializes Google Identity Services
   */
  public async initializeGsi(onCredential: (idToken: string) => void): Promise<void> {
    const clientId = this.getClientId();
    if (!clientId) return;

    await this.loadGsiScript();

    if (typeof google !== 'undefined' && google?.accounts?.id) {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          this.ngZone.run(() => {
            if (response && response.credential) {
              onCredential(response.credential);
            }
          });
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    }
  }

  /**
   * Renders the official Google button in the target DOM element
   */
  public renderButton(container: HTMLElement, onCredential: (idToken: string) => void): void {
    const clientId = this.getClientId();
    if (!clientId || !container) return;

    this.initializeGsi(onCredential).then(() => {
      if (typeof google !== 'undefined' && google?.accounts?.id && container) {
        container.innerHTML = '';
        google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: container.offsetWidth || 340,
        });
      }
    }).catch(() => {});
  }

  /**
   * Programmatically opens the Google One Tap / GIS account picker
   */
  public prompt(): void {
    if (typeof google !== 'undefined' && google?.accounts?.id) {
      google.accounts.id.prompt();
    }
  }

  /**
   * Performs native Google Sign In on Android using Capacitor Social Login plugin
   */
  public async signInNative(
    role?: string
  ): Promise<{ success: boolean; needsProfile?: boolean; error?: string; cancelled?: boolean }> {
    const webClientId = this.getClientId();
    if (!webClientId) {
      return { success: false, error: 'Google sign in is currently unavailable.' };
    }

    try {
      await SocialLogin.initialize({
        google: {
          webClientId: webClientId,
          mode: 'online',
        },
      });

      // Preferred fix: do not request scopes at all (omit the option).
      // The ID token already carries email, name and picture, and our backend only verifies the ID token.
      const response = await SocialLogin.login({
        provider: 'google',
        options: {
          style: 'standard',
        },
      });

      const idToken = (response?.result as any)?.idToken;
      if (!idToken) {
        return { success: false, error: 'Unable to retrieve Google credentials. Please try again.' };
      }

      return await this.submitGoogleToken(idToken, role);
    } catch (err: any) {
      return this.parseNativeGoogleError(err);
    }
  }

  /**
   * Maps raw native plugin error into real, readable error messages with no dashes
   */
  private parseNativeGoogleError(err: any): { success: false; cancelled?: boolean; error: string } {
    const rawMsg = (
      (typeof err === 'string' ? err : '') +
      ' ' +
      (err?.message || '') +
      ' ' +
      (err?.code || '') +
      ' ' +
      (err?.errorMessage || '') +
      ' ' +
      JSON.stringify(err || {})
    ).toLowerCase();

    // 1. User cancelled
    if (
      err?.code === 'USER_CANCELLED' ||
      rawMsg.includes('user_cancelled') ||
      rawMsg.includes('cancelled') ||
      rawMsg.includes('canceled') ||
      rawMsg.includes('cancellation')
    ) {
      return {
        success: false,
        cancelled: true,
        error: 'Google sign in was cancelled.',
      };
    }

    // 2. No Google account on device
    if (
      rawMsg.includes('nocredentialexception') ||
      rawMsg.includes('no credentials available') ||
      rawMsg.includes('no credential') ||
      rawMsg.includes('no accounts') ||
      rawMsg.includes('no google accounts')
    ) {
      return {
        success: false,
        error: 'No Google account found on this device. Please add a Google account in your phone settings and try again.',
      };
    }

    // 3. Developer error / Code 10 / SHA 1 or package mismatch
    if (
      rawMsg.includes('developer console') ||
      rawMsg.includes('developer_error') ||
      rawMsg.includes('code 10') ||
      rawMsg.includes('[10]') ||
      rawMsg.includes('10:') ||
      rawMsg.includes('28444') ||
      rawMsg.includes('signingsha1') ||
      rawMsg.includes('oauth is not configured') ||
      rawMsg.includes('misconfiguration')
    ) {
      return {
        success: false,
        error: 'Google sign in configuration error. Please verify the application package and signing certificate in Google Cloud Console.',
      };
    }

    // 4. Missing Google Play services
    if (
      rawMsg.includes('play services') ||
      rawMsg.includes('playservices') ||
      rawMsg.includes('service_missing') ||
      rawMsg.includes('service_disabled') ||
      rawMsg.includes('service_version_update_required') ||
      rawMsg.includes('googleplayservicesnotavailableexception')
    ) {
      return {
        success: false,
        error: 'Google Play services is required on this device for Google sign in. Please install or enable Google Play services.',
      };
    }

    // 5. Offline / Network connectivity issue
    if (
      rawMsg.includes('network') ||
      rawMsg.includes('offline') ||
      rawMsg.includes('connection') ||
      rawMsg.includes('timeout') ||
      rawMsg.includes('unreachable') ||
      rawMsg.includes('unknownhostexception') ||
      rawMsg.includes('sockettimeoutexception') ||
      rawMsg.includes('[7]') ||
      rawMsg.includes('7:')
    ) {
      return {
        success: false,
        error: 'You are currently offline. Please check your internet connection and try again.',
      };
    }

    // 6. Account reauth failed (code 16)
    if (rawMsg.includes('account reauth failed') || rawMsg.includes('[16]') || rawMsg.includes('16:')) {
      return {
        success: false,
        error: 'Google account authentication failed. Please check your Google account settings or try again.',
      };
    }

    // 7. Generic fallback without exposing raw plugin text and with strictly no dashes
    return {
      success: false,
      error: 'Unable to complete Google sign in at this time. Please try again or use password login.',
    };
  }

  /**
   * Submits Google ID Token to Grih360 backend
   */
  public async submitGoogleToken(
    idToken: string,
    role?: string,
    phone?: string
  ): Promise<{ success: boolean; needsProfile?: boolean; error?: string }> {
    try {
      const res: any = await this.authService.loginWithGoogle(idToken, role, phone).toPromise();

      if (res && res.needsProfile) {
        this.profileRequired$.next({
          idToken,
          email: res.data?.email || '',
          name: res.data?.name || '',
          profileImage: res.data?.profileImage,
          suggestedRole: role || res.data?.suggestedRole || 'TENANT',
        });
        return { success: true, needsProfile: true };
      }

      if (res && res.success && res.data?.user) {
        const user = res.data.user;
        this.redirectUserByRole(user.role);
        return { success: true };
      }

      return { success: false, error: res?.message || 'Authentication failed' };
    } catch (err: any) {
      const msg = err?.error?.message || err?.message || 'Google authentication failed';
      return { success: false, error: msg };
    }
  }

  public redirectUserByRole(role: string): void {
    const r = (role || '').toUpperCase();
    if (r === 'OWNER') {
      this.router.navigate(['/owner/dashboard']);
    } else if (r === 'PROFESSIONAL') {
      this.router.navigate(['/professional/dashboard']);
    } else {
      this.router.navigate(['/tenant/dashboard']);
    }
  }
}

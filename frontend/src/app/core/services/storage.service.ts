import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly TOKEN_KEY = 'nivas360_auth_token';
  private readonly REFRESH_TOKEN_KEY = 'nivas360_refresh_token';
  private readonly USER_KEY = 'nivas360_user_session';

  private cachedToken: string | null = null;
  private cachedRefreshToken: string | null = null;
  private isInitialized = false;

  constructor() {
    this.loadInitialTokens();
  }

  private loadInitialTokens(): void {
    try {
      this.cachedToken = localStorage.getItem(this.TOKEN_KEY);
      this.cachedRefreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch {
      this.cachedToken = null;
      this.cachedRefreshToken = null;
    }

    if (Capacitor.isNativePlatform()) {
      Promise.all([
        Preferences.get({ key: this.TOKEN_KEY }),
        Preferences.get({ key: this.REFRESH_TOKEN_KEY }),
      ])
        .then(([tokenRes, refreshRes]) => {
          if (tokenRes.value) this.cachedToken = tokenRes.value;
          if (refreshRes.value) this.cachedRefreshToken = refreshRes.value;
          this.isInitialized = true;
        })
        .catch(() => {
          this.isInitialized = true;
        });
    } else {
      this.isInitialized = true;
    }
  }

  public async initNativeStorage(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        const [tokenRes, refreshRes] = await Promise.all([
          Preferences.get({ key: this.TOKEN_KEY }),
          Preferences.get({ key: this.REFRESH_TOKEN_KEY }),
        ]);
        if (tokenRes.value) this.cachedToken = tokenRes.value;
        if (refreshRes.value) this.cachedRefreshToken = refreshRes.value;
      } catch (e) {
        // Fallback to in-memory/localStorage
      }
    }
    this.isInitialized = true;
  }

  /**
   * Save session auth token persistently
   */
  public setToken(token: string): void {
    this.cachedToken = token;
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch (e) {}

    if (Capacitor.isNativePlatform()) {
      Preferences.set({ key: this.TOKEN_KEY, value: token }).catch(() => {});
    }
  }

  public getToken(): string | null {
    if (this.cachedToken) return this.cachedToken;
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Save refresh token persistently
   */
  public setRefreshToken(refreshToken: string): void {
    this.cachedRefreshToken = refreshToken;
    try {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    } catch (e) {}

    if (Capacitor.isNativePlatform()) {
      Preferences.set({ key: this.REFRESH_TOKEN_KEY, value: refreshToken }).catch(() => {});
    }
  }

  public getRefreshToken(): string | null {
    if (this.cachedRefreshToken) return this.cachedRefreshToken;
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public removeToken(): void {
    this.cachedToken = null;
    try {
      localStorage.removeItem(this.TOKEN_KEY);
    } catch (e) {}

    if (Capacitor.isNativePlatform()) {
      Preferences.remove({ key: this.TOKEN_KEY }).catch(() => {});
    }
  }

  /**
   * Clear user session state
   */
  public clearSession(): void {
    this.cachedToken = null;
    this.cachedRefreshToken = null;
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch (e) {}

    if (Capacitor.isNativePlatform()) {
      Promise.all([
        Preferences.remove({ key: this.TOKEN_KEY }),
        Preferences.remove({ key: this.REFRESH_TOKEN_KEY }),
        Preferences.remove({ key: this.USER_KEY }),
      ]).catch(() => {});
    }
  }
}

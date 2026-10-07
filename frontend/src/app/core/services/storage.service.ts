import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly TOKEN_KEY = 'nivas360_auth_token';
  private readonly REFRESH_TOKEN_KEY = 'nivas360_refresh_token';
  private readonly USER_KEY = 'nivas360_user_session';

  private cachedToken: string | null = null;
  private cachedRefreshToken: string | null = null;
  private cachedUser: User | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initNativeStorage();
  }

  public initNativeStorage(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.performInit();
    }
    return this.initPromise;
  }

  private async performInit(): Promise<void> {
    // 1. Initial attempt from localStorage for web fast-path
    try {
      this.cachedToken = localStorage.getItem(this.TOKEN_KEY);
      this.cachedRefreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      const userStr = localStorage.getItem(this.USER_KEY);
      if (userStr) {
        this.cachedUser = JSON.parse(userStr);
      }
    } catch {
      this.cachedToken = null;
      this.cachedRefreshToken = null;
      this.cachedUser = null;
    }

    // 2. Read from @capacitor/preferences on Native Platform
    if (Capacitor.isNativePlatform()) {
      try {
        const [tokenRes, refreshRes, userRes] = await Promise.all([
          Preferences.get({ key: this.TOKEN_KEY }),
          Preferences.get({ key: this.REFRESH_TOKEN_KEY }),
          Preferences.get({ key: this.USER_KEY }),
        ]);

        if (tokenRes.value) this.cachedToken = tokenRes.value;
        if (refreshRes.value) this.cachedRefreshToken = refreshRes.value;
        if (userRes.value) {
          try {
            this.cachedUser = JSON.parse(userRes.value);
          } catch {}
        }
      } catch (e) {}
    }

    this.isInitialized = true;
  }

  public async setToken(token: string): Promise<void> {
    this.cachedToken = token;
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch (e) {}

    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: this.TOKEN_KEY, value: token }).catch(() => {});
    }
  }

  public getToken(): string | null {
    return this.cachedToken;
  }

  public async setRefreshToken(refreshToken: string): Promise<void> {
    this.cachedRefreshToken = refreshToken;
    try {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    } catch (e) {}

    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: this.REFRESH_TOKEN_KEY, value: refreshToken }).catch(() => {});
    }
  }

  public getRefreshToken(): string | null {
    return this.cachedRefreshToken;
  }

  public async setUser(user: User): Promise<void> {
    this.cachedUser = user;
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (e) {}

    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: this.USER_KEY, value: JSON.stringify(user) }).catch(() => {});
    }
  }

  public getUser(): User | null {
    return this.cachedUser;
  }

  public async removeToken(): Promise<void> {
    this.cachedToken = null;
    try {
      localStorage.removeItem(this.TOKEN_KEY);
    } catch (e) {}

    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: this.TOKEN_KEY }).catch(() => {});
    }
  }

  public async clearSession(): Promise<void> {
    this.cachedToken = null;
    this.cachedRefreshToken = null;
    this.cachedUser = null;
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch (e) {}

    if (Capacitor.isNativePlatform()) {
      await Promise.all([
        Preferences.remove({ key: this.TOKEN_KEY }),
        Preferences.remove({ key: this.REFRESH_TOKEN_KEY }),
        Preferences.remove({ key: this.USER_KEY }),
      ]).catch(() => {});
    }
  }
}

import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly TOKEN_KEY = 'grih360_auth_token';
  private readonly REFRESH_TOKEN_KEY = 'grih360_refresh_token';
  private readonly USER_KEY = 'grih360_user_session';

  // Legacy keys for seamless one-time migration
  private readonly LEGACY_TOKEN_KEY = 'nivas360_auth_token';
  private readonly LEGACY_REFRESH_TOKEN_KEY = 'nivas360_refresh_token';
  private readonly LEGACY_USER_KEY = 'nivas360_user_session';

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
    // 1. Initial attempt from localStorage for web fast-path with transparent migration
    try {
      // Check new keys first
      this.cachedToken = localStorage.getItem(this.TOKEN_KEY);
      this.cachedRefreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      const userStr = localStorage.getItem(this.USER_KEY);
      if (userStr) {
        this.cachedUser = JSON.parse(userStr);
      }

      // If missing, migrate transparently from legacy nivas360_* keys
      if (!this.cachedToken) {
        const legacyToken = localStorage.getItem(this.LEGACY_TOKEN_KEY);
        if (legacyToken) {
          this.cachedToken = legacyToken;
          localStorage.setItem(this.TOKEN_KEY, legacyToken);
          localStorage.removeItem(this.LEGACY_TOKEN_KEY);
        }
      }
      if (!this.cachedRefreshToken) {
        const legacyRefresh = localStorage.getItem(this.LEGACY_REFRESH_TOKEN_KEY);
        if (legacyRefresh) {
          this.cachedRefreshToken = legacyRefresh;
          localStorage.setItem(this.REFRESH_TOKEN_KEY, legacyRefresh);
          localStorage.removeItem(this.LEGACY_REFRESH_TOKEN_KEY);
        }
      }
      if (!this.cachedUser) {
        const legacyUserStr = localStorage.getItem(this.LEGACY_USER_KEY);
        if (legacyUserStr) {
          try {
            this.cachedUser = JSON.parse(legacyUserStr);
            localStorage.setItem(this.USER_KEY, legacyUserStr);
            localStorage.removeItem(this.LEGACY_USER_KEY);
          } catch {}
        }
      }
    } catch {
      this.cachedToken = null;
      this.cachedRefreshToken = null;
      this.cachedUser = null;
    }

    // 2. Read from @capacitor/preferences on Native Platform with transparent migration
    if (Capacitor.isNativePlatform()) {
      try {
        let [tokenRes, refreshRes, userRes] = await Promise.all([
          Preferences.get({ key: this.TOKEN_KEY }),
          Preferences.get({ key: this.REFRESH_TOKEN_KEY }),
          Preferences.get({ key: this.USER_KEY }),
        ]);

        // If not in new keys, migrate from legacy keys
        if (!tokenRes.value) {
          const legacyTokenRes = await Preferences.get({ key: this.LEGACY_TOKEN_KEY });
          if (legacyTokenRes.value) {
            tokenRes = legacyTokenRes;
            await Preferences.set({ key: this.TOKEN_KEY, value: legacyTokenRes.value });
            await Preferences.remove({ key: this.LEGACY_TOKEN_KEY });
          }
        }
        if (!refreshRes.value) {
          const legacyRefreshRes = await Preferences.get({ key: this.LEGACY_REFRESH_TOKEN_KEY });
          if (legacyRefreshRes.value) {
            refreshRes = legacyRefreshRes;
            await Preferences.set({ key: this.REFRESH_TOKEN_KEY, value: legacyRefreshRes.value });
            await Preferences.remove({ key: this.LEGACY_REFRESH_TOKEN_KEY });
          }
        }
        if (!userRes.value) {
          const legacyUserRes = await Preferences.get({ key: this.LEGACY_USER_KEY });
          if (legacyUserRes.value) {
            userRes = legacyUserRes;
            await Preferences.set({ key: this.USER_KEY, value: legacyUserRes.value });
            await Preferences.remove({ key: this.LEGACY_USER_KEY });
          }
        }

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

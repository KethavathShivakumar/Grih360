import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly TOKEN_KEY = 'nivas360_auth_token';
  private readonly USER_KEY = 'nivas360_user_session';

  /**
   * Save session auth token securely
   */
  public setToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch (e) {
      console.error('[StorageService] Error setting token:', e);
    }
  }

  public getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (e) {
      return null;
    }
  }

  public removeToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
    } catch (e) {
      console.error('[StorageService] Error removing token:', e);
    }
  }

  /**
   * Clear user session state
   */
  public clearSession(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch (e) {
      console.error('[StorageService] Error clearing session:', e);
    }
  }
}

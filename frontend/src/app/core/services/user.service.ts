import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private apiService: ApiService) {}

  public getProfile(): Observable<{ success: boolean; data: User }> {
    return this.apiService.get<{ success: boolean; data: User }>('/users/profile');
  }

  public updateProfile(profileData: Partial<User> & Record<string, any>): Observable<{ success: boolean; data: User }> {
    return this.apiService.put<{ success: boolean; data: User }>('/users/profile', profileData);
  }

  public changePassword(data: { currentPassword: string; newPassword: string }): Observable<{ success: boolean; message: string }> {
    return this.apiService.post<{ success: boolean; message: string }>('/users/change-password', data);
  }
}
